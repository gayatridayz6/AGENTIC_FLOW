import axios from 'axios';
import reducer, {
  addToCart,
  computeCount,
  hydrateGuestCart,
  initialState,
  resetAddStatus,
  selectAddStatus,
  selectCartCount,
} from '../store/cartSlice';
import { createAppStore } from '../store';
import { setAuthenticated } from '../store/authSlice';
import { GENERIC_ERROR_MESSAGE } from '../services/cartService';

jest.mock('axios', () => {
  const post = jest.fn();
  return { __esModule: true, default: { create: jest.fn(() => ({ post })), post } };
});

const mockPost = axios.post;

beforeEach(() => {
  mockPost.mockReset();
});

const guestStore = () => createAppStore();
const authedStore = () => createAppStore({ auth: { isAuthenticated: true } });

describe('cartSlice helpers and reducers', () => {
  it('AC4: computeCount sums quantities', () => {
    expect(computeCount([])).toBe(0);
    expect(
      computeCount([
        { productId: 'a', quantity: 2 },
        { productId: 'b', quantity: 3 },
      ])
    ).toBe(5);
  });

  it('AC4: initial state is an empty cart', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toEqual({
      items: [],
      count: 0,
      statusByProduct: {},
      error: null,
    });
    expect(initialState.count).toBe(0);
  });

  it('AC6: hydrateGuestCart loads a valid cart and recomputes the count', () => {
    const items = [
      { productId: 'p-1', quantity: 2 },
      { productId: 'p-2', quantity: 4 },
    ];
    const state = reducer(initialState, hydrateGuestCart(items));
    expect(state.items).toEqual(items);
    expect(state.count).toBe(6);
  });

  it.each([
    ['null', null],
    ['non-array', { a: 1 }],
    ['invalid entries', [{ productId: '<x>', quantity: 1 }]],
  ])('AC6: hydrateGuestCart falls back to an empty cart for %s', (_label, payload) => {
    const start = { ...initialState, items: [{ productId: 'p-9', quantity: 9 }], count: 9 };
    const state = reducer(start, hydrateGuestCart(payload));
    expect(state.items).toEqual([]);
    expect(state.count).toBe(0);
  });

  it('AC3: resetAddStatus removes the status for a product only', () => {
    const start = { ...initialState, statusByProduct: { 'p-1': 'added', 'p-2': 'error' } };
    const state = reducer(start, resetAddStatus('p-1'));
    expect(state.statusByProduct).toEqual({ 'p-2': 'error' });
  });

  it('AC3: resetAddStatus accepts numeric ids and is a no-op for unknown ids', () => {
    const start = { ...initialState, statusByProduct: { 5: 'added' } };
    expect(reducer(start, resetAddStatus(5)).statusByProduct).toEqual({});
    expect(reducer(start, resetAddStatus('zzz')).statusByProduct).toEqual({ 5: 'added' });
  });

  it('AC4: selectCartCount reads state.cart.count', () => {
    expect(selectCartCount({ cart: { count: 7 } })).toBe(7);
  });

  it('AC3: selectAddStatus defaults to idle and reads per-product status', () => {
    const state = { cart: { statusByProduct: { 'p-1': 'added', 3: 'adding' } } };
    expect(selectAddStatus('p-1')(state)).toBe('added');
    expect(selectAddStatus(3)(state)).toBe('adding');
    expect(selectAddStatus('missing')(state)).toBe('idle');
  });
});

describe('cartSlice extraReducers (addToCart lifecycle)', () => {
  const arg = { productId: 'p-1', quantity: 1 };

  it('AC3: pending sets status "adding" and clears the previous error', () => {
    const start = { ...initialState, error: 'old' };
    const state = reducer(start, addToCart.pending('req', arg));
    expect(state.statusByProduct['p-1']).toBe('adding');
    expect(state.error).toBeNull();
  });

  it('AC4: fulfilled stores items and count and sets status "added"', () => {
    const items = [{ productId: 'p-1', quantity: 3 }];
    const state = reducer(initialState, addToCart.fulfilled({ items, count: 3 }, 'req', arg));
    expect(state.items).toEqual(items);
    expect(state.count).toBe(3);
    expect(state.statusByProduct['p-1']).toBe('added');
  });

  it('AC7: fulfilled with null items/count keeps the existing cart but marks added', () => {
    const start = { ...initialState, items: [{ productId: 'x', quantity: 1 }], count: 1 };
    const state = reducer(start, addToCart.fulfilled({ items: null, count: null }, 'req', arg));
    expect(state.items).toEqual(start.items);
    expect(state.count).toBe(1);
    expect(state.statusByProduct['p-1']).toBe('added');
  });

  it('AC7: fulfilled with only a count updates the count and keeps items', () => {
    const state = reducer(initialState, addToCart.fulfilled({ items: null, count: 4 }, 'req', arg));
    expect(state.count).toBe(4);
    expect(state.items).toEqual([]);
  });

  it('AC5: rejected with OUT_OF_STOCK sets status "out_of_stock" and the message', () => {
    const state = reducer(
      initialState,
      addToCart.rejected(null, 'req', arg, { code: 'OUT_OF_STOCK', message: 'This item is out of stock.' })
    );
    expect(state.statusByProduct['p-1']).toBe('out_of_stock');
    expect(state.error).toBe('This item is out of stock.');
  });

  it('AC7: rejected with another code sets status "error"', () => {
    const state = reducer(
      initialState,
      addToCart.rejected(null, 'req', arg, { code: 'SERVER_ERROR', message: 'boom' })
    );
    expect(state.statusByProduct['p-1']).toBe('error');
    expect(state.error).toBe('boom');
  });

  it('AC7: rejected without payload falls back to the generic message', () => {
    const state = reducer(initialState, addToCart.rejected(new Error('x'), 'req', arg));
    expect(state.statusByProduct['p-1']).toBe('error');
    expect(state.error).toBe(GENERIC_ERROR_MESSAGE);
  });

  it('AC7: rejected payload without message falls back to the generic message', () => {
    const state = reducer(initialState, addToCart.rejected(null, 'req', arg, { code: 'X' }));
    expect(state.error).toBe(GENERIC_ERROR_MESSAGE);
  });
});

describe('addToCart thunk - guest user (AC6)', () => {
  it('AC6: stores the item in localStorage, updates state and never calls the API', async () => {
    const store = guestStore();
    const result = await store.dispatch(addToCart({ productId: 'p-1001', quantity: 1 }));

    expect(addToCart.fulfilled.match(result)).toBe(true);
    expect(result.payload).toEqual({ items: [{ productId: 'p-1001', quantity: 1 }], count: 1 });
    expect(JSON.parse(window.localStorage.getItem('guest_cart'))).toEqual([
      { productId: 'p-1001', quantity: 1 },
    ]);
    expect(mockPost).not.toHaveBeenCalled();
    expect(selectCartCount(store.getState())).toBe(1);
    expect(selectAddStatus('p-1001')(store.getState())).toBe('added');
  });

  it('AC2: quantity defaults to 1 when omitted', async () => {
    const store = guestStore();
    await store.dispatch(addToCart({ productId: 'p-1002' }));
    expect(selectCartCount(store.getState())).toBe(1);
  });

  it('AC4: repeated adds accumulate the cart count', async () => {
    const store = guestStore();
    await store.dispatch(addToCart({ productId: 'p-1001', quantity: 1 }));
    await store.dispatch(addToCart({ productId: 'p-1001', quantity: 2 }));
    await store.dispatch(addToCart({ productId: 'p-1002', quantity: 1 }));
    expect(selectCartCount(store.getState())).toBe(4);
    expect(store.getState().cart.items).toEqual([
      { productId: 'p-1001', quantity: 3 },
      { productId: 'p-1002', quantity: 1 },
    ]);
  });

  it('AC6: continues from a previously persisted guest cart', async () => {
    window.localStorage.setItem('guest_cart', JSON.stringify([{ productId: 'p-1001', quantity: 5 }]));
    const store = guestStore();
    await store.dispatch(addToCart({ productId: 'p-1001', quantity: 1 }));
    expect(selectCartCount(store.getState())).toBe(6);
  });

  it.each([
    ['empty id', { productId: '', quantity: 1 }],
    ['malformed id', { productId: '<script>', quantity: 1 }],
    ['quantity 0', { productId: 'p-1', quantity: 0 }],
    ['quantity 100', { productId: 'p-1', quantity: 100 }],
  ])('AC8: rejects invalid input (%s) with INVALID_INPUT and touches nothing', async (_label, arg) => {
    const store = guestStore();
    const result = await store.dispatch(addToCart(arg));
    expect(addToCart.rejected.match(result)).toBe(true);
    expect(result.payload).toEqual({ code: 'INVALID_INPUT', message: GENERIC_ERROR_MESSAGE });
    expect(window.localStorage.getItem('guest_cart')).toBeNull();
    expect(mockPost).not.toHaveBeenCalled();
    expect(store.getState().cart.error).toBe(GENERIC_ERROR_MESSAGE);
    expect(selectAddStatus(arg.productId)(store.getState())).toBe('error');
  });

  it('AC6: a storage failure becomes an UNKNOWN/error state with a safe message', async () => {
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError: secret internals');
    });
    try {
      const store = guestStore();
      const result = await store.dispatch(addToCart({ productId: 'p-1', quantity: 1 }));
      expect(addToCart.rejected.match(result)).toBe(true);
      expect(result.payload).toEqual({ code: 'UNKNOWN', message: GENERIC_ERROR_MESSAGE });
      expect(selectAddStatus('p-1')(store.getState())).toBe('error');
      expect(store.getState().cart.error).toBe(GENERIC_ERROR_MESSAGE);
      expect(selectCartCount(store.getState())).toBe(0);
    } finally {
      spy.mockRestore();
    }
  });

  it('AC6: a full guest cart (100 distinct items) rejects a new product', async () => {
    const full = Array.from({ length: 100 }, (_, i) => ({ productId: `p${i}`, quantity: 1 }));
    window.localStorage.setItem('guest_cart', JSON.stringify(full));
    const store = guestStore();
    const result = await store.dispatch(addToCart({ productId: 'new-item', quantity: 1 }));
    expect(addToCart.rejected.match(result)).toBe(true);
    expect(selectAddStatus('new-item')(store.getState())).toBe('error');
  });

  it('AC3: pending state is visible while the thunk is in flight', async () => {
    const store = authedStore();
    let resolvePost;
    mockPost.mockReturnValueOnce(new Promise((resolve) => { resolvePost = resolve; }));

    const promise = store.dispatch(addToCart({ productId: 'p-1', quantity: 1 }));
    expect(selectAddStatus('p-1')(store.getState())).toBe('adding');

    resolvePost({ data: { items: [{ productId: 'p-1', quantity: 1 }], count: 1 } });
    await promise;
    expect(selectAddStatus('p-1')(store.getState())).toBe('added');
  });
});

describe('addToCart thunk - logged-in user (AC7, AC8)', () => {
  it('AC7: calls POST /api/cart/add with {productId, quantity} and applies the response', async () => {
    mockPost.mockResolvedValueOnce({
      data: { items: [{ productId: 'p-1001', quantity: 1 }, { productId: 'p-1002', quantity: 2 }], count: 3 },
    });
    const store = authedStore();

    const result = await store.dispatch(addToCart({ productId: 'p-1001', quantity: 1 }));

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith('/api/cart/add', { productId: 'p-1001', quantity: 1 });
    expect(addToCart.fulfilled.match(result)).toBe(true);
    expect(selectCartCount(store.getState())).toBe(3);
    expect(store.getState().cart.items).toHaveLength(2);
    expect(selectAddStatus('p-1001')(store.getState())).toBe('added');
  });

  it('AC7: does NOT write to localStorage for logged-in users', async () => {
    mockPost.mockResolvedValueOnce({ data: { items: [{ productId: 'p-1', quantity: 1 }], count: 1 } });
    const store = authedStore();
    await store.dispatch(addToCart({ productId: 'p-1', quantity: 1 }));
    expect(window.localStorage.getItem('guest_cart')).toBeNull();
  });

  it('AC7: switches behaviour when auth state changes at runtime', async () => {
    mockPost.mockResolvedValue({ data: { items: [{ productId: 'p-1', quantity: 1 }], count: 1 } });
    const store = guestStore();
    await store.dispatch(addToCart({ productId: 'p-1', quantity: 1 }));
    expect(mockPost).not.toHaveBeenCalled();

    store.dispatch(setAuthenticated(true));
    await store.dispatch(addToCart({ productId: 'p-2', quantity: 1 }));
    expect(mockPost).toHaveBeenCalledTimes(1);
  });

  it('AC7: derives the count from items when the response has no count', async () => {
    mockPost.mockResolvedValueOnce({
      data: { items: [{ productId: 'p-1', quantity: 2 }, { productId: 'p-2', quantity: 3 }] },
    });
    const store = authedStore();
    await store.dispatch(addToCart({ productId: 'p-1', quantity: 1 }));
    expect(selectCartCount(store.getState())).toBe(5);
  });

  it('AC7: uses the response count when items are missing or invalid', async () => {
    mockPost.mockResolvedValueOnce({ data: { items: 'garbage', count: 9 } });
    const store = authedStore();
    await store.dispatch(addToCart({ productId: 'p-1', quantity: 1 }));
    expect(selectCartCount(store.getState())).toBe(9);
    expect(store.getState().cart.items).toEqual([]);
  });

  it.each([
    ['negative count', { items: [], count: -1 }, 0],
    ['fractional count falls back to items', { items: [{ productId: 'p-1', quantity: 2 }], count: 1.5 }, 2],
  ])('AC7: ignores an invalid count (%s)', async (_label, data, expected) => {
    mockPost.mockResolvedValueOnce({ data });
    const store = authedStore();
    await store.dispatch(addToCart({ productId: 'p-1', quantity: 1 }));
    expect(selectCartCount(store.getState())).toBe(expected);
  });

  it('AC7: an empty/invalid response body still reports success but leaves the counter unchanged', async () => {
    // BUG (medium): a 2xx response without usable {items,count} marks the button "Added"
    // and shows the success toast, yet the header counter does not change.
    mockPost.mockResolvedValueOnce({ data: undefined });
    const store = authedStore();
    const result = await store.dispatch(addToCart({ productId: 'p-1', quantity: 1 }));
    expect(addToCart.fulfilled.match(result)).toBe(true);
    expect(result.payload).toEqual({ items: null, count: null });
    expect(selectCartCount(store.getState())).toBe(0);
    expect(selectAddStatus('p-1')(store.getState())).toBe('added');
  });

  it('AC7: 401 -> error state with the session-expired message', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401 } });
    const store = authedStore();
    const result = await store.dispatch(addToCart({ productId: 'p-1', quantity: 1 }));
    expect(addToCart.rejected.match(result)).toBe(true);
    expect(result.payload.code).toBe('UNAUTHENTICATED');
    expect(selectAddStatus('p-1')(store.getState())).toBe('error');
    expect(store.getState().cart.error).toBe('Your session has expired. Please sign in again.');
    expect(selectCartCount(store.getState())).toBe(0);
  });

  it('AC5: 409 -> out_of_stock status', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 409 } });
    const store = authedStore();
    const result = await store.dispatch(addToCart({ productId: 'p-1', quantity: 1 }));
    expect(result.payload.code).toBe('OUT_OF_STOCK');
    expect(selectAddStatus('p-1')(store.getState())).toBe('out_of_stock');
    expect(store.getState().cart.error).toBe('This item is out of stock.');
  });

  it('AC7: 400 -> error status with the generic message', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 400, data: { message: 'internal detail' } } });
    const store = authedStore();
    const result = await store.dispatch(addToCart({ productId: 'p-1', quantity: 1 }));
    expect(result.payload).toEqual({ code: 'INVALID_INPUT', message: GENERIC_ERROR_MESSAGE });
    expect(selectAddStatus('p-1')(store.getState())).toBe('error');
  });

  it('AC7: 500 -> error status with the generic message and unchanged count', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 500, data: 'stack trace here' } });
    const store = authedStore();
    const result = await store.dispatch(addToCart({ productId: 'p-1', quantity: 1 }));
    expect(result.payload).toEqual({ code: 'SERVER_ERROR', message: GENERIC_ERROR_MESSAGE });
    expect(store.getState().cart.error).toBe(GENERIC_ERROR_MESSAGE);
    expect(selectCartCount(store.getState())).toBe(0);
  });

  it('AC7: network failure -> error status', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network Error'));
    const store = authedStore();
    const result = await store.dispatch(addToCart({ productId: 'p-1', quantity: 1 }));
    expect(result.payload.code).toBe('SERVER_ERROR');
    expect(selectAddStatus('p-1')(store.getState())).toBe('error');
  });

  it('AC8: invalid input for a logged-in user never reaches the API', async () => {
    const store = authedStore();
    const result = await store.dispatch(addToCart({ productId: '', quantity: 1 }));
    expect(result.payload.code).toBe('INVALID_INPUT');
    expect(mockPost).not.toHaveBeenCalled();
  });
});
