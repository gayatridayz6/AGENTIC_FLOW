import reducer, { selectIsAuthenticated, setAuthenticated } from '../store/authSlice';

describe('authSlice', () => {
  it('AC6: starts as a guest (isAuthenticated=false)', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({ isAuthenticated: false });
  });

  it('AC7: setAuthenticated(true) marks the user as logged in', () => {
    const state = reducer({ isAuthenticated: false }, setAuthenticated(true));
    expect(state.isAuthenticated).toBe(true);
  });

  it('AC6: setAuthenticated(false) returns to guest', () => {
    const state = reducer({ isAuthenticated: true }, setAuthenticated(false));
    expect(state.isAuthenticated).toBe(false);
  });

  it.each([['true'], [1], [null], [undefined], [{}]])(
    'AC7: only a strict boolean true authenticates (payload %p)',
    (payload) => {
      const state = reducer({ isAuthenticated: true }, setAuthenticated(payload));
      expect(state.isAuthenticated).toBe(false);
    }
  );

  it('AC7: selectIsAuthenticated reflects the state', () => {
    expect(selectIsAuthenticated({ auth: { isAuthenticated: true } })).toBe(true);
    expect(selectIsAuthenticated({ auth: { isAuthenticated: false } })).toBe(false);
  });

  it('AC7: selectIsAuthenticated treats non-true values as guest', () => {
    expect(selectIsAuthenticated({ auth: { isAuthenticated: 'yes' } })).toBe(false);
    expect(selectIsAuthenticated({ auth: { isAuthenticated: undefined } })).toBe(false);
  });

  it('AC7: setAuthenticated action has type auth/setAuthenticated', () => {
    expect(setAuthenticated(true)).toEqual({ type: 'auth/setAuthenticated', payload: true });
  });
});
