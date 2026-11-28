import { act, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import Header from '../components/Header';
import { createAppStore } from '../store';
import { hydrateGuestCart } from '../store/cartSlice';

jest.mock('axios', () => {
  const post = jest.fn();
  return { __esModule: true, default: { create: jest.fn(() => ({ post })), post } };
});

beforeEach(() => {
  window.localStorage.clear();
});

describe('AC-4 Header cart counter', () => {
  it('shouldShowZeroThenUpdateCounterWhenCartCountChanges', () => {
    const store = createAppStore();
    render(
      <Provider store={store}>
        <Header />
      </Provider>
    );
    expect(screen.getByTestId('cart-count')).toHaveTextContent('0');

    act(() => {
      store.dispatch(
        hydrateGuestCart([
          { productId: 'p-1', quantity: 2 },
          { productId: 'p-2', quantity: 3 },
        ])
      );
    });
    expect(screen.getByTestId('cart-count')).toHaveTextContent('5');
  });
});
