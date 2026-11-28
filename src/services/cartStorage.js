import {
  MAX_CART_ENTRIES,
  MAX_QUANTITY,
  isValidProductId,
  isValidQuantity,
  validateCartSchema,
} from '../utils/validators';

export const GUEST_CART_KEY = 'guest_cart';

// Reads the guest cart; returns [] on missing, corrupt or schema-invalid data.
export function loadGuestCart() {
  try {
    const raw = window.localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return validateCartSchema(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

// Returns true when persisted, false on quota/security errors or invalid input.
export function saveGuestCart(items) {
  if (!validateCartSchema(items)) return false;
  try {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
    return true;
  } catch (e) {
    return false;
  }
}

export function clearGuestCart() {
  try {
    window.localStorage.removeItem(GUEST_CART_KEY);
  } catch (e) {
    // ignore
  }
}

// Adds (or merges) an item into the guest cart; returns the updated items or throws.
export function addGuestItem(productId, quantity = 1) {
  if (!isValidProductId(productId) || !isValidQuantity(quantity)) {
    throw new Error('INVALID_INPUT');
  }
  const id = String(productId);
  const items = loadGuestCart().map((entry) => ({ ...entry }));
  const existing = items.find((entry) => entry.productId === id);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + quantity, MAX_QUANTITY);
  } else {
    if (items.length >= MAX_CART_ENTRIES) throw new Error('CART_FULL');
    items.push({ productId: id, quantity });
  }
  if (!saveGuestCart(items)) throw new Error('STORAGE_FAILED');
  return items;
}
