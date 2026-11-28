import { configureStore } from '@reduxjs/toolkit';
import cartReducer from './cartSlice';
import authReducer from './authSlice';

export const createAppStore = (preloadedState) =>
  configureStore({
    reducer: { cart: cartReducer, auth: authReducer },
    preloadedState,
    devTools: process.env.NODE_ENV !== 'production',
  });

export const store = createAppStore();
export default store;
