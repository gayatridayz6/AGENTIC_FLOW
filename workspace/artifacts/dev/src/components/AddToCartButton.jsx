import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { addToCart, resetAddStatus, selectAddStatus } from '../store/cartSlice';
import { GENERIC_ERROR_MESSAGE } from '../services/cartService';

export const ADDED_DURATION_MS = 2000;
export const SUCCESS_MESSAGE = 'Item added to cart!';

// Pure helper: maps (inStock, status) to the UI state described in design.json button_states.
export function getButtonState(inStock, status) {
  if (!inStock || status === 'out_of_stock') {
    return { key: 'out_of_stock', label: 'Out of Stock', disabled: true };
  }
  switch (status) {
    case 'adding':
      return { key: 'adding', label: 'Adding...', disabled: true };
    case 'added':
      return { key: 'added', label: 'Added ✓', disabled: true };
    case 'error':
      return { key: 'error', label: 'Try again', disabled: false };
    default:
      return { key: 'idle', label: 'Add to Cart', disabled: false };
  }
}

export function AddToCartButton({ product }) {
  const dispatch = useDispatch();
  const status = useSelector(selectAddStatus(product.id));
  const { key, label, disabled } = getButtonState(product.inStock, status);

  useEffect(() => {
    if (status !== 'added') return undefined;
    const timer = setTimeout(() => dispatch(resetAddStatus(product.id)), ADDED_DURATION_MS);
    return () => clearTimeout(timer);
  }, [status, product.id, dispatch]);

  const handleClick = async () => {
    if (disabled) return;
    const result = await dispatch(addToCart({ productId: product.id, quantity: 1 }));
    if (addToCart.fulfilled.match(result)) {
      toast.success(SUCCESS_MESSAGE);
    } else if (!(result.payload && result.payload.code === 'OUT_OF_STOCK')) {
      toast.error(GENERIC_ERROR_MESSAGE);
    }
  };

  return (
    <>
      <button
        type="button"
        className={`add-to-cart-btn add-to-cart-btn--${key}`}
        disabled={disabled}
        aria-disabled={disabled}
        aria-busy={key === 'adding'}
        aria-label={`${label}: ${product.name}`}
        onClick={handleClick}
      >
        {label}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {key === 'added' ? SUCCESS_MESSAGE : ''}
      </span>
    </>
  );
}

export default AddToCartButton;
