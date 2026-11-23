import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axios from 'axios';
import { Provider } from 'react-redux';
import { toast } from 'react-toastify';
import App, { App as NamedApp } from '../App';
import productsData from '../data/products';
import { createAppStore } from '../store';

jest.mock('axios', () => {
  const post = jest.fn();
  return { __esModule: true, default: { create: jest.fn(() => ({ post })), post } };
});
jest.mock('react-toastify', () => {
  const React = require('react');
  return {
    toast: { success: jest.fn(), error: jest.fn() },
    ToastContainer: () => React.createElement('div', { 'data-testid': 'toast-container' }),
  };
});

const mockPost = axios.post;

function renderApp(preloadedState) {
  const store = createAppStore(preloadedState);
  const utils = render(
    <Provider store={store}>
      <App />
    </Provider>
  );
  return { store, ...utils };
}

const cardButton = (id) => within(screen.getByTestId(`product-card-${id}`)).getByRole('button');
const cartCount = () => screen.getByTestId('cart-count');

beforeEach(() => {
  mockPost.mockReset();
  toast.success.mockClear();
  toast.error.mockClear();
});

describe('App smoke test', () => {
  it('AC1: renders header, page title, product list and toast container', () => {
    renderApp();
    expect(NamedApp).toBe(App);
    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Products' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Product listing' })).toBeInTheDocument();
    expect(screen.getByTestId('toast-container')).toBeInTheDocument();
  });

  it('AC1: shows a button on every product card', () => {
    renderApp();
    expect(screen.getAllByRole('button')).toHaveLength(productsData.length);
    productsData.forEach((p) => {
      expect(cardButton(p.id)).toBeInTheDocument();
    });
  });

  it('AC4: starts with an empty cart counter', () => {
    renderApp();
    expect(cartCount()).toHaveTextContent(/^0$/);
  });
});

describe('App hydrates the guest cart from localStorage (AC6)', () => {
  it('AC6: restores the persisted guest cart count on mount', () => {
    window.localStorage.setItem(
      'guest_cart',
      JSON.stringify([
        { productId: 'p-1001', quantity: 2 },
        { productId: 'p-1002', quantity: 3 },
      ])
    );
    const { store } = renderApp();
    expect(cartCount()).toHaveTextContent(/^5$/);
    expect(store.getState().cart.items).toHaveLength(2);
  });

  it('AC6: ignores corrupt JSON in localStorage', () => {
    window.localStorage.setItem('guest_cart', '{{{not-json');
    renderApp();
    expect(cartCount()).toHaveTextContent(/^0$/);
  });

  it('AC6: ignores schema-invalid data in localStorage', () => {
    window.localStorage.setItem('guest_cart', JSON.stringify([{ productId: '<img onerror=x>', quantity: 99999 }]));
    renderApp();
    expect(cartCount()).toHaveTextContent(/^0$/);
  });

  it('AC6: still renders when localStorage access throws', () => {
    const spy = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    try {
      renderApp();
      expect(cartCount()).toHaveTextContent(/^0$/);
      expect(screen.getAllByRole('button')).toHaveLength(productsData.length);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('App end-to-end add-to-cart flows', () => {
  it('AC2/AC3/AC4/AC6: a guest adds an item: button feedback, toast, header counter and localStorage', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(cardButton('p-1001'));

    expect(await within(screen.getByTestId('product-card-p-1001')).findByText('Added ✓')).toBeInTheDocument();
    expect(cartCount()).toHaveTextContent(/^1$/);
    expect(JSON.parse(window.localStorage.getItem('guest_cart'))).toEqual([
      { productId: 'p-1001', quantity: 1 },
    ]);
    expect(mockPost).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Item added to cart!');
  });

  it('AC4: the header counter increments for each additional product', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(cardButton('p-1001'));
    await within(screen.getByTestId('product-card-p-1001')).findByText('Added ✓');
    expect(cartCount()).toHaveTextContent(/^1$/);

    await user.click(cardButton('p-1002'));
    await within(screen.getByTestId('product-card-p-1002')).findByText('Added ✓');
    expect(cartCount()).toHaveTextContent(/^2$/);

    expect(JSON.parse(window.localStorage.getItem('guest_cart'))).toEqual([
      { productId: 'p-1001', quantity: 1 },
      { productId: 'p-1002', quantity: 1 },
    ]);
  });

  it('AC6: adding to a restored guest cart merges quantities', async () => {
    window.localStorage.setItem('guest_cart', JSON.stringify([{ productId: 'p-1001', quantity: 2 }]));
    const user = userEvent.setup();
    renderApp();
    expect(cartCount()).toHaveTextContent(/^2$/);

    await user.click(cardButton('p-1001'));
    await within(screen.getByTestId('product-card-p-1001')).findByText('Added ✓');

    expect(cartCount()).toHaveTextContent(/^3$/);
    expect(JSON.parse(window.localStorage.getItem('guest_cart'))).toEqual([
      { productId: 'p-1001', quantity: 3 },
    ]);
  });

  it('AC5: out-of-stock cards cannot be added', async () => {
    const user = userEvent.setup();
    renderApp();
    const button = cardButton('p-1003');

    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/^Out of Stock$/);
    await user.click(button);

    expect(cartCount()).toHaveTextContent(/^0$/);
    expect(window.localStorage.getItem('guest_cart')).toBeNull();
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('AC7/AC8: a logged-in user syncs via POST /api/cart/add and the header shows the returned count', async () => {
    mockPost.mockResolvedValueOnce({
      data: { items: [{ productId: 'p-1002', quantity: 1 }, { productId: 'p-1004', quantity: 6 }], count: 7 },
    });
    const user = userEvent.setup();
    renderApp({ auth: { isAuthenticated: true } });

    await user.click(cardButton('p-1002'));

    expect(await within(screen.getByTestId('product-card-p-1002')).findByText('Added ✓')).toBeInTheDocument();
    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith('/api/cart/add', { productId: 'p-1002', quantity: 1 });
    expect(cartCount()).toHaveTextContent(/^7$/);
    expect(window.localStorage.getItem('guest_cart')).toBeNull();
    expect(toast.success).toHaveBeenCalledWith('Item added to cart!');
  });

  it('AC7: a failing API call leaves the counter untouched and shows the error state', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 500 } });
    const user = userEvent.setup();
    renderApp({ auth: { isAuthenticated: true } });

    await user.click(cardButton('p-1001'));

    expect(await within(screen.getByTestId('product-card-p-1001')).findByText('Try again')).toBeInTheDocument();
    expect(cartCount()).toHaveTextContent(/^0$/);
    expect(toast.error).toHaveBeenCalledWith('Could not add item. Please try again.');
  });

  it('AC5/AC7: a 409 for a logged-in user marks only that card as Out of Stock', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 409 } });
    const user = userEvent.setup();
    renderApp({ auth: { isAuthenticated: true } });

    await user.click(cardButton('p-1004'));

    expect(await within(screen.getByTestId('product-card-p-1004')).findByText('Out of Stock')).toBeInTheDocument();
    expect(cardButton('p-1004')).toBeDisabled();
    expect(cardButton('p-1001')).toBeEnabled();
    expect(cartCount()).toHaveTextContent(/^0$/);
  });
});
