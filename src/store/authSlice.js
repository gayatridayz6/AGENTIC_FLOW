import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: { token: null },
  reducers: {
    setToken(state, action) {
      state.token = typeof action.payload === 'string' && action.payload ? action.payload : null;
    },
    clearToken(state) {
      state.token = null;
    },
  },
});

export const { setToken, clearToken } = authSlice.actions;
export const selectToken = (state) => state.auth.token;
export const selectIsLoggedIn = (state) => Boolean(state.auth.token);
export default authSlice.reducer;
