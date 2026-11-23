import { useSelector } from 'react-redux';
import { selectCartCount } from '../store/cartSlice';

export function CartIcon() {
  const count = useSelector(selectCartCount);
  return (
    <div className="cart-icon" role="group" aria-label="Shopping cart">
      <svg className="cart-icon__svg" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          fill="currentColor"
          d="M7 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm10 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM1 2v2h2l3.6 7.6-1.4 2.4A2 2 0 0 0 7 17h12v-2H7.4l1.1-2h7.5a2 2 0 0 0 1.7-1l3.6-6.5A1 1 0 0 0 20.4 4H5.2l-.9-2H1z"
        />
      </svg>
      <span className="cart-icon__badge" role="status" aria-live="polite" aria-atomic="true" data-testid="cart-count">
        {count}
      </span>
      <span className="sr-only">{count === 1 ? 'item in cart' : 'items in cart'}</span>
    </div>
  );
}

export default CartIcon;
