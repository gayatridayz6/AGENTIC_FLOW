import {
  MAX_CART_ENTRIES,
  MAX_QUANTITY,
  MIN_QUANTITY,
  PRODUCT_ID_PATTERN,
  isSafeImageUrl,
  isValidProductId,
  isValidQuantity,
  validateCartSchema,
} from '../utils/validators';

describe('validators constants', () => {
  it('AC8: exposes the documented limits', () => {
    expect(MIN_QUANTITY).toBe(1);
    expect(MAX_QUANTITY).toBe(99);
    expect(MAX_CART_ENTRIES).toBe(100);
    expect(PRODUCT_ID_PATTERN.test('p-1001')).toBe(true);
  });
});

describe('isValidProductId', () => {
  it.each(['p-1001', 'ABC_def-123', 'a', 'x'.repeat(64), 42, 0])(
    'AC8: accepts valid id %p',
    (id) => {
      expect(isValidProductId(id)).toBe(true);
    }
  );

  it.each([
    ['empty string', ''],
    ['too long (65 chars)', 'x'.repeat(65)],
    ['space inside', 'p 1'],
    ['script injection', '<script>alert(1)</script>'],
    ['path traversal', '../etc/passwd'],
    ['sql-ish', "1; DROP TABLE cart"],
    ['null', null],
    ['undefined', undefined],
    ['object', {}],
    ['array', ['p-1']],
    ['boolean', true],
    ['decimal number', 1.5],
  ])('AC8: rejects %s', (_label, id) => {
    expect(isValidProductId(id)).toBe(false);
  });

  it('AC8: documents that NaN/Infinity numbers pass the pattern check', () => {
    // BUG (low): String(NaN) === 'NaN' and String(Infinity) === 'Infinity' match
    // PRODUCT_ID_PATTERN, so non-finite numbers are accepted as product ids.
    expect(isValidProductId(NaN)).toBe(true);
    expect(isValidProductId(Infinity)).toBe(true);
    expect(isValidProductId(-1)).toBe(true); // '-1' also matches the pattern
  });
});

describe('isValidQuantity', () => {
  it.each([1, 2, 50, 98, 99])('AC8: accepts %p', (q) => {
    expect(isValidQuantity(q)).toBe(true);
  });

  it.each([
    ['zero', 0],
    ['negative', -1],
    ['above max', 100],
    ['decimal', 1.5],
    ['numeric string', '1'],
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['null', null],
    ['undefined', undefined],
  ])('AC8: rejects %s', (_label, q) => {
    expect(isValidQuantity(q)).toBe(false);
  });
});

describe('validateCartSchema', () => {
  it('AC6: accepts an empty cart', () => {
    expect(validateCartSchema([])).toBe(true);
  });

  it('AC6: accepts well-formed entries (string and numeric ids)', () => {
    expect(
      validateCartSchema([
        { productId: 'p-1', quantity: 1 },
        { productId: 7, quantity: 99 },
      ])
    ).toBe(true);
  });

  it('AC6: accepts exactly MAX_CART_ENTRIES entries and rejects one more', () => {
    const make = (n) => Array.from({ length: n }, (_, i) => ({ productId: `p${i}`, quantity: 1 }));
    expect(validateCartSchema(make(100))).toBe(true);
    expect(validateCartSchema(make(101))).toBe(false);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['object', { productId: 'p-1', quantity: 1 }],
    ['string', '[]'],
    ['number', 5],
  ])('AC6: rejects non-array %s', (_label, value) => {
    expect(validateCartSchema(value)).toBe(false);
  });

  it.each([
    ['null entry', [null]],
    ['primitive entry', ['p-1']],
    ['bad product id', [{ productId: '<b>', quantity: 1 }]],
    ['missing product id', [{ quantity: 1 }]],
    ['bad quantity', [{ productId: 'p-1', quantity: 0 }]],
    ['missing quantity', [{ productId: 'p-1' }]],
    ['string quantity', [{ productId: 'p-1', quantity: '2' }]],
    ['one bad among good', [{ productId: 'p-1', quantity: 1 }, { productId: 'p-2', quantity: 500 }]],
  ])('AC6: rejects %s', (_label, value) => {
    expect(validateCartSchema(value)).toBe(false);
  });
});

describe('isSafeImageUrl', () => {
  it.each(['http://example.com/a.png', 'https://cdn.example.com/img.jpg?x=1'])(
    'AC1: accepts %s',
    (url) => {
      expect(isSafeImageUrl(url)).toBe(true);
    }
  );

  it.each([
    ['javascript scheme', 'javascript:alert(1)'],
    ['data scheme', 'data:image/png;base64,AAAA'],
    ['ftp scheme', 'ftp://example.com/a.png'],
    ['file scheme', 'file:///etc/passwd'],
    ['relative path', '/images/a.png'],
    ['garbage', 'not a url'],
    ['empty string', ''],
    ['null', null],
    ['undefined', undefined],
    ['number', 5],
  ])('AC1: rejects %s', (_label, url) => {
    expect(isSafeImageUrl(url)).toBe(false);
  });
});
