import { toErrorBody, validateAddToCartRequest } from '../services/cartDto';
import { CartServiceError } from './cartServerService';

const BEARER_RE = /^Bearer\s+(\S+)$/;

export function createRateLimiter({ limit = 30, windowMs = 60000, now = Date.now } = {}) {
  const hits = new Map();
  return (key) => {
    const time = now();
    const entry = hits.get(key);
    if (!entry || time - entry.start >= windowMs) {
      hits.set(key, { start: time, count: 1 });
      return { allowed: true };
    }
    entry.count += 1;
    if (entry.count <= limit) return { allowed: true };
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((entry.start + windowMs - time) / 1000)) };
  };
}

export function createCartRouteHandlers({ cartService, verifyToken, rateLimiter = createRateLimiter() }) {
  const respond = (status, body, headers = {}) => ({ status, body, headers });
  const fail = (status, code, message, headers) => respond(status, toErrorBody(code, message), headers);

  const guard = (req) => {
    const match = BEARER_RE.exec((req.headers && req.headers.authorization) || '');
    let userId = null;
    try {
      userId = match ? verifyToken(match[1]) : null;
    } catch (error) {
      userId = null;
    }
    const limit = rateLimiter(userId || req.ip || 'anonymous');
    if (!limit.allowed) {
      return { response: fail(429, 'RATE_LIMITED', 'Too many requests.', { 'Retry-After': String(limit.retryAfterSeconds) }) };
    }
    if (!userId) return { response: fail(401, 'UNAUTHENTICATED', 'Authentication required.') };
    return { userId };
  };

  const run = (action) => {
    try {
      return respond(200, action());
    } catch (error) {
      if (error instanceof CartServiceError) return fail(error.status, error.code, error.message);
      return fail(500, 'INTERNAL', 'Something went wrong.');
    }
  };

  return {
    postAdd(req) {
      const { userId, response } = guard(req);
      if (response) return response;
      const checked = validateAddToCartRequest(req.body);
      if (!checked.ok) return fail(400, 'VALIDATION', 'Invalid request.');
      return run(() => cartService.addItem(userId, checked.value));
    },
    getCart(req) {
      const { userId, response } = guard(req);
      if (response) return response;
      return run(() => cartService.getCart(userId));
    },
  };
}

export default createCartRouteHandlers;
