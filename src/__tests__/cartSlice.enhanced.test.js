import { createAppStore } from '../store';
import {
  removeFromCart,
  updateQuantity,
  clearCart,
  hydrateGuestCart,
  selectCartItems,
  selectCartTotal,
  selectCartSubtotal,
  selectCartTax,
  selectCartItemCount,
  selectIsCartEmpty,
  selectCartSummary,
  computeTotals,
  computeCount,
} from '../store/cartSlice';

describe('Redux - Cart Slice Tests', () => {
  describe('Selector Tests', () => {
    it('selectCartItems returns all cart items', () => {
      const store = createAppStore();
      let state = store.getState();
      expect(selectCartItems(state)).toEqual([]);

      // Add an item through dispatch
      store.dispatch(hydrateGuestCart([
        { id: 'item-1', productId: 'prod-1', productName: 'Item 1', variant: {}, unitPrice: 1000, quantity: 1, imageUrl: null, subtotal: 1000 },
      ]));

      state = store.getState();
      expect(selectCartItems(state)).toHaveLength(1);
    });

    it('selectCartTotal returns correct total', () => {
      const store = createAppStore({
        cart: {
          items: [],
          count: 0,
          subtotal: 1000,
          tax: 100,
          total: 1100,
          statusByProduct: {},
          error: null,
        },
      });

      const state = store.getState();
      expect(selectCartTotal(state)).toBe(1100);
    });

    it('selectCartSubtotal returns correct subtotal', () => {
      const store = createAppStore({
        cart: {
          items: [],
          count: 0,
          subtotal: 5000,
          tax: 500,
          total: 5500,
          statusByProduct: {},
          error: null,
        },
      });

      const state = store.getState();
      expect(selectCartSubtotal(state)).toBe(5000);
    });

    it('selectCartTax returns correct tax', () => {
      const store = createAppStore({
        cart: {
          items: [],
          count: 0,
          subtotal: 2000,
          tax: 200,
          total: 2200,
          statusByProduct: {},
          error: null,
        },
      });

      const state = store.getState();
      expect(selectCartTax(state)).toBe(200);
    });

    it('selectCartItemCount returns correct count', () => {
      const store = createAppStore({
        cart: {
          items: [
            { id: '1', productId: 'p1', productName: 'P1', variant: {}, unitPrice: 1000, quantity: 2, imageUrl: null, subtotal: 2000 },
            { id: '2', productId: 'p2', productName: 'P2', variant: {}, unitPrice: 1000, quantity: 3, imageUrl: null, subtotal: 3000 },
          ],
          count: 5,
          subtotal: 5000,
          tax: 500,
          total: 5500,
          statusByProduct: {},
          error: null,
        },
      });

      const state = store.getState();
      expect(selectCartItemCount(state)).toBe(5);
    });

    it('selectIsCartEmpty returns true when empty', () => {
      const store = createAppStore();
      const state = store.getState();
      expect(selectIsCartEmpty(state)).toBe(true);
    });

    it('selectIsCartEmpty returns false when has items', () => {
      const store = createAppStore({
        cart: {
          items: [
            { id: '1', productId: 'p1', productName: 'P1', variant: {}, unitPrice: 1000, quantity: 1, imageUrl: null, subtotal: 1000 },
          ],
          count: 1,
          subtotal: 1000,
          tax: 100,
          total: 1100,
          statusByProduct: {},
          error: null,
        },
      });

      const state = store.getState();
      expect(selectIsCartEmpty(state)).toBe(false);
    });
  });

  describe('Memoized Selector Tests (selectCartSummary)', () => {
    it('returns memoized cart summary', () => {
      const store = createAppStore({
        cart: {
          items: [],
          count: 0,
          subtotal: 1000,
          tax: 100,
          total: 1100,
          statusByProduct: {},
          error: null,
        },
      });

      const state = store.getState();
      const summary = selectCartSummary(state);

      expect(summary).toEqual({
        subtotal: 1000,
        tax: 100,
        total: 1100,
        itemCount: 0,
      });
    });

    it('memoized selector returns same reference for same input', () => {
      const store = createAppStore({
        cart: {
          items: [],
          count: 2,
          subtotal: 2000,
          tax: 200,
          total: 2200,
          statusByProduct: {},
          error: null,
        },
      });

      const state = store.getState();
      const summary1 = selectCartSummary(state);
      const summary2 = selectCartSummary(state);

      // Should return same reference due to memoization
      expect(summary1).toBe(summary2);
    });

    it('memoized selector returns new reference when totals change', () => {
      let store = createAppStore({
        cart: {
          items: [],
          count: 0,
          subtotal: 1000,
          tax: 100,
          total: 1100,
          statusByProduct: {},
          error: null,
        },
      });

      let state = store.getState();
      const summary1 = selectCartSummary(state);

      // Create new store with different totals
      store = createAppStore({
        cart: {
          items: [],
          count: 0,
          subtotal: 2000,
          tax: 200,
          total: 2200,
          statusByProduct: {},
          error: null,
        },
      });

      state = store.getState();
      const summary2 = selectCartSummary(state);

      // Should return different reference when data changes
      expect(summary1).not.toBe(summary2);
    });
  });

  describe('Action Tests - removeFromCart', () => {
    it('removes item from cart', () => {
      const store = createAppStore({
        cart: {
          items: [
            { id: 'item-1', productId: 'p1', productName: 'P1', variant: {}, unitPrice: 1000, quantity: 1, imageUrl: null, subtotal: 1000 },
            { id: 'item-2', productId: 'p2', productName: 'P2', variant: {}, unitPrice: 1000, quantity: 1, imageUrl: null, subtotal: 1000 },
          ],
          count: 2,
          subtotal: 2000,
          tax: 200,
          total: 2200,
          statusByProduct: {},
          error: null,
        },
      });

      store.dispatch(removeFromCart({ itemId: 'item-1' }));

      let state = store.getState();
      expect(state.cart.items).toHaveLength(1);
      expect(state.cart.items[0].id).toBe('item-2');
    });

    it('recalculates totals after removal', () => {
      const store = createAppStore({
        cart: {
          items: [
            { id: 'item-1', productId: 'p1', productName: 'P1', variant: {}, unitPrice: 1000, quantity: 1, imageUrl: null, subtotal: 1000 },
            { id: 'item-2', productId: 'p2', productName: 'P2', variant: {}, unitPrice: 2000, quantity: 1, imageUrl: null, subtotal: 2000 },
          ],
          count: 2,
          subtotal: 3000,
          tax: 300,
          total: 3300,
          statusByProduct: {},
          error: null,
        },
      });

      store.dispatch(removeFromCart({ itemId: 'item-2' }));

      const state = store.getState();
      expect(state.cart.subtotal).toBe(1000);
      expect(state.cart.tax).toBe(100);
      expect(state.cart.total).toBe(1100);
      expect(state.cart.count).toBe(1);
    });

    it('handles removing non-existent item gracefully', () => {
      const store = createAppStore({
        cart: {
          items: [
            { id: 'item-1', productId: 'p1', productName: 'P1', variant: {}, unitPrice: 1000, quantity: 1, imageUrl: null, subtotal: 1000 },
          ],
          count: 1,
          subtotal: 1000,
          tax: 100,
          total: 1100,
          statusByProduct: {},
          error: null,
        },
      });

      store.dispatch(removeFromCart({ itemId: 'non-existent' }));

      const state = store.getState();
      expect(state.cart.items).toHaveLength(1);
    });
  });

  describe('Action Tests - updateQuantity', () => {
    it('updates item quantity', () => {
      const store = createAppStore({
        cart: {
          items: [
            { id: 'item-1', productId: 'p1', productName: 'P1', variant: {}, unitPrice: 1000, quantity: 1, imageUrl: null, subtotal: 1000 },
          ],
          count: 1,
          subtotal: 1000,
          tax: 100,
          total: 1100,
          statusByProduct: {},
          error: null,
        },
      });

      store.dispatch(updateQuantity({ itemId: 'item-1', quantity: 5 }));

      const state = store.getState();
      expect(state.cart.items[0].quantity).toBe(5);
    });

    it('recalculates totals after quantity update', () => {
      const store = createAppStore({
        cart: {
          items: [
            { id: 'item-1', productId: 'p1', productName: 'P1', variant: {}, unitPrice: 1000, quantity: 2, imageUrl: null, subtotal: 2000 },
          ],
          count: 2,
          subtotal: 2000,
          tax: 200,
          total: 2200,
          statusByProduct: {},
          error: null,
        },
      });

      store.dispatch(updateQuantity({ itemId: 'item-1', quantity: 5 }));

      const state = store.getState();
      expect(state.cart.items[0].quantity).toBe(5);
      expect(state.cart.count).toBe(5);
      expect(state.cart.subtotal).toBe(5000);
      expect(state.cart.tax).toBe(500);
      expect(state.cart.total).toBe(5500);
    });

    it('removes item when quantity set to 0 or negative', () => {
      const store = createAppStore({
        cart: {
          items: [
            { id: 'item-1', productId: 'p1', productName: 'P1', variant: {}, unitPrice: 1000, quantity: 2, imageUrl: null, subtotal: 2000 },
            { id: 'item-2', productId: 'p2', productName: 'P2', variant: {}, unitPrice: 1000, quantity: 1, imageUrl: null, subtotal: 1000 },
          ],
          count: 3,
          subtotal: 3000,
          tax: 300,
          total: 3300,
          statusByProduct: {},
          error: null,
        },
      });

      store.dispatch(updateQuantity({ itemId: 'item-1', quantity: 0 }));

      const state = store.getState();
      expect(state.cart.items).toHaveLength(1);
      expect(state.cart.items[0].id).toBe('item-2');
    });
  });

  describe('Action Tests - clearCart', () => {
    it('clears all items from cart', () => {
      const store = createAppStore({
        cart: {
          items: [
            { id: 'item-1', productId: 'p1', productName: 'P1', variant: {}, unitPrice: 1000, quantity: 1, imageUrl: null, subtotal: 1000 },
            { id: 'item-2', productId: 'p2', productName: 'P2', variant: {}, unitPrice: 1000, quantity: 1, imageUrl: null, subtotal: 1000 },
          ],
          count: 2,
          subtotal: 2000,
          tax: 200,
          total: 2200,
          statusByProduct: { 'p1': 'added' },
          error: 'Some error',
        },
      });

      store.dispatch(clearCart());

      const state = store.getState();
      expect(state.cart.items).toEqual([]);
      expect(state.cart.count).toBe(0);
      expect(state.cart.subtotal).toBe(0);
      expect(state.cart.tax).toBe(0);
      expect(state.cart.total).toBe(0);
      expect(state.cart.error).toBeNull();
    });
  });

  describe('Action Tests - hydrateGuestCart', () => {
    it('loads items into cart', () => {
      const store = createAppStore();

      const items = [
        { id: 'item-1', productId: 'p1', productName: 'P1', variant: {}, unitPrice: 1000, quantity: 2, imageUrl: null, subtotal: 2000 },
        { id: 'item-2', productId: 'p2', productName: 'P2', variant: {}, unitPrice: 2000, quantity: 1, imageUrl: null, subtotal: 2000 },
      ];

      store.dispatch(hydrateGuestCart(items));

      const state = store.getState();
      expect(state.cart.items).toEqual(items);
    });

    it('recalculates totals on hydration', () => {
      const store = createAppStore();

      const items = [
        { id: 'item-1', productId: 'p1', productName: 'P1', variant: {}, unitPrice: 1500, quantity: 2, imageUrl: null, subtotal: 3000 },
      ];

      store.dispatch(hydrateGuestCart(items));

      const state = store.getState();
      expect(state.cart.count).toBe(2);
      expect(state.cart.subtotal).toBe(3000);
      expect(state.cart.tax).toBe(300);
      expect(state.cart.total).toBe(3300);
    });

    it('clears cart on invalid hydration data', () => {
      const store = createAppStore({
        cart: {
          items: [
            { id: 'item-1', productId: 'p1', productName: 'P1', variant: {}, unitPrice: 1000, quantity: 1, imageUrl: null, subtotal: 1000 },
          ],
          count: 1,
          subtotal: 1000,
          tax: 100,
          total: 1100,
          statusByProduct: {},
          error: null,
        },
      });

      store.dispatch(hydrateGuestCart(null));

      const state = store.getState();
      expect(state.cart.items).toEqual([]);
      expect(state.cart.count).toBe(0);
    });
  });

  describe('Helper Function Tests', () => {
    it('computeCount sums all quantities', () => {
      const items = [
        { quantity: 2 },
        { quantity: 3 },
        { quantity: 1 },
      ];

      expect(computeCount(items)).toBe(6);
    });

    it('computeCount returns 0 for empty array', () => {
      expect(computeCount([])).toBe(0);
    });

    it('computeTotals calculates correct values', () => {
      const items = [
        { unitPrice: 1000, quantity: 2 }, // $20
        { unitPrice: 1500, quantity: 1 }, // $15
      ];

      const totals = computeTotals(items);

      expect(totals.subtotal).toBe(3500); // $35.00
      expect(totals.tax).toBe(350); // $3.50
      expect(totals.total).toBe(3850); // $38.50
    });

    it('computeTotals returns zero for empty items', () => {
      const totals = computeTotals([]);

      expect(totals.subtotal).toBe(0);
      expect(totals.tax).toBe(0);
      expect(totals.total).toBe(0);
    });

    it('computeTotals tax is 10% of subtotal', () => {
      const items = [
        { unitPrice: 5000, quantity: 1 }, // $50
      ];

      const totals = computeTotals(items);

      expect(totals.tax).toBe(Math.round(5000 * 0.1));
    });
  });

  describe('State Consistency Tests', () => {
    it('maintains consistency between items and count', () => {
      const store = createAppStore({
        cart: {
          items: [
            { id: '1', productId: 'p1', productName: 'P1', variant: {}, unitPrice: 1000, quantity: 2, imageUrl: null, subtotal: 2000 },
            { id: '2', productId: 'p2', productName: 'P2', variant: {}, unitPrice: 1000, quantity: 3, imageUrl: null, subtotal: 3000 },
          ],
          count: 5,
          subtotal: 5000,
          tax: 500,
          total: 5500,
          statusByProduct: {},
          error: null,
        },
      });

      let state = store.getState();
      let computedCount = computeCount(state.cart.items);
      expect(computedCount).toBe(state.cart.count);

      // Update quantity
      store.dispatch(updateQuantity({ itemId: '1', quantity: 5 }));

      state = store.getState();
      computedCount = computeCount(state.cart.items);
      expect(computedCount).toBe(state.cart.count);
    });

    it('maintains consistency between items and totals', () => {
      const store = createAppStore({
        cart: {
          items: [
            { id: '1', productId: 'p1', productName: 'P1', variant: {}, unitPrice: 2000, quantity: 2, imageUrl: null, subtotal: 4000 },
          ],
          count: 2,
          subtotal: 4000,
          tax: 400,
          total: 4400,
          statusByProduct: {},
          error: null,
        },
      });

      let state = store.getState();
      let computedTotals = computeTotals(state.cart.items);
      expect(computedTotals.subtotal).toBe(state.cart.subtotal);
      expect(computedTotals.tax).toBe(state.cart.tax);
      expect(computedTotals.total).toBe(state.cart.total);

      // Update quantity
      store.dispatch(updateQuantity({ itemId: '1', quantity: 3 }));

      state = store.getState();
      computedTotals = computeTotals(state.cart.items);
      expect(computedTotals.subtotal).toBe(state.cart.subtotal);
      expect(computedTotals.tax).toBe(state.cart.tax);
      expect(computedTotals.total).toBe(state.cart.total);
    });
  });
});