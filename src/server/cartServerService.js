import { MAX_QUANTITY, countItems } from '../services/cartDto';

export class CartServiceError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function createCartServerService({ repository, findProduct }) {
  const summary = (userId, message = '') => {
    const items = repository.getItems(userId);
    return { items, totalCount: countItems(items), message };
  };

  return {
    addItem(userId, { productId, quantity }) {
      const product = findProduct(productId);
      if (!product) throw new CartServiceError(404, 'NOT_FOUND', 'Product not found.');
      const current = repository.getQuantity(userId, productId);
      const next = current + quantity;
      const available = typeof product.stock === 'number' ? product.stock : Infinity;
      if (product.inStock === false || available <= 0 || next > available || next > MAX_QUANTITY) {
        throw new CartServiceError(409, 'OUT_OF_STOCK', 'Item is out of stock or exceeds available quantity.');
      }
      repository.upsertQuantity(userId, productId, next);
      return summary(userId, 'Item added to cart!');
    },
    getCart(userId) {
      return summary(userId);
    },
  };
}

export default createCartServerService;
