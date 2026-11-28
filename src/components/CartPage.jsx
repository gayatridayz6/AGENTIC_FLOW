import React from 'react';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { selectCartItems, selectIsCartEmpty, selectCartItemCount } from '../store/cartSlice';
import { removeFromCart, updateQuantity } from '../store/cartSlice';
import CartItemsList from './CartItemsList';
import CartSummary from './CartSummary';
import CartActions from './CartActions';
import EmptyCart from './EmptyCart';

function CartPage({ isOpen = true, onClose = () => {}, onCheckout = () => {}, onContinueShopping = () => {} }) {
  const dispatch = useDispatch();
  const items = useSelector(selectCartItems);
  const isEmpty = useSelector(selectIsCartEmpty);
  const itemCount = useSelector(selectCartItemCount);

  const handleRemoveItem = (itemId) => {
    dispatch(removeFromCart({ itemId }));
  };

  const handleUpdateQuantity = (itemId, quantity) => {
    dispatch(updateQuantity({ itemId, quantity }));
  };

  const handleCheckout = () => {
    if (!isEmpty) {
      onCheckout();
    }
  };

  const handleContinueShopping = () => {
    onContinueShopping();
    if (onClose) onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="cart-page">
      <div className="cart-page__header">
        <h1 className="cart-page__title">Shopping Cart</h1>
        <span className="cart-page__item-count" aria-live="polite">
          {itemCount === 0 ? 'Your cart is empty' : `${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
        </span>
      </div>

      <div className="cart-page__content">
        {isEmpty ? (
          <EmptyCart onContinueShopping={handleContinueShopping} />
        ) : (
          <>
            <CartItemsList
              items={items}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
            />
            <div className="cart-page__footer">
              <CartSummary />
              <CartActions onCheckout={handleCheckout} onContinueShopping={handleContinueShopping} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

CartPage.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  onCheckout: PropTypes.func,
  onContinueShopping: PropTypes.func,
};

export default CartPage;
