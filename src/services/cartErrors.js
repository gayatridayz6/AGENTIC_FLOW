const ERROR_BY_STATUS = {
  400: { code: 'VALIDATION', message: 'Invalid request.' },
  401: { code: 'UNAUTHENTICATED', message: 'Please sign in to continue.' },
  404: { code: 'NOT_FOUND', message: 'Product not found.' },
  409: { code: 'OUT_OF_STOCK', message: 'Sorry, this item is out of stock.' },
  429: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' },
};

const NETWORK_ERROR = { code: 'NETWORK', message: 'Something went wrong. Please try again.' };

export class CartError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'CartError';
    this.status = status;
    this.code = code;
  }
}

export function cartErrorFromStatus(status) {
  const known = ERROR_BY_STATUS[status];
  return known
    ? new CartError(status, known.code, known.message)
    : new CartError(status || 0, NETWORK_ERROR.code, NETWORK_ERROR.message);
}

export const toErrorPayload = (error) => ({
  status: error?.status || 0,
  code: error?.code || NETWORK_ERROR.code,
  message: error?.message || NETWORK_ERROR.message,
});
