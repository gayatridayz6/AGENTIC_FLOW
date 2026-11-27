import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import cartReducer from './cartSlice';

export const createAppStore = (preloadedState) =>
  configureStore({ reducer: { auth: authReducer, cart: cartReducer }, preloadedState });

const store = createAppStore();

export default store;
