import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as cartService from '../services/cartService';
import { addGuestItem, mergeGuestCart, readGuestCart } from '../services/guestCartStorage';
import { countItems, validateAddToCartRequest } from '../services/cartDto';
import { cartErrorFromStatus, toErrorPayload } from '../services/cartErrors';

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async ({ productId, quantity = 1 }, { getState, rejectWithValue }) => {
    try {
      const checked = validateAddToCartRequest({ productId, quantity });
      if (!checked.ok) throw cartErrorFromStatus(400);
      const token = getState().auth.token;
      if (!token) {
        const items = addGuestItem(productId, quantity);
        return { items, totalCount: countItems(items) };
      }
      return await cartService.addToCart(token, checked.value);
    } catch (error) {
      return rejectWithValue(toErrorPayload(error));
    }
  }
);

export const hydrateCart = createAsyncThunk('cart/hydrate', async (_, { getState, rejectWithValue }) => {
  const token = getState().auth.token;
  if (!token) {
    const items = readGuestCart();
    return { items, totalCount: countItems(items) };
  }
  try {
    return await cartService.getCart(token);
  } catch (error) {
    return rejectWithValue(toErrorPayload(error));
  }
});

export const syncGuestCartOnLogin = createAsyncThunk('cart/syncOnLogin', async (_, { getState, rejectWithValue }) => {
  const token = getState().auth.token;
  try {
    await mergeGuestCart((item) => cartService.addToCart(token, item));
    return await cartService.getCart(token);
  } catch (error) {
    return rejectWithValue(toErrorPayload(error));
  }
});

const applyCart = (state, payload) => {
  state.items = payload.items;
  state.count = payload.totalCount;
  state.status = 'succeeded';
  state.error = null;
};

const applyFailure = (state, action) => {
  state.status = 'failed';
  state.error = action.payload || toErrorPayload();
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [], count: 0, status: 'idle', error: null },
  reducers: {
    resetCartStatus(state) {
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addToCart.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(addToCart.fulfilled, (state, action) => applyCart(state, action.payload))
      .addCase(addToCart.rejected, applyFailure)
      .addCase(hydrateCart.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.count = action.payload.totalCount;
      })
      .addCase(syncGuestCartOnLogin.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.count = action.payload.totalCount;
      })
      .addCase(hydrateCart.rejected, applyFailure)
      .addCase(syncGuestCartOnLogin.rejected, applyFailure);
  },
});

export const { resetCartStatus } = cartSlice.actions;
export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) => state.cart.count;
export const selectCartStatus = (state) => state.cart.status;
export const selectCartError = (state) => state.cart.error;
export default cartSlice.reducer;
