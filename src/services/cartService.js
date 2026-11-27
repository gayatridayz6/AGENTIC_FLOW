import axios from 'axios';
import { cartErrorFromStatus, CartError } from './cartErrors';
import { sanitizeItems, validateAddToCartRequest, countItems } from './cartDto';

const REQUEST_TIMEOUT_MS = 10000;

const apiUrl = (path) => `${process.env.REACT_APP_API_BASE_URL || ''}${path}`;

function authConfig(token) {
  if (!token) throw cartErrorFromStatus(401);
  return { headers: { Authorization: `Bearer ${token}` }, timeout: REQUEST_TIMEOUT_MS };
}

function normalizeCart(data) {
  const items = sanitizeItems(data?.items);
  const totalCount = Number.isInteger(data?.totalCount) && data.totalCount >= 0 ? data.totalCount : countItems(items);
  return { items, totalCount, message: typeof data?.message === 'string' ? data.message : '' };
}

async function request(call) {
  try {
    const response = await call();
    return normalizeCart(response?.data);
  } catch (error) {
    if (error instanceof CartError) throw error;
    throw cartErrorFromStatus(error?.response?.status);
  }
}

export async function addToCart(token, payload) {
  const checked = validateAddToCartRequest(payload);
  if (!checked.ok) throw cartErrorFromStatus(400);
  const config = authConfig(token);
  return request(() => axios.post(apiUrl('/api/cart/add'), checked.value, config));
}

export async function getCart(token) {
  const config = authConfig(token);
  return request(() => axios.get(apiUrl('/api/cart'), config));
}

export default { addToCart, getCart };
