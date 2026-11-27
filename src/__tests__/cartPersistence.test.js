import axios from 'axios';
import { createAppStore } from '../store';
import { setToken } from '../store/authSlice';
import { addToCart, syncGuestCartOnLogin } from '../store/cartSlice';
import cartService from '../services/cartService';
import { GUEST_CART_KEY, readGuestCart, writeGuestCart, mergeGuestCart } from '../services/guestCartStorage';

jest.mock('axios', () => ({ __esModule: true, default: { post: jest.fn(), get: jest.fn() } }));

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
});

describe('AC4 - Guest users (local storage)', () => {
  it('shouldPersistItemsInGuestCartKeyAndMergeQuantitiesWhenGuestAddsSameProductTwice', async () => {
    const store = createAppStore();

    await store.dispatch(addToCart({ productId: 'p-1001', quantity: 1 }));
    await store.dispatch(addToCart({ productId: 'p-1001', quantity: 2 }));
    await store.dispatch(addToCart({ productId: 'p-1004', quantity: 1 }));

    expect(JSON.parse(window.localStorage.getItem(GUEST_CART_KEY))).toEqual([
      { productId: 'p-1001', quantity: 3 },
      { productId: 'p-1004', quantity: 1 },
    ]);
    expect(store.getState().cart.count).toBe(4);
    expect(axios.post).not.toHaveBeenCalled();
  });

  it.each([
    ['malformed JSON', '{not json'],
    ['non-array JSON', '{"productId":"p-1","quantity":1}'],
    ['oversized payload', JSON.stringify([{ productId: 'p-1', quantity: 1 }]) + ' '.repeat(10001)],
  ])('shouldReturnEmptyCartWhenStoredGuestCartIs %s', (_label, raw) => {
    window.localStorage.setItem(GUEST_CART_KEY, raw);
    expect(readGuestCart()).toEqual([]);
  });

  it('shouldClampQuantityAndDropDuplicatesWhenStoredGuestCartIsTampered', () => {
    window.localStorage.setItem(
      GUEST_CART_KEY,
      JSON.stringify([
        { productId: 'p-1', quantity: 5000 },
        { productId: 'p-1', quantity: 2 },
        { productId: 'p-2', quantity: -4 },
      ])
    );
    expect(readGuestCart()).toEqual([
      { productId: 'p-1', quantity: 99 },
      { productId: 'p-2', quantity: 1 },
    ]);
  });
});

describe('AC4 - Logged-in users (backend sync)', () => {
  it('shouldPostToCartAddWithBearerTokenAndUpdateCountWhenLoggedIn', async () => {
    axios.post.mockResolvedValue({ data: { items: [{ productId: 'p-1001', quantity: 1 }], totalCount: 1, message: 'ok' } });
    const store = createAppStore();
    store.dispatch(setToken('tok-123'));

    await store.dispatch(addToCart({ productId: 'p-1001', quantity: 1 }));

    expect(axios.post).toHaveBeenCalledTimes(1);
    const [url, body, config] = axios.post.mock.calls[0];
    expect(url).toBe('/api/cart/add');
    expect(body).toEqual({ productId: 'p-1001', quantity: 1 });
    expect(config.headers.Authorization).toBe('Bearer tok-123');
    expect(store.getState().cart.count).toBe(1);
    expect(window.localStorage.getItem(GUEST_CART_KEY)).toBeNull();
  });

  it.each([
    ['401 unauthorized', { response: { status: 401 } }, 401, 'UNAUTHENTICATED'],
    ['404 not found', { response: { status: 404 } }, 404, 'NOT_FOUND'],
    ['409 conflict', { response: { status: 409 } }, 409, 'OUT_OF_STOCK'],
    ['network failure', new Error('Network Error'), 0, 'NETWORK'],
  ])('shouldRejectWithMappedErrorWhenBackendReturns %s', async (_label, failure, status, code) => {
    axios.post.mockRejectedValue(failure);
    await expect(cartService.addToCart('tok', { productId: 'p-1', quantity: 1 })).rejects.toMatchObject({ status, code });
  });

  it('shouldRejectWith401WithoutCallingBackendWhenTokenMissing', async () => {
    await expect(cartService.addToCart(null, { productId: 'p-1', quantity: 1 })).rejects.toMatchObject({ status: 401 });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('shouldPostGuestItemsAndClearLocalStorageWhenGuestLogsIn', async () => {
    writeGuestCart([
      { productId: 'p-1001', quantity: 2 },
      { productId: 'p-1003', quantity: 1 },
    ]);
    axios.post
      .mockResolvedValueOnce({ data: { items: [], totalCount: 0 } })
      .mockRejectedValueOnce({ response: { status: 409 } }); // skippable: out of stock item
    axios.get.mockResolvedValue({ data: { items: [{ productId: 'p-1001', quantity: 2 }], totalCount: 2 } });
    const store = createAppStore();
    store.dispatch(setToken('tok-9'));

    await store.dispatch(syncGuestCartOnLogin());

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post.mock.calls[0][1]).toEqual({ productId: 'p-1001', quantity: 2 });
    expect(window.localStorage.getItem(GUEST_CART_KEY)).toBeNull();
    expect(store.getState().cart.count).toBe(2);
  });

  it('shouldKeepGuestCartWhenMergeFailsWithNonSkippableError', async () => {
    writeGuestCart([{ productId: 'p-1001', quantity: 1 }]);
    const failing = jest.fn().mockRejectedValue({ status: 401 });

    await expect(mergeGuestCart(failing)).rejects.toMatchObject({ status: 401 });
    expect(readGuestCart()).toEqual([{ productId: 'p-1001', quantity: 1 }]);
  });
});
