import CartService from '../services/CartService';

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Guest User - LocalStorage', () => {
    test('addToCart saves item to localStorage for guest user', () => {
      const result = CartService.addToCartLocalStorage('product-123', 1);

      expect(result.success).toBe(true);
      expect(result.itemCount).toBe(1);

      const savedCart = JSON.parse(localStorage.getItem('cart'));
      expect(savedCart.items).toHaveLength(1);
      expect(savedCart.items[0].productId).toBe('product-123');
      expect(savedCart.items[0].quantity).toBe(1);
    });

    test('addToCart increments quantity for duplicate product', () => {
      CartService.addToCartLocalStorage('product-123', 1);
      const result = CartService.addToCartLocalStorage('product-123', 2);

      expect(result.itemCount).toBe(3);
      expect(result.items[0].quantity).toBe(3);
    });

    test('getLocalCart returns cart from localStorage', () => {
      CartService.addToCartLocalStorage('product-123', 1);
      const cart = CartService.getLocalCart();

      expect(cart.items).toHaveLength(1);
      expect(cart.itemCount).toBe(1);
    });
  });

  describe('LocalStorage Edge Cases', () => {
    test('getLocalCart handles corrupted JSON gracefully', () => {
      localStorage.setItem('cart', 'invalid json');

      const cart = CartService.getLocalCart();

      expect(cart.items).toEqual([]);
      expect(cart.itemCount).toBe(0);
    });

    test('getLocalCart returns empty cart when key does not exist', () => {
      const cart = CartService.getLocalCart();

      expect(cart.items).toEqual([]);
      expect(cart.itemCount).toBe(0);
    });
  });

  describe('Authentication Token', () => {
    test('isUserAuthenticated returns true when auth token is present', () => {
      localStorage.setItem('authToken', 'test-token');

      const isAuth = CartService.isUserAuthenticated();
      expect(isAuth).toBe(true);
    });

    test('isUserAuthenticated returns false when no auth token', () => {
      const isAuth = CartService.isUserAuthenticated();
      expect(isAuth).toBe(false);
    });
  });

  test('clearCart removes cart from localStorage', () => {
    CartService.addToCartLocalStorage('product-123', 1);
    expect(localStorage.getItem('cart')).not.toBeNull();

    CartService.clearCart();
    expect(localStorage.getItem('cart')).toBeNull();
  });
});
