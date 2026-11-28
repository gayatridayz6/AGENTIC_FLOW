import React from 'react';
import { useSelector } from 'react-redux';
import { selectCartSummary } from '../store/cartSlice';

function CartSummary() {
  const { subtotal, tax, total } = useSelector(selectCartSummary);

  const formatPrice = (price) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  return (
    <div className="cart-summary" role="region" aria-label="Cart summary">
      <div className="cart-summary__row">
        <span className="cart-summary__label">Subtotal:</span>
        <span className="cart-summary__value">{formatPrice(subtotal)}</span>
      </div>

      <div className="cart-summary__row">
        <span className="cart-summary__label">Tax:</span>
        <span className="cart-summary__value">{formatPrice(tax)}</span>
      </div>

      <div className="cart-summary__row cart-summary__row--total">
        <span className="cart-summary__label cart-summary__label--bold">Total:</span>
        <span className="cart-summary__value cart-summary__value--bold">{formatPrice(total)}</span>
      </div>
    </div>
  );
}

export default CartSummary;
