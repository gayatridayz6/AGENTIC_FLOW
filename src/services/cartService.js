import axios from 'axios';
import { isValidProductId, isValidQuantity } from '../utils/validators';

export const ADD_TO_CART_PATH = '/api/cart/add';
export const REQUEST_TIMEOUT_MS = 10000;
export const GENERIC_ERROR_MESSAGE = 'Could not add item. Please try again.';

export const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '',
  withCredentials: true,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { 'Content-Type': 'application/json' },
});

// Error carrying only a safe, user-facing message (never server text or stack).
export class CartError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = 'CartError';
    this.code = code;
    this.status = status;
  }
}

export function mapError(error) {
  const status = error && error.response ? error.response.status : undefined;
  if (status === 401) {
    return new CartError('UNAUTHENTICATED', 'Your session has expired. Please sign in again.', status);
  }
  if (status === 409) {
    return new CartError('OUT_OF_STOCK', 'This item is out of stock.', status);
  }
  if (status === 400) {
    return new CartError('INVALID_INPUT', GENERIC_ERROR_MESSAGE, status);
  }
  return new CartError('SERVER_ERROR', GENERIC_ERROR_MESSAGE, status);
}

// POST /api/cart/add -> { items, count }
export async function addItem(productId, quantity = 1) {
  if (!isValidProductId(productId) || !isValidQuantity(quantity)) {
    throw new CartError('INVALID_INPUT', GENERIC_ERROR_MESSAGE);
  }
  try {
    const response = await apiClient.post(ADD_TO_CART_PATH, { productId, quantity });
    return response.data;
  } catch (error) {
    throw mapError(error);
  }
}

export default { addItem };
