export const PRODUCT_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 99;
export const MAX_CART_ENTRIES = 100;

export function isValidProductId(productId) {
  if (typeof productId !== 'string' && typeof productId !== 'number') return false;
  return PRODUCT_ID_PATTERN.test(String(productId));
}

export function isValidQuantity(quantity) {
  return Number.isInteger(quantity) && quantity >= MIN_QUANTITY && quantity <= MAX_QUANTITY;
}

// Cart schema: array (max 100) of { productId, quantity } with validated fields.
export function validateCartSchema(items) {
  if (!Array.isArray(items) || items.length > MAX_CART_ENTRIES) return false;
  return items.every(
    (entry) =>
      entry !== null &&
      typeof entry === 'object' &&
      isValidProductId(entry.productId) &&
      isValidQuantity(entry.quantity)
  );
}

// Only http(s) image URLs are rendered.
export function isSafeImageUrl(url) {
  if (typeof url !== 'string' || url.length === 0) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch (e) {
    return false;
  }
}
