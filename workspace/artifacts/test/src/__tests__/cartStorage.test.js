import { GUEST_CART_KEY, addGuestItem, loadGuestCart } from '../services/cartStorage';

const stored = () => JSON.parse(window.localStorage.getItem(GUEST_CART_KEY));

beforeEach(() => {
  window.localStorage.clear();
});

describe('AC-6 Guest cart stored in local storage', () => {
  it.each([
    ['new product', [], 'p-1', 2, [{ productId: 'p-1', quantity: 2 }]],
    ['existing product is merged', [{ productId: 'p-1', quantity: 1 }], 'p-1', 2, [{ productId: 'p-1', quantity: 3 }]],
    ['quantity capped at 99', [{ productId: 'p-1', quantity: 98 }], 'p-1', 5, [{ productId: 'p-1', quantity: 99 }]],
  ])('shouldPersistItemInLocalStorageWhenGuestAddsItem (%s)', (_label, seed, productId, quantity, expected) => {
    if (seed.length) window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(seed));
    const result = addGuestItem(productId, quantity);
    expect(result).toEqual(expected);
    expect(stored()).toEqual(expected);
  });

  it.each([
    ['corrupt JSON', 'not json'],
    ['unsafe product id', '[{"productId":"bad id!","quantity":1}]'],
  ])('shouldReturnEmptyCartWhenStoredDataIsInvalid (%s)', (_label, raw) => {
    window.localStorage.setItem(GUEST_CART_KEY, raw);
    expect(loadGuestCart()).toEqual([]);
  });
});
