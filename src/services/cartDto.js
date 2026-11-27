export const MAX_QUANTITY = 99;
export const MAX_LINE_ITEMS = 100;

const PRODUCT_ID_RE = /^[A-Za-z0-9_-]{1,64}$/;
const ALLOWED_KEYS = ['productId', 'quantity'];

export const isValidProductId = (value) => typeof value === 'string' && PRODUCT_ID_RE.test(value);

export const isValidQuantity = (value) => Number.isInteger(value) && value >= 1 && value <= MAX_QUANTITY;

export function validateAddToCartRequest(body) {
  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { ok: false };
  }
  if (Object.keys(body).some((key) => !ALLOWED_KEYS.includes(key))) {
    return { ok: false };
  }
  const quantity = body.quantity === undefined ? 1 : body.quantity;
  if (!isValidProductId(body.productId) || !isValidQuantity(quantity)) {
    return { ok: false };
  }
  return { ok: true, value: { productId: body.productId, quantity } };
}

export function sanitizeItems(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Map();
  for (const entry of list) {
    if (entry === null || typeof entry !== 'object') continue;
    const { productId, quantity } = entry;
    if (!isValidProductId(productId) || !Number.isInteger(quantity) || seen.has(productId)) continue;
    seen.set(productId, { productId, quantity: Math.min(Math.max(quantity, 1), MAX_QUANTITY) });
    if (seen.size >= MAX_LINE_ITEMS) break;
  }
  return Array.from(seen.values());
}

export const countItems = (items) => items.reduce((sum, item) => sum + item.quantity, 0);

export function toCartResponse(items, message = '') {
  return { items, totalCount: countItems(items), message };
}

export const toErrorBody = (code, message) => ({ error: { code, message } });
