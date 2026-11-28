import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CartPage from '../components/CartPage';
import cartReducer from '../store/cartSlice';

const createTestStore = (preloadedState = {}) => {
  const defaultState = {
    cart: {
      items: [],
      count: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
      statusByProduct: {},
      error: null,
    },
    auth: {
      isAuthenticated: false,
    },
  };

  return configureStore({
    reducer: { cart: cartReducer, auth: (state = defaultState.auth) => state },
    preloadedState: { ...defaultState, ...preloadedState },
  });
};

describe('CartPage', () => {
  it('renders empty cart state', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CartPage />
      </Provider>
    );
    expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
  });

  it('renders cart with items', () => {
    const preloadedState = {
      cart: {
        items: [
          {
            id: 'test-1',
            productId: 'prod-1',
            productName: 'Test Product',
            variant: { size: 'M', color: 'red' },
            unitPrice: 2999,
            quantity: 2,
            imageUrl: 'test.jpg',
            subtotal: 5998,
          },
        ],
        count: 2,
        subtotal: 5998,
        tax: 599,
        total: 6597,
        statusByProduct: {},
        error: null,
      },
    };

    const store = createTestStore(preloadedState);
    render(
      <Provider store={store}>
        <CartPage />
      </Provider>
    );

    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
    expect(screen.getByText('Test Product')).toBeInTheDocument();
  });

  it('calls onCheckout when checkout button is clicked', () => {
    const onCheckout = jest.fn();
    const preloadedState = {
      cart: {
        items: [
          {
            id: 'test-1',
            productId: 'prod-1',
            productName: 'Test Product',
            variant: {},
            unitPrice: 2999,
            quantity: 1,
            imageUrl: null,
            subtotal: 2999,
          },
        ],
        count: 1,
        subtotal: 2999,
        tax: 299,
        total: 3298,
        statusByProduct: {},
        error: null,
      },
    };

    const store = createTestStore(preloadedState);
    render(
      <Provider store={store}>
        <CartPage onCheckout={onCheckout} />
      </Provider>
    );

    const checkoutBtn = screen.getByLabelText('Proceed to checkout');
    fireEvent.click(checkoutBtn);
    expect(onCheckout).toHaveBeenCalled();
  });

  it('calls onContinueShopping when continue button is clicked', () => {
    const onContinueShopping = jest.fn();
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CartPage onContinueShopping={onContinueShopping} />
      </Provider>
    );

    const continueBtn = screen.getByRole('button', { name: /continue shopping/i });
    fireEvent.click(continueBtn);
    expect(onContinueShopping).toHaveBeenCalled();
  });

  it('closes when isOpen is false', () => {
    const store = createTestStore();
    const { rerender } = render(
      <Provider store={store}>
        <CartPage isOpen={false} />
      </Provider>
    );

    expect(screen.queryByText('Shopping Cart')).not.toBeInTheDocument();

    rerender(
      <Provider store={store}>
        <CartPage isOpen={true} />
      </Provider>
    );

    expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
  });

  // Edge cases
  it('renders correct item count for single item', () => {
    const preloadedState = {
      cart: {
        items: [
          {
            id: 'test-1',
            productId: 'prod-1',
            productName: 'Test Product',
            variant: {},
            unitPrice: 1999,
            quantity: 1,
            imageUrl: null,
            subtotal: 1999,
          },
        ],
        count: 1,
        subtotal: 1999,
        tax: 199,
        total: 2198,
        statusByProduct: {},
        error: null,
      },
    };

    const store = createTestStore(preloadedState);
    render(
      <Provider store={store}>
        <CartPage />
      </Provider>
    );

    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('renders correct item count for multiple items', () => {
    const preloadedState = {
      cart: {
        items: [
          { id: '1', productId: 'p1', productName: 'P1', variant: {}, unitPrice: 1999, quantity: 2, imageUrl: null, subtotal: 3998 },
          { id: '2', productId: 'p2', productName: 'P2', variant: {}, unitPrice: 2999, quantity: 3, imageUrl: null, subtotal: 8997 },
        ],
        count: 5,
        subtotal: 12995,
        tax: 1299,
        total: 14294,
        statusByProduct: {},
        error: null,
      },
    };

    const store = createTestStore(preloadedState);
    render(
      <Provider store={store}>
        <CartPage />
      </Provider>
    );

    expect(screen.getByText('5 items')).toBeInTheDocument();
  });

  it('dispatches removeFromCart action when item remove button clicked', () => {
    const preloadedState = {
      cart: {
        items: [
          {
            id: 'test-1',
            productId: 'prod-1',
            productName: 'Test Product',
            variant: {},
            unitPrice: 1999,
            quantity: 1,
            imageUrl: null,
            subtotal: 1999,
          },
        ],
        count: 1,
        subtotal: 1999,
        tax: 199,
        total: 2198,
        statusByProduct: {},
        error: null,
      },
    };

    const store = createTestStore(preloadedState);
    const { container } = render(
      <Provider store={store}>
        <CartPage />
      </Provider>
    );

    const removeBtn = screen.getByLabelText(/remove/i);
    fireEvent.click(removeBtn);

    const state = store.getState();
    expect(state.cart.items).toHaveLength(0);
    expect(state.cart.count).toBe(0);
  });

  it('dispatches updateQuantity action when quantity changed', () => {
    const preloadedState = {
      cart: {
        items: [
          {
            id: 'test-1',
            productId: 'prod-1',
            productName: 'Test Product',
            variant: {},
            unitPrice: 1999,
            quantity: 1,
            imageUrl: null,
            subtotal: 1999,
          },
        ],
        count: 1,
        subtotal: 1999,
        tax: 199,
        total: 2198,
        statusByProduct: {},
        error: null,
      },
    };

    const store = createTestStore(preloadedState);
    render(
      <Provider store={store}>
        <CartPage />
      </Provider>
    );

    const quantityInput = screen.getByDisplayValue('1');
    fireEvent.change(quantityInput, { target: { value: '3' } });

    const state = store.getState();
    expect(state.cart.items[0].quantity).toBe(3);
    expect(state.cart.count).toBe(3);
  });

  it('calls onClose when continue shopping is clicked', () => {
    const onClose = jest.fn();
    const onContinueShopping = jest.fn();
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CartPage onClose={onClose} onContinueShopping={onContinueShopping} />
      </Provider>
    );

    const continueBtn = screen.getByRole('button', { name: /continue shopping/i });
    fireEvent.click(continueBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('does not call onCheckout when cart is empty', () => {
    const onCheckout = jest.fn();
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CartPage onCheckout={onCheckout} />
      </Provider>
    );

    // In empty state, there should be no checkout button
    expect(screen.queryByLabelText('Proceed to checkout')).not.toBeInTheDocument();
  });

  it('renders live region for item count updates', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CartPage />
      </Provider>
    );

    const itemCountRegion = screen.getByText('Your cart is empty').closest('[aria-live="polite"]') ||
      screen.getByText(/item/i).closest('[aria-live="polite"]');
    expect(itemCountRegion).toHaveAttribute('aria-live', 'polite');
  });
});
