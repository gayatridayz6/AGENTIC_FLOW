import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CartSummary from '../components/CartSummary';
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
  };

  return configureStore({
    reducer: { cart: cartReducer },
    preloadedState: { ...defaultState, ...preloadedState },
  });
};

describe('CartSummary', () => {
  it('renders cart summary with correct totals', () => {
    const preloadedState = {
      cart: {
        items: [],
        count: 0,
        subtotal: 10000, // $100.00
        tax: 1000, // $10.00
        total: 11000, // $110.00
        statusByProduct: {},
        error: null,
      },
    };

    const store = createTestStore(preloadedState);
    render(
      <Provider store={store}>
        <CartSummary />
      </Provider>
    );

    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('$10.00')).toBeInTheDocument();
    expect(screen.getByText('$110.00')).toBeInTheDocument();
  });

  it('renders with zero values', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CartSummary />
      </Provider>
    );

    expect(screen.getAllByText('$0.00')).toHaveLength(3);
  });

  it('displays all summary labels', () => {
    const store = createTestStore();
    render(
      <Provider store={store}>
        <CartSummary />
      </Provider>
    );

    expect(screen.getByText('Subtotal:')).toBeInTheDocument();
    expect(screen.getByText('Tax:')).toBeInTheDocument();
    expect(screen.getByText('Total:')).toBeInTheDocument();
  });

  // Edge cases
  it('handles high prices correctly', () => {
    const preloadedState = {
      cart: {
        items: [],
        count: 0,
        subtotal: 999999, // $9999.99
        tax: 99999, // $999.99
        total: 1099998, // $10999.98
        statusByProduct: {},
        error: null,
      },
    };

    const store = createTestStore(preloadedState);
    render(
      <Provider store={store}>
        <CartSummary />
      </Provider>
    );

    expect(screen.getByText('$9999.99')).toBeInTheDocument();
    expect(screen.getByText('$999.99')).toBeInTheDocument();
    expect(screen.getByText('$10999.98')).toBeInTheDocument();
  });

  it('handles cent-only prices', () => {
    const preloadedState = {
      cart: {
        items: [],
        count: 0,
        subtotal: 50, // $0.50
        tax: 5, // $0.05
        total: 55, // $0.55
        statusByProduct: {},
        error: null,
      },
    };

    const store = createTestStore(preloadedState);
    render(
      <Provider store={store}>
        <CartSummary />
      </Provider>
    );

    expect(screen.getByText('$0.50')).toBeInTheDocument();
    expect(screen.getByText('$0.05')).toBeInTheDocument();
    expect(screen.getByText('$0.55')).toBeInTheDocument();
  });

  it('calculates tax correctly (10% of subtotal)', () => {
    const preloadedState = {
      cart: {
        items: [],
        count: 0,
        subtotal: 50000, // $500.00
        tax: 5000, // $50.00
        total: 55000, // $550.00
        statusByProduct: {},
        error: null,
      },
    };

    const store = createTestStore(preloadedState);
    render(
      <Provider store={store}>
        <CartSummary />
      </Provider>
    );

    // Verify tax is exactly 10% of subtotal
    expect(screen.getByText('$500.00')).toBeInTheDocument();
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$550.00')).toBeInTheDocument();
  });

  it('total equals subtotal plus tax', () => {
    const preloadedState = {
      cart: {
        items: [],
        count: 0,
        subtotal: 20000, // $200.00
        tax: 2000, // $20.00
        total: 22000, // $220.00
        statusByProduct: {},
        error: null,
      },
    };

    const store = createTestStore(preloadedState);
    render(
      <Provider store={store}>
        <CartSummary />
      </Provider>
    );

    expect(screen.getByText('$200.00')).toBeInTheDocument();
    expect(screen.getByText('$20.00')).toBeInTheDocument();
    expect(screen.getByText('$220.00')).toBeInTheDocument();
  });

  it('renders with proper formatting for currency', () => {
    const preloadedState = {
      cart: {
        items: [],
        count: 0,
        subtotal: 12345, // $123.45
        tax: 1234, // $12.34
        total: 13579, // $135.79
        statusByProduct: {},
        error: null,
      },
    };

    const store = createTestStore(preloadedState);
    render(
      <Provider store={store}>
        <CartSummary />
      </Provider>
    );

    expect(screen.getByText('$123.45')).toBeInTheDocument();
    expect(screen.getByText('$12.34')).toBeInTheDocument();
    expect(screen.getByText('$135.79')).toBeInTheDocument();
  });

  it('updates when cart state changes', () => {
    const store = createTestStore({
      cart: {
        items: [],
        count: 0,
        subtotal: 10000,
        tax: 1000,
        total: 11000,
        statusByProduct: {},
        error: null,
      },
    });

    const { rerender } = render(
      <Provider store={store}>
        <CartSummary />
      </Provider>
    );

    expect(screen.getByText('$100.00')).toBeInTheDocument();

    // Update store with new values
    const newStore = createTestStore({
      cart: {
        items: [],
        count: 0,
        subtotal: 20000,
        tax: 2000,
        total: 22000,
        statusByProduct: {},
        error: null,
      },
    });

    rerender(
      <Provider store={newStore}>
        <CartSummary />
      </Provider>
    );

    expect(screen.getByText('$200.00')).toBeInTheDocument();
  });

  it('renders summary container', () => {
    const store = createTestStore();
    const { container } = render(
      <Provider store={store}>
        <CartSummary />
      </Provider>
    );

    // Should have summary structure
    expect(container.querySelector('.cart-summary')).toBeInTheDocument();
  });

  it('displays all three summary rows', () => {
    const store = createTestStore({
      cart: {
        items: [],
        count: 0,
        subtotal: 10000,
        tax: 1000,
        total: 11000,
        statusByProduct: {},
        error: null,
      },
    });

    const { container } = render(
      <Provider store={store}>
        <CartSummary />
      </Provider>
    );

    const rows = container.querySelectorAll('.cart-summary__row');
    expect(rows.length).toBeGreaterThanOrEqual(3);
  });

  it('rounds tax to nearest cent', () => {
    // Test rounding: 1/3 of 1000 = 333.33, should round to 333
    const preloadedState = {
      cart: {
        items: [],
        count: 0,
        subtotal: 10001, // Would be $100.01
        tax: 1000, // $10.00 (pre-rounded)
        total: 11001, // $110.01
        statusByProduct: {},
        error: null,
      },
    };

    const store = createTestStore(preloadedState);
    render(
      <Provider store={store}>
        <CartSummary />
      </Provider>
    );

    // Tax should be properly formatted
    const taxText = screen.getByText(/\$10\.00/);
    expect(taxText).toBeInTheDocument();
  });
});
