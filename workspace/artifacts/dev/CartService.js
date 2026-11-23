/**
 * CartService
 * Handles all cart-related API calls and localStorage operations
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

class CartService {
  /**
   * Add item to cart
   * @param {string} productId - Product ID
   * @param {number} quantity - Quantity to add (default: 1)
   * @returns {Promise} Response with success status and updated cart info
   */
  static async addToCart(productId, quantity = 1) {
    try {
      const isAuthenticated = this.isUserAuthenticated();

      if (isAuthenticated) {
        // Logged-in user: call backend API
        return await this.addToCartBackend(productId, quantity);
      } else {
        // Guest user: save to localStorage
        return this.addToCartLocalStorage(productId, quantity);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  }

  /**
   * Add item to cart via backend API
   * @private
   */
  static async addToCartBackend(productId, quantity) {
    const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({
        productId,
        quantity
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  /**
   * Add item to cart via localStorage (guest user)
   * @private
   */
  static addToCartLocalStorage(productId, quantity) {
    try {
      // Get existing cart from localStorage
      let cart = this.getLocalCart();

      // Find existing item or add new one
      const existingItem = cart.items.find(item => item.productId === productId);

      if (existingItem) {
        existingItem.quantity += quantity;
      } else {
        cart.items.push({ productId, quantity });
      }

      // Update cart count
      cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

      // Save back to localStorage
      localStorage.setItem('cart', JSON.stringify(cart));

      return {
        success: true,
        message: 'Item added to cart',
        items: cart.items,
        itemCount: cart.itemCount
      };
    } catch (error) {
      console.error('LocalStorage error:', error);
      throw new Error('Failed to save cart to local storage');
    }
  }

  /**
   * Get cart from localStorage
   * @private
   */
  static getLocalCart() {
    try {
      const cartData = localStorage.getItem('cart');
      return cartData ? JSON.parse(cartData) : { items: [], itemCount: 0 };
    } catch (error) {
      console.error('Error reading cart from localStorage:', error);
      return { items: [], itemCount: 0 };
    }
  }

  /**
   * Get cart items (for both authenticated and guest users)
   */
  static async getCart() {
    const isAuthenticated = this.isUserAuthenticated();

    if (isAuthenticated) {
      const response = await fetch(`${API_BASE_URL}/api/cart`, {
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`
        }
      });
      return await response.json();
    } else {
      return this.getLocalCart();
    }
  }

  /**
   * Check if user is authenticated
   * @private
   */
  static isUserAuthenticated() {
    return !!this.getAuthToken();
  }

  /**
   * Get authentication token from localStorage or session
   * @private
   */
  static getAuthToken() {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }
}

export default CartService;
