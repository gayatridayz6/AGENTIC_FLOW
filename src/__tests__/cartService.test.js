import axios from 'axios';
import cartServiceDefault, {
  ADD_TO_CART_PATH,
  CartError,
  GENERIC_ERROR_MESSAGE,
  REQUEST_TIMEOUT_MS,
  addItem,
  apiClient,
  mapError,
} from '../services/cartService';

// axios.create() runs when cartService is first imported, so we mock axios with a
// factory that hands back a client whose `post` is a controllable jest.fn().
jest.mock('axios', () => {
  const post = jest.fn();
  return { __esModule: true, default: { create: jest.fn(() => ({ post })), post } };
});

// Captured at module scope, before any test can clear mock history.
const createConfig = axios.create.mock.calls[0][0];
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
  mockPost.mockReset();
});

describe('cartService configuration', () => {
  it('AC8: creates the axios client with credentials, JSON header and a timeout', () => {
    expect(createConfig.withCredentials).toBe(true);
    expect(createConfig.timeout).toBe(REQUEST_TIMEOUT_MS);
    expect(REQUEST_TIMEOUT_MS).toBe(10000);
    expect(createConfig.headers).toEqual({ 'Content-Type': 'application/json' });
    expect(typeof createConfig.baseURL).toBe('string');
  });

  it('AC8: exports the add-to-cart endpoint path /api/cart/add', () => {
    expect(ADD_TO_CART_PATH).toBe('/api/cart/add');
  });

  it('AC8: exposes apiClient and a default export with addItem', () => {
    expect(apiClient.post).toBe(mockPost);
    expect(cartServiceDefault.addItem).toBe(addItem);
  });
});

describe('addItem', () => {
  it('AC8: POSTs {productId, quantity} to /api/cart/add and returns response data', async () => {
    const data = { items: [{ productId: 'p-1001', quantity: 2 }], count: 2 };
    mockPost.mockResolvedValueOnce({ data });

    await expect(addItem('p-1001', 2)).resolves.toEqual(data);

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith('/api/cart/add', { productId: 'p-1001', quantity: 2 });
  });

  it('AC8: defaults quantity to 1', async () => {
    mockPost.mockResolvedValueOnce({ data: { items: [], count: 0 } });
    await addItem('p-1001');
    expect(mockPost).toHaveBeenCalledWith('/api/cart/add', { productId: 'p-1001', quantity: 1 });
  });

  it('AC8: accepts a numeric product id', async () => {
    mockPost.mockResolvedValueOnce({ data: { items: [], count: 0 } });
    await addItem(12, 1);
    expect(mockPost).toHaveBeenCalledWith('/api/cart/add', { productId: 12, quantity: 1 });
  });

  it.each([
    ['empty productId', '', 1],
    ['malformed productId', 'a b/c', 1],
    ['null productId', null, 1],
    ['quantity 0', 'p-1', 0],
    ['quantity 100', 'p-1', 100],
    ['fractional quantity', 'p-1', 1.5],
    ['string quantity', 'p-1', '1'],
  ])('AC8: rejects %s with INVALID_INPUT before calling the API', async (_label, id, qty) => {
    const err = await captureRejection(addItem(id, qty));
    expect(err).toBeInstanceOf(CartError);
    expect(err.code).toBe('INVALID_INPUT');
    expect(err.message).toBe(GENERIC_ERROR_MESSAGE);
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('AC7: maps a 401 response to UNAUTHENTICATED with a session-expired message', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 401, data: { message: 'secret' } } });
    const err = await captureRejection(addItem('p-1', 1));
    expect(err).toBeInstanceOf(CartError);
    expect(err.code).toBe('UNAUTHENTICATED');
    expect(err.status).toBe(401);
    expect(err.message).toBe('Your session has expired. Please sign in again.');
  });

  it('AC5: maps a 409 response to OUT_OF_STOCK', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 409 } });
    const err = await captureRejection(addItem('p-1', 1));
    expect(err.code).toBe('OUT_OF_STOCK');
    expect(err.status).toBe(409);
    expect(err.message).toBe('This item is out of stock.');
  });

  it('AC7: maps a 400 response to INVALID_INPUT with the generic message', async () => {
    mockPost.mockRejectedValueOnce({ response: { status: 400, data: { detail: 'bad field xyz' } } });
    const err = await captureRejection(addItem('p-1', 1));
    expect(err.code).toBe('INVALID_INPUT');
    expect(err.status).toBe(400);
    expect(err.message).toBe(GENERIC_ERROR_MESSAGE);
  });

  it('AC7: maps a 500 response to SERVER_ERROR and never leaks server text', async () => {
    mockPost.mockRejectedValueOnce({
      message: 'Request failed with status code 500',
      response: { status: 500, data: { message: 'NullPointerException at com.shop.Cart' } },
    });
    const err = await captureRejection(addItem('p-1', 1));
    expect(err.code).toBe('SERVER_ERROR');
    expect(err.status).toBe(500);
    expect(err.message).toBe(GENERIC_ERROR_MESSAGE);
    expect(err.message).not.toMatch(/NullPointer|500|com\.shop/);
  });

  it('AC7: maps a network error (no response) to SERVER_ERROR with undefined status', async () => {
    mockPost.mockRejectedValueOnce(new Error('Network Error'));
    const err = await captureRejection(addItem('p-1', 1));
    expect(err.code).toBe('SERVER_ERROR');
    expect(err.status).toBeUndefined();
    expect(err.message).toBe(GENERIC_ERROR_MESSAGE);
  });
});

describe('mapError', () => {
  it.each([
    [401, 'UNAUTHENTICATED'],
    [409, 'OUT_OF_STOCK'],
    [400, 'INVALID_INPUT'],
    [403, 'SERVER_ERROR'],
    [404, 'SERVER_ERROR'],
    [500, 'SERVER_ERROR'],
    [503, 'SERVER_ERROR'],
  ])('AC7: status %i -> %s', (status, code) => {
    const err = mapError({ response: { status } });
    expect(err).toBeInstanceOf(CartError);
    expect(err.code).toBe(code);
    expect(err.status).toBe(status);
  });

  it('AC7: handles null / undefined / response-less errors', () => {
    expect(mapError(null).code).toBe('SERVER_ERROR');
    expect(mapError(undefined).code).toBe('SERVER_ERROR');
    expect(mapError({}).code).toBe('SERVER_ERROR');
    expect(mapError({ response: null }).code).toBe('SERVER_ERROR');
  });
});

describe('CartError', () => {
  it('AC7: is an Error carrying name, code, message and status', () => {
    const err = new CartError('X', 'msg', 418);
    expect(err).toBeInstanceOf(Error);
    expect(err.name).toBe('CartError');
    expect(err.code).toBe('X');
    expect(err.message).toBe('msg');
    expect(err.status).toBe(418);
  });
});
