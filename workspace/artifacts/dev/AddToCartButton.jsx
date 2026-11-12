import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import CartService from '../services/CartService';
import { updateCart } from '../store/cartSlice';
import Toast from './Toast';
import './AddToCartButton.css';

/**
 * AddToCartButton Component
 * Displays a button to add a product to the shopping cart
 * Handles different states: default, loading, success, outOfStock
 */
const AddToCartButton = ({ product, onSuccess }) => {
  const [state, setState] = useState('default'); // default, loading, success, outOfStock
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const dispatch = useDispatch();
  const isAuthenticated = useSelector(state => state.auth?.isAuthenticated);

  const handleAddToCart = async () => {
    // Check if product is out of stock
    if (!product.inStock) {
      setState('outOfStock');
      return;
    }

    setState('loading');

    try {
      // Call API to add item to cart
      const response = await CartService.addToCart(product.id, 1);

      if (response.success) {
        // Update Redux store with new cart count
        dispatch(updateCart({
          itemCount: response.itemCount,
          items: response.items
        }));

        // Show success state and toast
        setState('success');
        setToastMessage('Item added to cart!');
        setShowToast(true);

        // Revert button state after 2 seconds
        setTimeout(() => {
          setState('default');
          setShowToast(false);
        }, 2000);

        // Call parent callback if provided
        if (onSuccess) onSuccess(response);
      } else {
        setState('default');
        setToastMessage('Failed to add item');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      setState('default');
      setToastMessage('Error: ' + error.message);
      setShowToast(true);
    }
  };

  // Determine button text and styling based on state
  let buttonText = 'Add to Cart';
  let buttonClass = 'btn-add-to-cart';
  let isDisabled = false;

  if (state === 'loading') {
    buttonText = 'Adding...';
    buttonClass = 'btn-add-to-cart loading';
    isDisabled = true;
  } else if (state === 'success') {
    buttonText = 'Added ✓';
    buttonClass = 'btn-add-to-cart success';
    isDisabled = true;
  } else if (state === 'outOfStock' || !product.inStock) {
    buttonText = 'Out of Stock';
    buttonClass = 'btn-add-to-cart out-of-stock';
    isDisabled = true;
  }

  return (
    <>
      <button
        className={buttonClass}
        onClick={handleAddToCart}
        disabled={isDisabled}
        aria-label={`Add ${product.name} to cart`}
        aria-disabled={isDisabled}
      >
        {buttonText}
      </button>

      {showToast && (
        <Toast
          message={toastMessage}
          type={state === 'success' ? 'success' : 'error'}
          duration={2000}
        />
      )}
    </>
  );
};

export default AddToCartButton;
