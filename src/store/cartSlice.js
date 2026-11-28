import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { CartError, GENERIC_ERROR_MESSAGE, addItem } from '../services/cartService';
import { addGuestItem } from '../services/cartStorage';
import { isValidProductId, isValidQuantity, validateCartSchema } from '../utils/validators';
import { selectIsAuthenticated } from './authSlice';

export const computeCount = (items) => items.reduce((sum, entry) => sum + entry.quantity, 0);

export const initialState = {
  items: [],
  count: 0,
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
    },
    resetAddStatus(state, action) {
      delete state.statusByProduct[String(action.payload)];
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
        if (items) state.items = items;
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

export const { hydrateGuestCart, resetAddStatus } = cartSlice.actions;

export const selectCartCount = (state) => state.cart.count;
export const selectAddStatus = (productId) => (state) =>
  state.cart.statusByProduct[String(productId)] || 'idle';

export default cartSlice.reducer;
