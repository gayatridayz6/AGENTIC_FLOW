import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { addToCart } from '../store/cartSlice';

export const ADDED_RESET_MS = 2000;
export const LABELS = {
  idle: 'Add to Cart',
  adding: 'Adding...',
  added: 'Added ✓',
  soldOut: 'Out of Stock',
};
export const SUCCESS_MESSAGE = 'Item added to cart!';

export const isProductAvailable = (product) =>
  Boolean(product) && product.inStock !== false && !(typeof product.stock === 'number' && product.stock <= 0);

export default function AddToCartButton({ product }) {
  const dispatch = useDispatch();
  const [phase, setPhase] = useState('idle');
  const [soldOut, setSoldOut] = useState(false);
  const timer = useRef(null);
  const pending = useRef(false);

  useEffect(() => () => clearTimeout(timer.current), []);

  const unavailable = soldOut || !isProductAvailable(product);

  const handleClick = async () => {
    if (unavailable || pending.current) return;
    pending.current = true;
    setPhase('adding');
    const result = await dispatch(addToCart({ productId: product.id, quantity: 1 }));
    pending.current = false;
    if (addToCart.fulfilled.match(result)) {
      setPhase('added');
      toast.success(SUCCESS_MESSAGE, { role: 'status', toastId: `added-${product.id}` });
      timer.current = setTimeout(() => setPhase('idle'), ADDED_RESET_MS);
      return;
    }
    setPhase('idle');
    const error = result.payload;
    if (error?.status === 409) setSoldOut(true);
    toast.error(error?.message || 'Something went wrong. Please try again.', { role: 'alert' });
  };

  const label = unavailable ? LABELS.soldOut : LABELS[phase];
  const className = `add-to-cart-btn${phase === 'added' ? ' add-to-cart-btn--added' : ''}`;

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      disabled={unavailable || phase === 'adding'}
      aria-label={unavailable ? `${product?.name ?? 'Product'} is out of stock` : undefined}
    >
      {label}
    </button>
  );
}
