import { MAX_QUANTITY, sanitizeItems } from './cartDto';

export const GUEST_CART_KEY = 'guest_cart_v1';
const MAX_RAW_LENGTH = 10000;
const SKIPPABLE_STATUSES = [400, 404, 409];

function getStorage() {
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
}

export function clearGuestCart() {
  try {
    getStorage()?.removeItem(GUEST_CART_KEY);
  } catch (error) {
    return;
  }
}

export function readGuestCart() {
  try {
    const raw = getStorage()?.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    if (raw.length > MAX_RAW_LENGTH) throw new Error('oversized');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('invalid');
    return sanitizeItems(parsed);
  } catch (error) {
    clearGuestCart();
    return [];
  }
}

export function writeGuestCart(items) {
  const clean = sanitizeItems(items);
  try {
    getStorage()?.setItem(GUEST_CART_KEY, JSON.stringify(clean));
  } catch (error) {
    return clean;
  }
  return clean;
}

export function addGuestItem(productId, quantity = 1) {
  const items = readGuestCart();
  const existing = items.find((item) => item.productId === productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, MAX_QUANTITY);
  } else {
    items.push({ productId, quantity });
  }
  return writeGuestCart(items);
}

export async function mergeGuestCart(addItem) {
  const items = readGuestCart();
  for (const item of items) {
    try {
      await addItem({ productId: item.productId, quantity: item.quantity });
    } catch (error) {
      if (!SKIPPABLE_STATUSES.includes(error?.status)) throw error;
    }
  }
  clearGuestCart();
  return items.length;
}
