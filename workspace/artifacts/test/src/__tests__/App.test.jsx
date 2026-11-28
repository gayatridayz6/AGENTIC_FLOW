import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { toast } from 'react-toastify';
import App from '../App';
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

let setItemSpy;

function renderApp() {
  const store = createAppStore();
  render(
    <Provider store={store}>
      <App />
    </Provider>
  );
  return store;
}

beforeEach(() => {
  window.localStorage.clear();
  toast.success.mockClear();
  toast.error.mockClear();
});

afterEach(() => {
  if (setItemSpy) {
    setItemSpy.mockRestore();
    setItemSpy = undefined;
  }
});

describe('AC-4 Header counter updates in real time (integration)', () => {
  it('shouldIncrementHeaderCounterWhenEachProductIsAdded', async () => {
    const user = userEvent.setup();
    renderApp();
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');

    const buttons = screen.getAllByRole('button', { name: /^Add to Cart:/ });
    await user.click(buttons[0]);
    await waitFor(() => expect(screen.getByTestId('cart-count')).toHaveTextContent('1'));
    await user.click(buttons[1]);
    await waitFor(() => expect(screen.getByTestId('cart-count')).toHaveTextContent('2'));
  });

  it('shouldLeaveHeaderCounterUnchangedWhenAddFails', async () => {
    const user = userEvent.setup();
    setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    renderApp();
    await user.click(screen.getAllByRole('button', { name: /^Add to Cart:/ })[0]);
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');
  });
});

describe('AC-6 Guest cart is restored from local storage', () => {
  it('shouldShowStoredGuestCartCountWhenAppLoads', () => {
    window.localStorage.setItem(
      GUEST_CART_KEY,
      JSON.stringify([
        { productId: 'p-1001', quantity: 2 },
        { productId: 'p-1002', quantity: 1 },
      ])
    );
    renderApp();
    expect(screen.getByTestId('cart-count')).toHaveTextContent('3');
  });
});
