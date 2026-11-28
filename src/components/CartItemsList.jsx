import React from 'react';
import PropTypes from 'prop-types';
import CartItem from './CartItem';

function CartItemsList({ items = [], onUpdateQuantity = () => {}, onRemoveItem = () => {} }) {
  return (
    <div className="cart-items-list" role="region" aria-label="Cart items">
      <div className="cart-items-list__items">
        {items.length === 0 ? (
          <p className="cart-items-list__empty-message">No items in your cart</p>
        ) : (
          items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={onUpdateQuantity}
              onRemoveItem={onRemoveItem}
            />
          ))
        )}
      </div>
    </div>
  );
}

CartItemsList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
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
    })
  ),
  onUpdateQuantity: PropTypes.func,
  onRemoveItem: PropTypes.func,
};

export default CartItemsList;
