import CartService from '../CartService';

// Mock fetch API
global.fetch = jest.fn();

describe('CartService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Guest User - LocalStorage', () => {
    // Test 1: Add item to cart (guest)
    test('addToCart saves item to localStorage for guest user', () => {
      const result = CartService.addToCart('product-123', 1);

      expect(result.success).toBe(true);
      expect(result.itemCount).toBe(1);

      const savedCart = JSON.parse(localStorage.getItem('cart'));
      expect(savedCart.items).toHaveLength(1);
      expect(savedCart.items[0].productId).toBe('product-123');
      expect(savedCart.items[0].quantity).toBe(1);
    });

    // Test 2: Add multiple items to cart (guest)
    test('addToCart increments quantity for duplicate product', () => {
      CartService.addToCart('product-123', 1);
      const result = CartService.addToCart('product-123', 2);

      expect(result.itemCount).toBe(3); // 1 + 2
      expect(result.items[0].quantity).toBe(3);
    });

    // Test 3: Get cart from localStorage
    test('getCart returns cart from localStorage for guest', () => {
      CartService.addToCart('product-123', 1);
      const cart = CartService.getCart();

      expect(cart.items).toHaveLength(1);
      expect(cart.itemCount).toBe(1);
    });
  });

  describe('Authenticated User - Backend API', () => {
    beforeEach(() => {
      // Set auth token to simulate authenticated user
      localStorage.setItem('authToken', 'test-token-123');
    });

    // Test 4: Add item to cart (authenticated)
    test('addToCart calls backend API for authenticated user', async () => {
      const mockResponse = {
        success: true,
        itemCount: 1,
        items: [{ productId: 'product-123', quantity: 1 }]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await CartService.addToCart('product-123', 1);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/cart/add'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': expect.stringContaining('Bearer test-token-123')
          })
        })
      );

      expect(result.success).toBe(true);
      expect(result.itemCount).toBe(1);
    });

    // Test 5: API error handling
    test('addToCart throws error on API failure', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request'
      });

      await expect(CartService.addToCart('product-123', 1))
        .rejects
        .toThrow('API error: 400 Bad Request');
    });

    // Test 6: Network error handling
    test('addToCart handles network errors', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(CartService.addToCart('product-123', 1))
        .rejects
        .toThrow('Network error');
    });
  });

  describe('LocalStorage Edge Cases', () => {
    // Test 7: Handle corrupted localStorage data
    test('getLocalCart handles corrupted JSON gracefully', () => {
      localStorage.setItem('cart', 'invalid json');

      const cart = CartService.getLocalCart();

      expect(cart.items).toEqual([]);
      expect(cart.itemCount).toBe(0);
    });

    // Test 8: Handle missing localStorage key
    test('getLocalCart returns empty cart when key does not exist', () => {
      const cart = CartService.getLocalCart();

      expect(cart.items).toEqual([]);
      expect(cart.itemCount).toBe(0);
    });
  });

  describe('Authentication Token', () => {
    // Test 9: isUserAuthenticated returns true when token exists
    test('isUserAuthenticated returns true when auth token is present', () => {
      localStorage.setItem('authToken', 'test-token');

      const isAuth = CartService.isUserAuthenticated();
      expect(isAuth).toBe(true);
    });

    // Test 10: isUserAuthenticated returns false when no token
    test('isUserAuthenticated returns false when no auth token', () => {
      const isAuth = CartService.isUserAuthenticated();
      expect(isAuth).toBe(false);
    });
  });
});
