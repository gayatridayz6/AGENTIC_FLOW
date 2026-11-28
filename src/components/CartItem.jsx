import React from 'react';
import PropTypes from 'prop-types';

function CartItem({ item, onUpdateQuantity = () => {}, onRemoveItem = () => {} }) {
  const { id, productName, variant, unitPrice, quantity, imageUrl, subtotal } = item;

  const handleIncrementQuantity = () => {
    onUpdateQuantity(id, quantity + 1);
  };

  const handleDecrementQuantity = () => {
    if (quantity > 1) {
      onUpdateQuantity(id, quantity - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (!Number.isNaN(newQuantity) && newQuantity > 0) {
      onUpdateQuantity(id, newQuantity);
    }
  };

  const handleRemove = () => {
    onRemoveItem(id);
  };

  const formatPrice = (price) => {
    return `$${(price / 100).toFixed(2)}`;
  };

  const variantText = variant && (variant.size || variant.color)
    ? `${variant.size || ''} ${variant.color || ''}`.trim()
    : '';

  return (
    <article className="cart-item" role="region" aria-label={`${productName} in cart`}>
      <div className="cart-item__image-wrapper">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={productName}
            className="cart-item__image"
            loading="lazy"
            onError={(e) => {
              e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2214%22 fill=%22%23999%22%3ENo Image%3C/text%3E%3C/svg%3E';
            }}
          />
        ) : (
          <div className="cart-item__placeholder">No Image</div>
        )}
      </div>

      <div className="cart-item__details">
        <h3 className="cart-item__name">{productName}</h3>
        {variantText && (
          <p className="cart-item__variant">{variantText}</p>
        )}
        <p className="cart-item__price">{formatPrice(unitPrice)}</p>
      </div>

      <div className="cart-item__quantity-control">
        <button
          className="cart-item__btn cart-item__btn--decrement"
          onClick={handleDecrementQuantity}
          disabled={quantity <= 1}
          aria-label={`Decrease ${productName} quantity`}
          title="Decrease quantity"
        >
          −
        </button>
        <input
          type="number"
          min="1"
          max="999"
          value={quantity}
          onChange={handleQuantityChange}
          className="cart-item__quantity-input"
          aria-label={`${productName} quantity`}
        />
        <button
          className="cart-item__btn cart-item__btn--increment"
          onClick={handleIncrementQuantity}
          aria-label={`Increase ${productName} quantity`}
          title="Increase quantity"
        >
          +
        </button>
      </div>

      <div className="cart-item__subtotal">
        <span className="cart-item__subtotal-label">Subtotal:</span>
        <span className="cart-item__subtotal-value">{formatPrice(subtotal)}</span>
      </div>

      <button
        className="cart-item__remove-btn"
        onClick={handleRemove}
        aria-label={`Remove ${productName} from cart`}
        title="Remove item"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2M8 6l1 14a1 1 0 001 1h4a1 1 0 001-1l1-14M10 10v8M14 10v8" />
        </svg>
        <span className="sr-only">Remove</span>
      </button>
    </article>
  );
}

CartItem.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.string.isRequired,
    productId: PropTypes.string.isRequired,
    productName: PropTypes.string.isRequired,
    variant: PropTypes.shape({
      size: PropTypes.string,
      color: PropTypes.string,
    }),
    unitPrice: PropTypes.number.isRequired,
    quantity: PropTypes.number.isRequired,
    imageUrl: PropTypes.string,
    subtotal: PropTypes.number.isRequired,
  }).isRequired,
  onUpdateQuantity: PropTypes.func,
  onRemoveItem: PropTypes.func,
};

export default CartItem;
