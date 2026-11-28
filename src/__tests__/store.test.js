import defaultStore, { createAppStore, store } from '../store';
import { setAuthenticated } from '../store/authSlice';
import { hydrateGuestCart, selectCartCount } from '../store/cartSlice';

// cartService creates an axios client on import; keep the real network library out of unit tests.
jest.mock('axios', () => {
  const post = jest.fn();
  return { __esModule: true, default: { create: jest.fn(() => ({ post })), post } };
});

describe('store/index', () => {
  it('AC4: createAppStore returns a store with cart and auth slices at their initial state', () => {
    const s = createAppStore();
    expect(s.getState()).toEqual({
      cart: { items: [], count: 0, subtotal: 0, tax: 0, total: 0, statusByProduct: {}, error: null },
      auth: { isAuthenticated: false },
    });
  });

  it('AC4: createAppStore creates independent stores', () => {
    const a = createAppStore();
    const b = createAppStore();
    a.dispatch(hydrateGuestCart([{ productId: 'p-1', quantity: 2 }]));
    expect(selectCartCount(a.getState())).toBe(2);
    expect(selectCartCount(b.getState())).toBe(0);
  });

  it('AC7: createAppStore honours preloaded state', () => {
    const s = createAppStore({ auth: { isAuthenticated: true } });
    expect(s.getState().auth.isAuthenticated).toBe(true);
    expect(s.getState().cart.count).toBe(0);
  });

  it('AC7: the store wires up the auth reducer', () => {
    const s = createAppStore();
    s.dispatch(setAuthenticated(true));
    expect(s.getState().auth.isAuthenticated).toBe(true);
  });

  it('AC4: exports a ready-made singleton as both named and default export', () => {
    expect(store).toBe(defaultStore);
    expect(typeof store.getState).toBe('function');
    expect(typeof store.dispatch).toBe('function');
    expect(Object.keys(store.getState()).sort()).toEqual(['auth', 'cart']);
  });
});
