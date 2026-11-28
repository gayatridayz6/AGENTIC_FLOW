import { createSlice } from '@reduxjs/toolkit';

// Assumed contract: the host app's login flow sets isAuthenticated. No tokens are held here.
const authSlice = createSlice({
  name: 'auth',
  initialState: { isAuthenticated: false },
  reducers: {
    setAuthenticated(state, action) {
      state.isAuthenticated = action.payload === true;
    },
  },
});

export const { setAuthenticated } = authSlice.actions;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated === true;
export default authSlice.reducer;
