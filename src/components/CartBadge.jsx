import { useSelector } from 'react-redux';
import { selectCartCount } from '../store/cartSlice';

export const MAX_DISPLAY_COUNT = 99;

export default function CartBadge() {
  const count = useSelector(selectCartCount);
  const display = count > MAX_DISPLAY_COUNT ? `${MAX_DISPLAY_COUNT}+` : String(count);

  return (
    <div className="cart-badge" aria-label={`Cart with ${count} items`}>
      <span aria-hidden="true">Cart</span>
      <span className="cart-badge__count" data-testid="cart-count">
        {display}
      </span>
    </div>
  );
}
