import React from 'react';
import PropTypes from 'prop-types';

function EmptyCart({ onContinueShopping = () => {} }) {
  return (
    <div className="empty-cart">
      <div className="empty-cart__illustration">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="60" cy="60" r="58" stroke="#FFD93D" strokeWidth="4" fill="#FFF9E6" />
          <path
            d="M32 50h56l-8 40H40l-8-40Z"
            fill="#FF6B9D"
            stroke="#FF6B9D"
            strokeWidth="2"
          />
          <circle cx="45" cy="95" r="6" fill="#FF6B9D" />
          <circle cx="80" cy="95" r="6" fill="#FF6B9D" />
          <path d="M50 50V40c0-4 2-6 6-6h8c4 0 6 2 6 6v10" stroke="#FF6B9D" strokeWidth="2" />
        </svg>
      </div>

      <div className="empty-cart__content">
        <h2 className="empty-cart__title">Your Cart is Empty</h2>
        <p className="empty-cart__message">
          Looks like you haven't added any items yet! Start shopping to fill your cart with awesome products.
        </p>
      </div>

      <button
        className="empty-cart__btn"
        onClick={() => onContinueShopping()}
        aria-label="Continue shopping"
      >
        Continue Shopping
      </button>
    </div>
  );
}

EmptyCart.propTypes = {
  onContinueShopping: PropTypes.func,
};

export default EmptyCart;
