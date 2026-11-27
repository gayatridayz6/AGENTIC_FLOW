import { createCartRepository } from '../server/cartRepository';
import { createCartServerService } from '../server/cartServerService';
import { createCartRouteHandlers, createRateLimiter } from '../server/cartRouteHandler';
import { products } from '../data/products';

const VALID_AUTH = { authorization: 'Bearer good-token' };

const buildHandlers = (overrides = {}) => {
  const repository = createCartRepository();
  const cartService = createCartServerService({
    repository,
    findProduct: (id) => products.find((p) => p.id === id),
  });
  const verifyToken = (token) => {
    if (token === 'good-token') return 'user-1';
    if (token === 'throws') throw new Error('bad signature');
    return null;
  };
  const handlers = createCartRouteHandlers({ cartService, verifyToken, ...overrides });
  return { handlers, repository };
};

const post = (handlers, body, headers = VALID_AUTH) => handlers.postAdd({ headers, body, ip: '1.2.3.4' });

describe('AC4 - POST /api/cart/add handler (backend sync)', () => {
  it('shouldReturn200WithCartSummaryWhenAuthenticatedAndProductInStock', () => {
    const { handlers } = buildHandlers();

    const res = post(handlers, { productId: 'p-1001', quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [{ productId: 'p-1001', quantity: 2 }], totalCount: 2, message: 'Item added to cart!' });
  });

  it('shouldAccumulateQuantityAndDefaultToOneWhenSameProductAddedAgain', () => {
    const { handlers } = buildHandlers();

    post(handlers, { productId: 'p-1002' });
    const res = post(handlers, { productId: 'p-1002', quantity: 2 });

    expect(res.status).toBe(200);
    expect(res.body.totalCount).toBe(3);
    expect(handlers.getCart({ headers: VALID_AUTH, ip: 'x' }).body.items).toEqual([{ productId: 'p-1002', quantity: 3 }]);
  });

  it.each([
    ['missing Authorization header', {}, { productId: 'p-1001', quantity: 1 }, 401, 'UNAUTHENTICATED'],
    ['unknown token', { authorization: 'Bearer nope' }, { productId: 'p-1001', quantity: 1 }, 401, 'UNAUTHENTICATED'],
    ['verifier throwing', { authorization: 'Bearer throws' }, { productId: 'p-1001', quantity: 1 }, 401, 'UNAUTHENTICATED'],
    ['missing body', VALID_AUTH, undefined, 400, 'VALIDATION'],
    ['extra unexpected key', VALID_AUTH, { productId: 'p-1001', quantity: 1, price: 0 }, 400, 'VALIDATION'],
    ['quantity zero', VALID_AUTH, { productId: 'p-1001', quantity: 0 }, 400, 'VALIDATION'],
    ['quantity above max', VALID_AUTH, { productId: 'p-1001', quantity: 100 }, 400, 'VALIDATION'],
    ['malformed productId', VALID_AUTH, { productId: '../etc', quantity: 1 }, 400, 'VALIDATION'],
    ['unknown product', VALID_AUTH, { productId: 'p-9999', quantity: 1 }, 404, 'NOT_FOUND'],
    ['out-of-stock product', VALID_AUTH, { productId: 'p-1003', quantity: 1 }, 409, 'OUT_OF_STOCK'],
    ['quantity exceeding stock', VALID_AUTH, { productId: 'p-1002', quantity: 4 }, 409, 'OUT_OF_STOCK'],
  ])('shouldReturnErrorStatusWhen %s', (_label, headers, body, status, code) => {
    const { handlers } = buildHandlers();

    const res = post(handlers, body, headers);

    expect(res.status).toBe(status);
    expect(res.body.error.code).toBe(code);
  });

  it('shouldReturn429WithRetryAfterWhenRateLimitExceeded', () => {
    const { handlers } = buildHandlers({ rateLimiter: createRateLimiter({ limit: 2, windowMs: 60000, now: () => 1000 }) });

    expect(post(handlers, { productId: 'p-1001', quantity: 1 }).status).toBe(200);
    expect(post(handlers, { productId: 'p-1001', quantity: 1 }).status).toBe(200);
    const res = post(handlers, { productId: 'p-1001', quantity: 1 });

    expect(res.status).toBe(429);
    expect(res.headers['Retry-After']).toBe('60');
  });

  it('shouldReturn500WithoutLeakingDetailsWhenServiceThrowsUnexpectedError', () => {
    const cartService = { addItem: () => { throw new Error('db password=secret'); }, getCart: jest.fn() };
    const handlers = createCartRouteHandlers({ cartService, verifyToken: () => 'user-1' });

    const res = post(handlers, { productId: 'p-1001', quantity: 1 });

    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });
});
