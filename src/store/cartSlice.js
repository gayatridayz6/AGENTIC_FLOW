import { createAsyncThunk, createSlice, createSelector } from '@reduxjs/toolkit';
import { CartError, GENERIC_ERROR_MESSAGE, addItem } from '../services/cartService';
import { addGuestItem } from '../services/cartStorage';
import { isValidProductId, isValidQuantity, validateCartSchema } from '../utils/validators';
import { selectIsAuthenticated } from './authSlice';

export const computeCount = (items) => items.reduce((sum, entry) => sum + entry.quantity, 0);

export const computeTotals = (items) => {
  const subtotal = items.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
  const tax = Math.round(subtotal * 0.1); // 10% tax
  const total = subtotal + tax;
  return { subtotal, tax, total };
};

export const initialState = {
  items: [],
  count: 0,
  subtotal: 0,
  tax: 0,
  total: 0,
  statusByProduct: {}, // productId -> 'adding' | 'added' | 'error' | 'out_of_stock'
  error: null,
};

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1 }, { getState, rejectWithValue }) => {
    if (!isValidProductId(productId) || !isValidQuantity(quantity)) {
      return rejectWithValue({ code: 'INVALID_INPUT', message: GENERIC_ERROR_MESSAGE });
    }
    try {
      if (selectIsAuthenticated(getState())) {
        const data = await addItem(productId, quantity);
        const items = data && validateCartSchema(data.items) ? data.items : null;
        const count = data && Number.isInteger(data.count) && data.count >= 0
          ? data.count
          : items
            ? computeCount(items)
            : null;
        return { items, count };
      }
      const items = addGuestItem(productId, quantity);
      return { items, count: computeCount(items) };
    } catch (err) {
      const code = err instanceof CartError ? err.code : 'UNKNOWN';
      const message = err instanceof CartError ? err.message : GENERIC_ERROR_MESSAGE;
      return rejectWithValue({ code, message });
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    hydrateGuestCart(state, action) {
      const items = validateCartSchema(action.payload) ? action.payload : [];
      state.items = items;
      state.count = computeCount(items);
      const totals = computeTotals(items);
      state.subtotal = totals.subtotal;
      state.tax = totals.tax;
      state.total = totals.total;
    },
    resetAddStatus(state, action) {
      delete state.statusByProduct[String(action.payload)];
    },
    removeFromCart(state, action) {
      const { itemId } = action.payload;
      state.items = state.items.filter((item) => item.id !== itemId);
      state.count = computeCount(state.items);
      const totals = computeTotals(state.items);
      state.subtotal = totals.subtotal;
      state.tax = totals.tax;
      state.total = totals.total;
    },
    updateQuantity(state, action) {
      const { itemId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter((item) => item.id !== itemId);
      } else {
        const item = state.items.find((item) => item.id === itemId);
        if (item) {
          item.quantity = quantity;
        }
      }
      state.count = computeCount(state.items);
      const totals = computeTotals(state.items);
      state.subtotal = totals.subtotal;
      state.tax = totals.tax;
      state.total = totals.total;
    },
    clearCart(state) {
      state.items = [];
      state.count = 0;
      state.subtotal = 0;
      state.tax = 0;
      state.total = 0;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addToCart.pending, (state, action) => {
        state.statusByProduct[String(action.meta.arg.productId)] = 'adding';
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => {
        const { items, count } = action.payload;
        if (items) {
          state.items = items;
          const totals = computeTotals(items);
          state.subtotal = totals.subtotal;
          state.tax = totals.tax;
          state.total = totals.total;
        }
        if (count !== null) state.count = count;
        state.statusByProduct[String(action.meta.arg.productId)] = 'added';
      })
      .addCase(addToCart.rejected, (state, action) => {
        const payload = action.payload || {};
        state.statusByProduct[String(action.meta.arg.productId)] =
          payload.code === 'OUT_OF_STOCK' ? 'out_of_stock' : 'error';
        state.error = payload.message || GENERIC_ERROR_MESSAGE;
      });
  },
});

export const { hydrateGuestCart, resetAddStatus, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;

// Legacy selectors
export const selectCartCount = (state) => state.cart.count;
export const selectAddStatus = (productId) => (state) =>
  state.cart.statusByProduct[String(productId)] || 'idle';

// New selectors for CartPage components
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartSubtotal = (state) => state.cart.subtotal;
export const selectCartTax = (state) => state.cart.tax;
export const selectCartItemCount = (state) => state.cart.count;
export const selectIsCartEmpty = (state) => state.cart.items.length === 0;

// Memoized selector for cart summary
export const selectCartSummary = createSelector(
  [selectCartSubtotal, selectCartTax, selectCartTotal, selectCartItemCount],
  (subtotal, tax, total, itemCount) => ({
    subtotal,
    tax,
    total,
    itemCount,
  })
);

// Memoized selector for cart with items
export const selectCartWithItems = createSelector(
  [selectCartItems, selectCartSummary],
  (items, summary) => ({
    items,
    ...summary,
  })
);

export default cartSlice.reducer;
