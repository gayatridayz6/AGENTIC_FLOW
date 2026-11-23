import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { Provider } from 'react-redux';
import { toast } from 'react-toastify';
import AddToCartButton, {
  ADDED_DURATION_MS,
  AddToCartButton as NamedAddToCartButton,
  SUCCESS_MESSAGE,
  getButtonState,
} from '../components/AddToCartButton';
import { GENERIC_ERROR_MESSAGE } from '../services/cartService';
import { createAppStore } from '../store';
import { resetAddStatus, selectAddStatus, selectCartCount } from '../store/cartSlice';

jest.mock('axios', () => {
  const post = jest.fn();
  return { __esModule: true, default: { create: jest.fn(() => ({ post })), post } };
});
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
  ToastContainer: () => null,
}));

const mockPost = axios.post;

const inStockProduct = { id: 'p-1001', name: 'Classic Cotton T-Shirt', price: 19.99, imageUrl: '', inStock: true };
const outOfStockProduct = { id: 'p-1003', name: 'Stainless Water Bottle', price: 24, imageUrl: '', inStock: false };

const cartWithStatus = (statusByProduct) => ({
  cart: { items: [], count: 0, statusByProduct, error: null },
});

function renderButton(product, preloadedState) {
  const store = createAppStore(preloadedState);
  const utils = render(
    <Provider store={store}>
      <AddToCartButton product={product} />
    </Provider>
  );
  return { store, ...utils };
}

const getButton = () => screen.getByRole('button');
const flushAsync = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });

beforeEach(() => {
  mockPost.mockReset();
  toast.success.mockClear();
  toast.error.mockClear();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('getButtonState (pure mapping)', () => {
  it('AC9: idle when in stock with no status', () => {
    expect(getButtonState(true, 'idle')).toEqual({ key: 'idle', label: 'Add to Cart', disabled: false });
    expect(getButtonState(true, undefined)).toEqual({ key: 'idle', label: 'Add to Cart', disabled: false });
  });

  it('AC9: adding', () => {
    expect(getButtonState(true, 'adding')).toEqual({ key: 'adding', label: 'Adding...', disabled: true });
  });

  it('AC9/AC3: added', () => {
    expect(getButtonState(true, 'added')).toEqual({ key: 'added', label: 'Added ✓', disabled: true });
  });

  it('AC9: error is retryable', () => {
    expect(getButtonState(true, 'error')).toEqual({ key: 'error', label: 'Try again', disabled: false });
  });

  it('AC5: out of stock when inStock is false, regardless of status', () => {
    const expected = { key: 'out_of_stock', label: 'Out of Stock', disabled: true };
    expect(getButtonState(false, 'idle')).toEqual(expected);
    expect(getButtonState(false, 'added')).toEqual(expected);
    expect(getButtonState(false, 'adding')).toEqual(expected);
  });

  it('AC5: out of stock when the server reported out_of_stock', () => {
    expect(getButtonState(true, 'out_of_stock')).toEqual({
      key: 'out_of_stock',
      label: 'Out of Stock',
      disabled: true,
    });
  });

  it('AC9: exports constants and both default and named component', () => {
    expect(ADDED_DURATION_MS).toBe(2000);
    expect(SUCCESS_MESSAGE).toBe('Item added to cart!');
    expect(NamedAddToCartButton).toBe(AddToCartButton);
  });
});

describe('AC9: AddToCartButton UI component states', () => {
  describe('In stock state', () => {
    it('AC1/AC9: renders an enabled "Add to Cart" button', () => {
      renderButton(inStockProduct);
      const button = screen.getByRole('button', { name: 'Add to Cart: Classic Cotton T-Shirt' });
      expect(button).toBeEnabled();
      expect(button).toHaveTextContent(/^Add to Cart$/);
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveClass('add-to-cart-btn', 'add-to-cart-btn--idle');
      expect(button).toHaveAttribute('aria-disabled', 'false');
      expect(button).toHaveAttribute('aria-busy', 'false');
    });

    it('AC9: has an empty live-region status while idle', () => {
      renderButton(inStockProduct);
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });
  });

  describe('Out of stock state', () => {
    it('AC5/AC9: renders a disabled button labelled exactly "Out of Stock"', () => {
      renderButton(outOfStockProduct);
      const button = screen.getByRole('button', { name: 'Out of Stock: Stainless Water Bottle' });
      expect(button).toBeDisabled();
      expect(button).toHaveTextContent(/^Out of Stock$/);
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toHaveClass('add-to-cart-btn--out_of_stock');
    });

    it('AC5: clicking an out-of-stock button dispatches nothing', async () => {
      const user = userEvent.setup();
      const { store } = renderButton(outOfStockProduct);

      await user.click(getButton());
      fireEvent.click(getButton());
      await flushAsync();

      expect(selectAddStatus('p-1003')(store.getState())).toBe('idle');
      expect(selectCartCount(store.getState())).toBe(0);
      expect(window.localStorage.getItem('guest_cart')).toBeNull();
      expect(mockPost).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('AC5: out of stock wins over a stale "added" status', () => {
      renderButton(outOfStockProduct, cartWithStatus({ 'p-1003': 'added' }));
      expect(getButton()).toHaveTextContent(/^Out of Stock$/);
      expect(getButton()).toBeDisabled();
    });

    it('AC5: a server-reported out_of_stock status disables an in-stock product', () => {
      renderButton(inStockProduct, cartWithStatus({ 'p-1001': 'out_of_stock' }));
      expect(getButton()).toHaveTextContent(/^Out of Stock$/);
      expect(getButton()).toBeDisabled();
    });

    it('AC5: HTTP 409 from the API turns the button into "Out of Stock" without an error toast', async () => {
      const user = userEvent.setup();
      mockPost.mockRejectedValueOnce({ response: { status: 409 } });
      const { store } = renderButton(inStockProduct, { auth: { isAuthenticated: true } });

      await user.click(getButton());

      expect(await screen.findByText('Out of Stock')).toBeInTheDocument();
      expect(getButton()).toBeDisabled();
      expect(selectAddStatus('p-1001')(store.getState())).toBe('out_of_stock');
      await flushAsync();
      expect(toast.error).not.toHaveBeenCalled();
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe('Success state', () => {
    it('AC2/AC3/AC9: clicking adds the item, shows "Added ✓" and announces success', async () => {
      const user = userEvent.setup();
      const { store } = renderButton(inStockProduct);

      await user.click(getButton());

      expect(await screen.findByText('Added ✓')).toBeInTheDocument();
      expect(getButton()).toBeDisabled();
      expect(getButton()).toHaveClass('add-to-cart-btn--added');
      expect(getButton()).toHaveAttribute('aria-label', 'Added ✓: Classic Cotton T-Shirt');
      expect(screen.getByRole('status')).toHaveTextContent('Item added to cart!');
      expect(selectCartCount(store.getState())).toBe(1);
      expect(selectAddStatus('p-1001')(store.getState())).toBe('added');
    });

    it('AC3: shows the toast "Item added to cart!" exactly once', async () => {
      const user = userEvent.setup();
      renderButton(inStockProduct);

      await user.click(getButton());

      await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Item added to cart!'));
      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('AC3: reverts from "Added ✓" to "Add to Cart" after ~2 seconds', async () => {
      jest.useFakeTimers();
      renderButton(inStockProduct);

      fireEvent.click(getButton());
      expect(await screen.findByText('Added ✓')).toBeInTheDocument();

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(screen.getByText('Added ✓')).toBeInTheDocument();
      expect(getButton()).toBeDisabled();

      act(() => {
        jest.advanceTimersByTime(1100);
      });
      expect(screen.getByText('Add to Cart')).toBeInTheDocument();
      expect(getButton()).toBeEnabled();
      expect(screen.getByRole('status')).toBeEmptyDOMElement();
    });

    it('AC3: reverts to idle after ADDED_DURATION_MS when rendered with an "added" status', () => {
      jest.useFakeTimers();
      const { store } = renderButton(inStockProduct, cartWithStatus({ 'p-1001': 'added' }));
      expect(getButton()).toHaveTextContent(/^Added ✓$/);

      act(() => {
        jest.advanceTimersByTime(ADDED_DURATION_MS - 1);
      });
      expect(getButton()).toHaveTextContent(/^Added ✓$/);

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(getButton()).toHaveTextContent(/^Add to Cart$/);
      expect(selectAddStatus('p-1001')(store.getState())).toBe('idle');
    });

    it('AC3: the revert dispatches resetAddStatus for the product', () => {
      jest.useFakeTimers();
      const store = createAppStore(cartWithStatus({ 'p-1001': 'added' }));
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      render(
        <Provider store={store}>
          <AddToCartButton product={inStockProduct} />
        </Provider>
      );

      act(() => {
        jest.advanceTimersByTime(ADDED_DURATION_MS);
      });

      expect(dispatchSpy).toHaveBeenCalledWith(resetAddStatus('p-1001'));
    });

    it('AC3: no revert is dispatched after unmount (timer is cleaned up)', () => {
      jest.useFakeTimers();
      const store = createAppStore(cartWithStatus({ 'p-1001': 'added' }));
      const dispatchSpy = jest.spyOn(store, 'dispatch');
      const { unmount } = render(
        <Provider store={store}>
          <AddToCartButton product={inStockProduct} />
        </Provider>
      );

      unmount();
      act(() => {
        jest.advanceTimersByTime(ADDED_DURATION_MS * 2);
      });

      expect(dispatchSpy).not.toHaveBeenCalled();
      expect(selectAddStatus('p-1001')(store.getState())).toBe('added');
    });

    it('AC3: the same product can be added again after the revert (quantity merges)', async () => {
      jest.useFakeTimers();
      const { store } = renderButton(inStockProduct);

      fireEvent.click(getButton());
      await screen.findByText('Added ✓');
      act(() => {
        jest.advanceTimersByTime(ADDED_DURATION_MS + 100);
      });
      expect(getButton()).toBeEnabled();

      fireEvent.click(getButton());
      await screen.findByText('Added ✓');

      expect(selectCartCount(store.getState())).toBe(2);
      expect(JSON.parse(window.localStorage.getItem('guest_cart'))).toEqual([
        { productId: 'p-1001', quantity: 2 },
      ]);
    });
  });

  describe('Adding (in-flight) state', () => {
    it('AC9: shows "Adding..." (disabled, aria-busy) until the API responds, then "Added ✓"', async () => {
      const user = userEvent.setup();
      let resolvePost;
      mockPost.mockReturnValueOnce(new Promise((resolve) => { resolvePost = resolve; }));
      renderButton(inStockProduct, { auth: { isAuthenticated: true } });

      await user.click(getButton());

      expect(await screen.findByText('Adding...')).toBeInTheDocument();
      expect(getButton()).toBeDisabled();
      expect(getButton()).toHaveAttribute('aria-busy', 'true');
      expect(getButton()).toHaveClass('add-to-cart-btn--adding');

      await act(async () => {
        resolvePost({ data: { items: [{ productId: 'p-1001', quantity: 1 }], count: 1 } });
      });
      expect(await screen.findByText('Added ✓')).toBeInTheDocument();
    });

    it('AC2: a second click while adding does not send a second request', async () => {
      const user = userEvent.setup();
      let resolvePost;
      mockPost.mockReturnValueOnce(new Promise((resolve) => { resolvePost = resolve; }));
      renderButton(inStockProduct, { auth: { isAuthenticated: true } });

      await user.click(getButton());
      await screen.findByText('Adding...');
      await user.click(getButton());
      fireEvent.click(getButton());

      expect(mockPost).toHaveBeenCalledTimes(1);
      await act(async () => {
        resolvePost({ data: { items: [{ productId: 'p-1001', quantity: 1 }], count: 1 } });
      });
      await screen.findByText('Added ✓');
    });
  });

  describe('Error state', () => {
    it('AC7/AC9: a 500 shows "Try again" (enabled) and a generic error toast', async () => {
      const user = userEvent.setup();
      mockPost.mockRejectedValueOnce({ response: { status: 500, data: { message: 'stack trace' } } });
      const { store } = renderButton(inStockProduct, { auth: { isAuthenticated: true } });

      await user.click(getButton());

      expect(await screen.findByText('Try again')).toBeInTheDocument();
      expect(getButton()).toBeEnabled();
      expect(getButton()).toHaveClass('add-to-cart-btn--error');
      expect(store.getState().cart.error).toBe(GENERIC_ERROR_MESSAGE);
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(GENERIC_ERROR_MESSAGE));
      expect(toast.success).not.toHaveBeenCalled();
      expect(selectCartCount(store.getState())).toBe(0);
    });

    it('AC7: a 400 shows the error state', async () => {
      const user = userEvent.setup();
      mockPost.mockRejectedValueOnce({ response: { status: 400 } });
      renderButton(inStockProduct, { auth: { isAuthenticated: true } });

      await user.click(getButton());

      expect(await screen.findByText('Try again')).toBeInTheDocument();
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(GENERIC_ERROR_MESSAGE));
    });

    it('AC7: a 401 shows the error state and keeps the session message in the store', async () => {
      const user = userEvent.setup();
      mockPost.mockRejectedValueOnce({ response: { status: 401 } });
      const { store } = renderButton(inStockProduct, { auth: { isAuthenticated: true } });

      await user.click(getButton());

      expect(await screen.findByText('Try again')).toBeInTheDocument();
      expect(store.getState().cart.error).toBe('Your session has expired. Please sign in again.');
      // Observation: the UI toast uses the generic message, not the session-expired one.
      await waitFor(() => expect(toast.error).toHaveBeenCalledWith(GENERIC_ERROR_MESSAGE));
    });

    it('AC7: retrying after an error succeeds', async () => {
      const user = userEvent.setup();
      mockPost
        .mockRejectedValueOnce({ response: { status: 503 } })
        .mockResolvedValueOnce({ data: { items: [{ productId: 'p-1001', quantity: 1 }], count: 1 } });
      const { store } = renderButton(inStockProduct, { auth: { isAuthenticated: true } });

      await user.click(getButton());
      await screen.findByText('Try again');
      await user.click(getButton());

      expect(await screen.findByText('Added ✓')).toBeInTheDocument();
      expect(mockPost).toHaveBeenCalledTimes(2);
      expect(selectCartCount(store.getState())).toBe(1);
    });
  });

  describe('Logged-in request contract', () => {
    it('AC7/AC8: sends POST /api/cart/add with {productId, quantity: 1} for logged-in users only', async () => {
      const user = userEvent.setup();
      mockPost.mockResolvedValueOnce({ data: { items: [{ productId: 'p-1001', quantity: 1 }], count: 1 } });
      renderButton(inStockProduct, { auth: { isAuthenticated: true } });

      await user.click(getButton());
      await screen.findByText('Added ✓');

      expect(mockPost).toHaveBeenCalledWith('/api/cart/add', { productId: 'p-1001', quantity: 1 });
      expect(window.localStorage.getItem('guest_cart')).toBeNull();
    });

    it('AC6: guests never call the API', async () => {
      const user = userEvent.setup();
      renderButton(inStockProduct);

      await user.click(getButton());
      await screen.findByText('Added ✓');

      expect(mockPost).not.toHaveBeenCalled();
      expect(JSON.parse(window.localStorage.getItem('guest_cart'))).toEqual([
        { productId: 'p-1001', quantity: 1 },
      ]);
    });
  });
});
