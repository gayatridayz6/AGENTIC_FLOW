import React from 'react';
import PropTypes from 'prop-types';

function CartActions({ onCheckout = () => {}, onContinueShopping = () => {} }) {
  return (
    <div className="cart-actions">
      <button
        className="cart-actions__btn cart-actions__btn--checkout"
        onClick={() => onCheckout()}
        aria-label="Proceed to checkout"
      >
        Proceed to Checkout
      </button>
      <button
        className="cart-actions__btn cart-actions__btn--continue"
        onClick={() => onContinueShopping()}
        aria-label="Continue shopping"
      >
        Continue Shopping
      </button>
    </div>
  );
}

CartActions.propTypes = {
  onCheckout: PropTypes.func,
  onContinueShopping: PropTypes.func,
};

export default CartActions;
