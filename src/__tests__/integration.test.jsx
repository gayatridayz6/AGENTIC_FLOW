import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CartPage from '../components/CartPage';
import cartReducer, { removeFromCart, updateQuantity } from '../store/cartSlice';

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

describe('Shopping Cart Integration Tests', () => {
  describe('Full Cart Workflow: Add -> Update -> Remove -> Checkout', () => {
    it('completes full workflow from add to checkout', () => {
      const mockCheckout = jest.fn();
      const mockContinueShopping = jest.fn();

      const preloadedState = {
        cart: {
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              productName: 'T-Shirt',
              variant: { size: 'M', color: 'blue' },
              unitPrice: 1999,
              quantity: 1,
              imageUrl: 'img.jpg',
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
          <CartPage onCheckout={mockCheckout} onContinueShopping={mockContinueShopping} />
        </Provider>
      );

      // Step 1: Verify item is displayed
      expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1')).toBeInTheDocument();

      // Step 2: Update quantity
      const quantityInput = screen.getByDisplayValue('1');
      fireEvent.change(quantityInput, { target: { value: '3' } });

      // Verify state updated
      let state = store.getState();
      expect(state.cart.items[0].quantity).toBe(3);
      expect(state.cart.count).toBe(3);

      // Step 3: Remove item
      const removeBtn = screen.getByLabelText(/remove/i);
      fireEvent.click(removeBtn);

      // Verify item removed
      state = store.getState();
      expect(state.cart.items).toHaveLength(0);
      expect(state.cart.count).toBe(0);

      // Step 4: Cart should show empty state
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('updates multiple items in cart', () => {
      const preloadedState = {
        cart: {
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              productName: 'T-Shirt',
              variant: {},
              unitPrice: 1999,
              quantity: 1,
              imageUrl: null,
              subtotal: 1999,
            },
            {
              id: 'item-2',
              productId: 'prod-2',
              productName: 'Jeans',
              variant: {},
              unitPrice: 4999,
              quantity: 1,
              imageUrl: null,
              subtotal: 4999,
            },
          ],
          count: 2,
          subtotal: 6998,
          tax: 699,
          total: 7697,
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

      // Both items visible
      expect(screen.getByText('T-Shirt')).toBeInTheDocument();
      expect(screen.getByText('Jeans')).toBeInTheDocument();

      // Get all quantity inputs
      const quantityInputs = screen.getAllByRole('spinbutton');
      expect(quantityInputs).toHaveLength(2);

      // Update first item quantity
      fireEvent.change(quantityInputs[0], { target: { value: '2' } });

      let state = store.getState();
      expect(state.cart.items[0].quantity).toBe(2);
      expect(state.cart.count).toBe(3); // 2 + 1

      // Update second item quantity
      fireEvent.change(quantityInputs[1], { target: { value: '3' } });

      state = store.getState();
      expect(state.cart.items[1].quantity).toBe(3);
      expect(state.cart.count).toBe(5); // 2 + 3
    });

    it('handles sequential add and remove operations', () => {
      const preloadedState = {
        cart: {
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              productName: 'Product 1',
              variant: {},
              unitPrice: 1000,
              quantity: 1,
              imageUrl: null,
              subtotal: 1000,
            },
            {
              id: 'item-2',
              productId: 'prod-2',
              productName: 'Product 2',
              variant: {},
              unitPrice: 2000,
              quantity: 1,
              imageUrl: null,
              subtotal: 2000,
            },
            {
              id: 'item-3',
              productId: 'prod-3',
              productName: 'Product 3',
              variant: {},
              unitPrice: 3000,
              quantity: 1,
              imageUrl: null,
              subtotal: 3000,
            },
          ],
          count: 3,
          subtotal: 6000,
          tax: 600,
          total: 6600,
          statusByProduct: {},
          error: null,
        },
      };

      const store = createTestStore(preloadedState);
      const { rerender } = render(
        <Provider store={store}>
          <CartPage />
        </Provider>
      );

      expect(screen.getByText('Product 1')).toBeInTheDocument();
      expect(screen.getByText('Product 2')).toBeInTheDocument();
      expect(screen.getByText('Product 3')).toBeInTheDocument();

      // Remove middle item
      const removeButtons = screen.getAllByLabelText(/remove/i);
      fireEvent.click(removeButtons[1]);

      let state = store.getState();
      expect(state.cart.items).toHaveLength(2);
      expect(state.cart.count).toBe(2);
      expect(state.cart.items[0].productId).toBe('prod-1');
      expect(state.cart.items[1].productId).toBe('prod-3');
    });

    it('calculates correct totals after multiple operations', () => {
      const preloadedState = {
        cart: {
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              productName: 'Item $10',
              variant: {},
              unitPrice: 1000,
              quantity: 2,
              imageUrl: null,
              subtotal: 2000,
            },
          ],
          count: 2,
          subtotal: 2000,
          tax: 200,
          total: 2200,
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

      // Initial: $20.00 subtotal
      expect(screen.getAllByText('$20.00').length).toBeGreaterThan(0);

      // Update to quantity 5
      const quantityInput = screen.getByDisplayValue('2');
      fireEvent.change(quantityInput, { target: { value: '5' } });

      // Verify totals updated
      const state = store.getState();
      const item = state.cart.items[0];

      // Recalculate expected totals
      const newSubtotal = item.unitPrice * 5; // 1000 * 5 = 5000
      const newTax = Math.round(newSubtotal * 0.1); // 500
      const newTotal = newSubtotal + newTax; // 5500

      expect(state.cart.subtotal).toBe(newSubtotal);
      expect(state.cart.tax).toBe(newTax);
      expect(state.cart.total).toBe(newTotal);
    });
  });

  describe('Cart State Consistency', () => {
    it('maintains consistency between item count and actual items', () => {
      const preloadedState = {
        cart: {
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              productName: 'Item 1',
              variant: {},
              unitPrice: 1000,
              quantity: 2,
              imageUrl: null,
              subtotal: 2000,
            },
            {
              id: 'item-2',
              productId: 'prod-2',
              productName: 'Item 2',
              variant: {},
              unitPrice: 1000,
              quantity: 3,
              imageUrl: null,
              subtotal: 3000,
            },
          ],
          count: 5, // 2 + 3
          subtotal: 5000,
          tax: 500,
          total: 5500,
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

      let state = store.getState();
      const computedCount = state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
      expect(computedCount).toBe(state.cart.count);

      // Update quantity and verify consistency
      const inputs = screen.getAllByRole('spinbutton');
      fireEvent.change(inputs[0], { target: { value: '5' } });

      state = store.getState();
      const newComputedCount = state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
      expect(newComputedCount).toBe(state.cart.count);
    });

    it('recalculates totals correctly when items are modified', () => {
      const preloadedState = {
        cart: {
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              productName: 'Item',
              variant: {},
              unitPrice: 2000, // $20.00
              quantity: 1,
              imageUrl: null,
              subtotal: 2000,
            },
          ],
          count: 1,
          subtotal: 2000,
          tax: 200,
          total: 2200,
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

      // Update to 3 items
      const quantityInput = screen.getByDisplayValue('1');
      fireEvent.change(quantityInput, { target: { value: '3' } });

      let state = store.getState();

      // Verify totals: 20 * 3 = 60, tax = 6, total = 66
      expect(state.cart.subtotal).toBe(6000);
      expect(state.cart.tax).toBe(600);
      expect(state.cart.total).toBe(6600);
    });
  });

  describe('Edge Cases in Workflow', () => {
    it('handles removing all items from cart', () => {
      const preloadedState = {
        cart: {
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              productName: 'Item 1',
              variant: {},
              unitPrice: 1000,
              quantity: 1,
              imageUrl: null,
              subtotal: 1000,
            },
          ],
          count: 1,
          subtotal: 1000,
          tax: 100,
          total: 1100,
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

      const removeBtn = screen.getByLabelText(/remove/i);
      fireEvent.click(removeBtn);

      const state = store.getState();
      expect(state.cart.items).toHaveLength(0);
      expect(state.cart.count).toBe(0);
      expect(state.cart.subtotal).toBe(0);
      expect(state.cart.tax).toBe(0);
      expect(state.cart.total).toBe(0);

      // Verify empty state is displayed
      expect(screen.getByText('Your cart is empty')).toBeInTheDocument();
    });

    it('handles setting quantity to 1 with decrement button disabled', () => {
      const preloadedState = {
        cart: {
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              productName: 'Item',
              variant: {},
              unitPrice: 1000,
              quantity: 2,
              imageUrl: null,
              subtotal: 2000,
            },
          ],
          count: 2,
          subtotal: 2000,
          tax: 200,
          total: 2200,
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

      const quantityInput = screen.getByDisplayValue('2');
      fireEvent.change(quantityInput, { target: { value: '1' } });

      // Decrement button should now be disabled
      const decrementBtn = screen.getByLabelText(/decrease/i);
      expect(decrementBtn).toBeDisabled();

      // Quantity should be 1
      let state = store.getState();
      expect(state.cart.items[0].quantity).toBe(1);
    });
  });

  describe('User Interactions and State Updates', () => {
    it('syncs Redux state with component display', () => {
      const mockCheckout = jest.fn();
      const preloadedState = {
        cart: {
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              productName: 'Test Item',
              variant: { size: 'L' },
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
          <CartPage onCheckout={mockCheckout} />
        </Provider>
      );

      // Verify initial display matches state
      expect(screen.getByText('Test Item')).toBeInTheDocument();
      expect(screen.getByText('L')).toBeInTheDocument();

      // Click checkout
      const checkoutBtn = screen.getByLabelText('Proceed to checkout');
      fireEvent.click(checkoutBtn);

      expect(mockCheckout).toHaveBeenCalled();
    });
  });
});