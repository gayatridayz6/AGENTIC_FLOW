import { act, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import CartIcon, { CartIcon as NamedCartIcon } from '../components/CartIcon';
import Header, { Header as NamedHeader } from '../components/Header';
import { createAppStore } from '../store';
import { hydrateGuestCart } from '../store/cartSlice';

jest.mock('axios', () => {
  const post = jest.fn();
  return { __esModule: true, default: { create: jest.fn(() => ({ post })), post } };
});

function renderHeader(preloadedState) {
  const store = createAppStore(preloadedState);
  const utils = render(
    <Provider store={store}>
      <Header />
    </Provider>
  );
  return { store, ...utils };
}

const cartWithCount = (count) => ({
  cart: { items: [], count, statusByProduct: {}, error: null },
});

describe('Header', () => {
  it('AC4: renders a banner landmark with the site title and the cart icon', () => {
    renderHeader();
    const banner = screen.getByRole('banner');
    expect(banner).toHaveClass('site-header');
    expect(banner).toHaveTextContent('Shop');
    expect(screen.getByRole('group', { name: 'Shopping cart' })).toBeInTheDocument();
  });

  it('AC4: exposes default and named exports', () => {
    expect(NamedHeader).toBe(Header);
    expect(NamedCartIcon).toBe(CartIcon);
  });
});

describe('CartIcon / header cart counter (AC4)', () => {
  it('AC4: shows 0 for an empty cart', () => {
    renderHeader();
    expect(screen.getByTestId('cart-count')).toHaveTextContent(/^0$/);
    expect(screen.getByText('items in cart')).toBeInTheDocument();
  });

  it('AC4: shows the count from the store', () => {
    renderHeader(cartWithCount(12));
    expect(screen.getByTestId('cart-count')).toHaveTextContent(/^12$/);
    expect(screen.getByText('items in cart')).toBeInTheDocument();
  });

  it('AC4: uses the singular "item in cart" label for exactly one item', () => {
    renderHeader(cartWithCount(1));
    expect(screen.getByText('item in cart')).toBeInTheDocument();
    expect(screen.queryByText('items in cart')).not.toBeInTheDocument();
  });

  it('AC4: updates in real time when the store count changes (no re-render by the test)', () => {
    const { store } = renderHeader();
    expect(screen.getByTestId('cart-count')).toHaveTextContent(/^0$/);

    act(() => {
      store.dispatch(hydrateGuestCart([{ productId: 'p-1', quantity: 2 }]));
    });
    expect(screen.getByTestId('cart-count')).toHaveTextContent(/^2$/);

    act(() => {
      store.dispatch(
        hydrateGuestCart([
          { productId: 'p-1', quantity: 2 },
          { productId: 'p-2', quantity: 3 },
        ])
      );
    });
    expect(screen.getByTestId('cart-count')).toHaveTextContent(/^5$/);
  });

  it('AC4: announces changes politely to assistive tech (aria-live, role=status)', () => {
    renderHeader(cartWithCount(3));
    const badge = screen.getByTestId('cart-count');
    expect(badge).toHaveAttribute('role', 'status');
    expect(badge).toHaveAttribute('aria-live', 'polite');
    expect(badge).toHaveAttribute('aria-atomic', 'true');
  });

  it('AC4: hides the decorative svg from assistive tech', () => {
    const { container } = renderHeader();
    const svg = container.querySelector('svg.cart-icon__svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('focusable', 'false');
  });
});
