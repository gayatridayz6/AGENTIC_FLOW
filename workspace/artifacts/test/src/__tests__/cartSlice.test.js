import axios from 'axios';
import { GUEST_CART_KEY } from '../services/cartStorage';
import { createAppStore } from '../store';
import { setAuthenticated } from '../store/authSlice';
import { addToCart } from '../store/cartSlice';

jest.mock('axios', () => {
  const post = jest.fn();
  return { __esModule: true, default: { create: jest.fn(() => ({ post })), post } };
});

const mockPost = axios.post;

beforeEach(() => {
  window.localStorage.clear();
  mockPost.mockReset();
});

describe('AC-2 addToCart thunk adds the item to the cart', () => {
  it('shouldIncreaseQuantityAndCountWhenSameProductAddedTwice', async () => {
    const store = createAppStore();
    await store.dispatch(addToCart({ productId: 'p-1001', quantity: 1 }));
    await store.dispatch(addToCart({ productId: 'p-1001', quantity: 1 }));
    const { items, count } = store.getState().cart;
    expect(items).toEqual([{ productId: 'p-1001', quantity: 2 }]);
    expect(count).toBe(2);
  });

  it.each([
    ['bad id!', 1],
    ['p-1', 0],
    ['p-1', 100],
  ])('shouldRejectWithInvalidInputWhenProductId %p and quantity %p are invalid', async (productId, quantity) => {
    const store = createAppStore();
    const result = await store.dispatch(addToCart({ productId, quantity }));
    expect(addToCart.rejected.match(result)).toBe(true);
    expect(result.payload.code).toBe('INVALID_INPUT');
    expect(store.getState().cart.items).toEqual([]);
    expect(window.localStorage.getItem(GUEST_CART_KEY)).toBeNull();
  });
});

describe('AC-7 Logged-in users sync with the backend', () => {
  const serverItems = [{ productId: 'p-1001', quantity: 3 }];

  it.each([
    ['server returns count', { items: serverItems, count: 3 }],
    ['server omits count so it is computed from items', { items: serverItems }],
  ])('shouldSyncCartFromServerAndSkipLocalStorageWhenAuthenticated (%s)', async (_label, data) => {
    mockPost.mockResolvedValue({ data });
    const store = createAppStore();
    store.dispatch(setAuthenticated(true));
    await store.dispatch(addToCart({ productId: 'p-1001', quantity: 1 }));
    expect(mockPost).toHaveBeenCalledWith('/api/cart/add', { productId: 'p-1001', quantity: 1 });
    expect(store.getState().cart.items).toEqual(serverItems);
    expect(store.getState().cart.count).toBe(3);
    expect(window.localStorage.getItem(GUEST_CART_KEY)).toBeNull();
  });
});
