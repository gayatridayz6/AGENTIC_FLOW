import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-toastify';
import App from '../App';
import CartBadge from '../components/CartBadge';
import { products } from '../data/products';
import { createAppStore } from '../store';
import { setToken } from '../store/authSlice';

jest.mock('axios', () => ({ __esModule: true, default: { post: jest.fn(), get: jest.fn() } }));
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
  ToastContainer: () => null,
}));

const buttonFor = (id) => within(screen.getByTestId(`product-card-${id}`)).getByRole('button');

const renderApp = (store = createAppStore()) => {
  render(
    <Provider store={store}>
      <App products={products} />
    </Provider>
  );
  return store;
};

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
});

describe('AC2 - Action and feedback', () => {
  it('shouldShowAddedFeedbackAndIncrementCartBadgeWhenAddToCartClicked', async () => {
    const store = renderApp();
    const user = userEvent.setup();
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');

    await user.click(buttonFor('p-1001'));

    expect(await screen.findByRole('button', { name: 'Added ✓' })).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Item added to cart!', expect.any(Object));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('1');
    expect(store.getState().cart.items).toEqual([{ productId: 'p-1001', quantity: 1 }]);

    await user.click(buttonFor('p-1002'));
    await waitFor(() => expect(screen.getByTestId('cart-count')).toHaveTextContent('2'));
  });

  it('shouldCapBadgeAtNinetyNinePlusWhenCountExceedsNinetyNine', () => {
    const store = createAppStore({
      auth: { token: null },
      cart: { items: [], count: 150, status: 'idle', error: null },
    });
    render(
      <Provider store={store}>
        <CartBadge />
      </Provider>
    );
    expect(screen.getByTestId('cart-count')).toHaveTextContent('99+');
  });

  it('shouldShowErrorToastAndKeepCountWhenBackendFailsWithServerError', async () => {
    const store = createAppStore();
    store.dispatch(setToken('tok-1'));
    axios.get.mockResolvedValue({ data: { items: [], totalCount: 0 } });
    axios.post.mockRejectedValue({ response: { status: 500 } });
    renderApp(store);

    await userEvent.setup().click(buttonFor('p-1001'));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Something went wrong. Please try again.', expect.any(Object))
    );
    const retryButton = within(screen.getByTestId('product-card-p-1001')).getByRole('button', { name: 'Add to Cart' });
    expect(retryButton).toBeEnabled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
  });
});

describe('AC3 - Out of stock reported by backend', () => {
  it('shouldSwitchButtonToOutOfStockWhenBackendRespondsConflict', async () => {
    const store = createAppStore();
    store.dispatch(setToken('tok-1'));
    axios.get.mockResolvedValue({ data: { items: [], totalCount: 0 } });
    axios.post.mockRejectedValue({ response: { status: 409 } });
    renderApp(store);

    await userEvent.setup().click(buttonFor('p-1002'));

    const button = await screen.findByRole('button', { name: 'Insulated Bottle is out of stock' });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Out of Stock');
    expect(toast.error).toHaveBeenCalledWith('Sorry, this item is out of stock.', expect.any(Object));
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
  });
});
