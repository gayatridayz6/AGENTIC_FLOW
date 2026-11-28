import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { Provider } from 'react-redux';
import { toast } from 'react-toastify';
import AddToCartButton, { ADDED_DURATION_MS, SUCCESS_MESSAGE } from '../components/AddToCartButton';
import { GENERIC_ERROR_MESSAGE } from '../services/cartService';
import { GUEST_CART_KEY } from '../services/cartStorage';
import { createAppStore } from '../store';

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

let setItemSpy;

function renderButton(product, preloadedState) {
  const store = createAppStore(preloadedState);
  render(
    <Provider store={store}>
      <AddToCartButton product={product} />
    </Provider>
  );
  return store;
}

beforeEach(() => {
  window.localStorage.clear();
  mockPost.mockReset();
  toast.success.mockClear();
  toast.error.mockClear();
});

afterEach(() => {
  if (setItemSpy) {
    setItemSpy.mockRestore();
    setItemSpy = undefined;
  }
  jest.useRealTimers();
});

describe('AC-2 Clicking adds the item to the cart', () => {
  it('shouldAddProductToCartWhenAddToCartButtonClicked', async () => {
    const user = userEvent.setup();
    const store = renderButton(inStockProduct);
    await user.click(screen.getByRole('button', { name: /Add to Cart: Classic Cotton T-Shirt/ }));
    await waitFor(() =>
      expect(store.getState().cart.items).toEqual([{ productId: 'p-1001', quantity: 1 }])
    );
  });
});

describe('AC-3 Visual indicator after adding', () => {
  it('shouldShowAddedLabelAndSuccessToastWhenAddSucceeds', async () => {
    const user = userEvent.setup();
    renderButton(inStockProduct);
    await user.click(screen.getByRole('button', { name: /Add to Cart/ }));
    expect(await screen.findByRole('button', { name: /Added ✓/ })).toBeDisabled();
    expect(toast.success).toHaveBeenCalledWith(SUCCESS_MESSAGE);
  });

  it('shouldRevertToAddToCartLabelWhenAddedDurationElapses', () => {
    jest.useFakeTimers();
    renderButton(inStockProduct, {
      cart: { items: [], count: 0, statusByProduct: { 'p-1001': 'added' }, error: null },
    });
    expect(screen.getByRole('button', { name: /Added ✓/ })).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(ADDED_DURATION_MS);
    });
    expect(screen.getByRole('button', { name: /Add to Cart/ })).toBeEnabled();
  });

  it('shouldShowErrorToastAndTryAgainLabelWhenAddFails', async () => {
    const user = userEvent.setup();
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    renderButton(inStockProduct);
    await user.click(screen.getByRole('button', { name: /Add to Cart/ }));
    expect(await screen.findByRole('button', { name: /Try again/ })).toBeEnabled();
    expect(toast.error).toHaveBeenCalledWith(GENERIC_ERROR_MESSAGE);
    expect(toast.success).not.toHaveBeenCalled();
  });
});

describe('AC-5 Out of stock handling', () => {
  it('shouldDisableButtonAndShowOutOfStockWhenProductNotInStock', () => {
    renderButton(outOfStockProduct);
    const button = screen.getByRole('button', { name: /Out of Stock/ });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Out of Stock');
  });

  it('shouldNotAddToCartWhenOutOfStockButtonClicked', async () => {
    const user = userEvent.setup();
    const store = renderButton(outOfStockProduct);
    await user.click(screen.getByRole('button', { name: /Out of Stock/ }));
    expect(store.getState().cart.items).toEqual([]);
    expect(window.localStorage.getItem(GUEST_CART_KEY)).toBeNull();
    expect(mockPost).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('shouldSwitchToOutOfStockWhenServerRespondsWith409', async () => {
    const user = userEvent.setup();
    mockPost.mockRejectedValue({ response: { status: 409 } });
    renderButton(inStockProduct, { auth: { isAuthenticated: true } });
    await user.click(screen.getByRole('button', { name: /Add to Cart/ }));
    expect(await screen.findByRole('button', { name: /Out of Stock/ })).toBeDisabled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
