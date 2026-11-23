import { createSlice } from '@reduxjs/toolkit';

/**
 * Redux Slice for Cart State Management
 * Manages both guest and authenticated user cart state
 */

const initialState = {
  items: [],
  itemCount: 0,
  userId: null,
  isLoading: false,
  error: null
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Update cart with new items and count
    updateCart(state, action) {
      state.items = action.payload.items || state.items;
      state.itemCount = action.payload.itemCount || state.itemCount;
    },

    // Add single item to cart
    addItem(state, action) {
      const { productId, quantity } = action.payload;
      const existingItem = state.items.find(item => item.productId === productId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        state.items.push({ productId, quantity });
      }

      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    },

    // Remove item from cart
    removeItem(state, action) {
      const { productId } = action.payload;
      state.items = state.items.filter(item => item.productId !== productId);
      state.itemCount = state.items.reduce((sum, item) => sum + item.quantity, 0);
    },

    // Clear entire cart
    clearCart(state) {
      state.items = [];
      state.itemCount = 0;
    },

    // Set user ID (for authenticated users)
    setUserId(state, action) {
      state.userId = action.payload;
    },

    // Set loading state
    setLoading(state, action) {
      state.isLoading = action.payload;
    },

    // Set error state
    setError(state, action) {
      state.error = action.payload;
    }
  }
});

export const {
  updateCart,
  addItem,
  removeItem,
  clearCart,
  setUserId,
  setLoading,
  setError
} = cartSlice.actions;

export default cartSlice.reducer;
