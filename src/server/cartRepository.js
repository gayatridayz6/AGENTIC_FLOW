import { MAX_LINE_ITEMS, MAX_QUANTITY } from '../services/cartDto';

export function createCartRepository() {
  const carts = new Map();

  const linesFor = (userId) => {
    if (!carts.has(userId)) carts.set(userId, new Map());
    return carts.get(userId);
  };

  return {
    getItems(userId) {
      return Array.from(linesFor(userId), ([productId, quantity]) => ({ productId, quantity }));
    },
    getQuantity(userId, productId) {
      return linesFor(userId).get(productId) || 0;
    },
    upsertQuantity(userId, productId, quantity) {
      const lines = linesFor(userId);
      if (quantity < 1 || quantity > MAX_QUANTITY) throw new RangeError('quantity out of range');
      if (!lines.has(productId) && lines.size >= MAX_LINE_ITEMS) throw new RangeError('cart is full');
      lines.set(productId, quantity);
      return this.getItems(userId);
    },
  };
}

export default createCartRepository;
