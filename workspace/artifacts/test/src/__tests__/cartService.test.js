import axios from 'axios';
import { ADD_TO_CART_PATH, CartError, addItem } from '../services/cartService';

jest.mock('axios', () => {
  const post = jest.fn();
  return { __esModule: true, default: { create: jest.fn(() => ({ post })), post } };
});

const mockPost = axios.post;

async function captureRejection(promise) {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  throw new Error('Expected promise to reject');
}

beforeEach(() => {
  window.localStorage.clear();
  mockPost.mockReset();
});

describe('AC-7 Logged-in cart syncs with backend', () => {
  it('shouldPostToCartAddEndpointWhenAddItemCalled', async () => {
    const data = { items: [{ productId: 'p-1001', quantity: 1 }], count: 1 };
    mockPost.mockResolvedValue({ data });
    const result = await addItem('p-1001', 1);
    expect(mockPost).toHaveBeenCalledWith(ADD_TO_CART_PATH, { productId: 'p-1001', quantity: 1 });
    expect(ADD_TO_CART_PATH).toBe('/api/cart/add');
    expect(result).toEqual(data);
  });

  it.each([
    [401, 'UNAUTHENTICATED'],
    [409, 'OUT_OF_STOCK'],
    [500, 'SERVER_ERROR'],
  ])('shouldMapToSafeCartErrorWhenBackendFailsWithStatus %p as %s', async (status, code) => {
    mockPost.mockRejectedValue(
      status ? { response: { status, data: 'SECRET stack trace' } } : new Error('Network Error')
    );
    const err = await captureRejection(addItem('p-1001', 1));
    expect(err).toBeInstanceOf(CartError);
    expect(err.code).toBe(code);
    expect(err.message).not.toContain('SECRET');
  });
});
