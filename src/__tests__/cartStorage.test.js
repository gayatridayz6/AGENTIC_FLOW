import {
  GUEST_CART_KEY,
  addGuestItem,
  clearGuestCart,
  loadGuestCart,
  saveGuestCart,
} from '../services/cartStorage';

const readRaw = () => window.localStorage.getItem(GUEST_CART_KEY);
const makeEntries = (n) =>
  Array.from({ length: n }, (_, i) => ({ productId: `p${i}`, quantity: 1 }));

afterEach(() => {
  jest.restoreAllMocks();
});

describe('loadGuestCart', () => {
  it('AC6: uses the "guest_cart" localStorage key', () => {
    expect(GUEST_CART_KEY).toBe('guest_cart');
  });

  it('AC6: returns [] when nothing is stored', () => {
    expect(loadGuestCart()).toEqual([]);
  });

  it('AC6: returns [] for an empty string value', () => {
    window.localStorage.setItem(GUEST_CART_KEY, '');
    expect(loadGuestCart()).toEqual([]);
  });

  it('AC6: returns the stored cart when valid', () => {
    const cart = [{ productId: 'p-1001', quantity: 2 }];
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
    expect(loadGuestCart()).toEqual(cart);
  });

  it('AC6: returns [] for corrupt JSON', () => {
    window.localStorage.setItem(GUEST_CART_KEY, '{not json');
    expect(loadGuestCart()).toEqual([]);
  });

  it('AC6: returns [] when JSON is "null"', () => {
    window.localStorage.setItem(GUEST_CART_KEY, 'null');
    expect(loadGuestCart()).toEqual([]);
  });

  it.each([
    ['object instead of array', { productId: 'p-1', quantity: 1 }],
    ['bad product id', [{ productId: '<script>', quantity: 1 }]],
    ['bad quantity', [{ productId: 'p-1', quantity: 1000 }]],
    ['too many entries', makeEntries(101)],
  ])('AC6: returns [] for schema-invalid data (%s)', (_label, value) => {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(value));
    expect(loadGuestCart()).toEqual([]);
  });

  it('AC6: returns [] when localStorage.getItem throws', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(loadGuestCart()).toEqual([]);
  });
});

describe('saveGuestCart', () => {
  it('AC6: persists a valid cart and returns true', () => {
    const cart = [{ productId: 'p-1', quantity: 3 }];
    expect(saveGuestCart(cart)).toBe(true);
    expect(JSON.parse(readRaw())).toEqual(cart);
  });

  it('AC6: persists an empty cart', () => {
    expect(saveGuestCart([])).toBe(true);
    expect(readRaw()).toBe('[]');
  });

  it('AC6: rejects an invalid cart without writing', () => {
    expect(saveGuestCart([{ productId: '', quantity: 1 }])).toBe(false);
    expect(saveGuestCart('nope')).toBe(false);
    expect(readRaw()).toBeNull();
  });

  it('AC6: returns false when localStorage.setItem throws (quota/security)', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(saveGuestCart([{ productId: 'p-1', quantity: 1 }])).toBe(false);
  });
});

describe('clearGuestCart', () => {
  it('AC6: removes the stored cart', () => {
    saveGuestCart([{ productId: 'p-1', quantity: 1 }]);
    clearGuestCart();
    expect(readRaw()).toBeNull();
  });

  it('AC6: does not throw when removeItem throws', () => {
    jest.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    expect(() => clearGuestCart()).not.toThrow();
  });
});

describe('addGuestItem', () => {
  it('AC6: adds a new item with default quantity 1 and persists it', () => {
    const items = addGuestItem('p-1001');
    expect(items).toEqual([{ productId: 'p-1001', quantity: 1 }]);
    expect(JSON.parse(readRaw())).toEqual(items);
  });

  it('AC6: adds a new item with an explicit quantity', () => {
    expect(addGuestItem('p-1', 4)).toEqual([{ productId: 'p-1', quantity: 4 }]);
  });

  it('AC6: normalises numeric product ids to strings', () => {
    expect(addGuestItem(5, 1)).toEqual([{ productId: '5', quantity: 1 }]);
  });

  it('AC6: merges quantities for an existing product', () => {
    addGuestItem('p-1', 2);
    const items = addGuestItem('p-1', 3);
    expect(items).toEqual([{ productId: 'p-1', quantity: 5 }]);
    expect(JSON.parse(readRaw())).toEqual(items);
  });

  it('AC6: keeps other products untouched when merging', () => {
    addGuestItem('p-1', 1);
    addGuestItem('p-2', 1);
    const items = addGuestItem('p-1', 1);
    expect(items).toEqual([
      { productId: 'p-1', quantity: 2 },
      { productId: 'p-2', quantity: 1 },
    ]);
  });

  it('AC6: caps a merged quantity at MAX_QUANTITY (99)', () => {
    addGuestItem('p-1', 98);
    expect(addGuestItem('p-1', 5)).toEqual([{ productId: 'p-1', quantity: 99 }]);
  });

  it.each([
    ['empty id', '', 1],
    ['bad id', 'a b', 1],
    ['null id', null, 1],
    ['zero quantity', 'p-1', 0],
    ['too large quantity', 'p-1', 100],
    ['fractional quantity', 'p-1', 1.5],
    ['string quantity', 'p-1', '2'],
  ])('AC6: throws INVALID_INPUT for %s and writes nothing', (_label, id, qty) => {
    expect(() => addGuestItem(id, qty)).toThrow('INVALID_INPUT');
    expect(readRaw()).toBeNull();
  });

  it('AC6: throws CART_FULL when adding a new product to a full cart', () => {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(makeEntries(100)));
    expect(() => addGuestItem('brand-new', 1)).toThrow('CART_FULL');
  });

  it('AC6: still merges into an existing product when the cart is full', () => {
    window.localStorage.setItem(GUEST_CART_KEY, JSON.stringify(makeEntries(100)));
    const items = addGuestItem('p0', 2);
    expect(items).toHaveLength(100);
    expect(items[0]).toEqual({ productId: 'p0', quantity: 3 });
  });

  it('AC6: throws STORAGE_FAILED when persisting fails', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => addGuestItem('p-1', 1)).toThrow('STORAGE_FAILED');
  });

  it('AC6: starts from an empty cart when stored data is corrupt', () => {
    window.localStorage.setItem(GUEST_CART_KEY, '%%%corrupt%%%');
    expect(addGuestItem('p-1', 1)).toEqual([{ productId: 'p-1', quantity: 1 }]);
    expect(JSON.parse(readRaw())).toEqual([{ productId: 'p-1', quantity: 1 }]);
  });

  it('AC6: does not mutate previously loaded cart objects', () => {
    addGuestItem('p-1', 1);
    const before = loadGuestCart();
    addGuestItem('p-1', 1);
    expect(before).toEqual([{ productId: 'p-1', quantity: 1 }]);
  });
});
