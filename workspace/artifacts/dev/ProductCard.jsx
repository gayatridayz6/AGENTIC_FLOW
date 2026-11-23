import React from 'react';
import AddToCartButton from './AddToCartButton';
import './ProductCard.css';

/**
 * ProductCard Component
 * Displays a product card with image, title, price, and Add to Cart button
 */
const ProductCard = ({ product, onAddToCart }) => {
  return (
    <div className="product-card">
      <div className="product-image">
        <img
          src={product.imageUrl}
          alt={product.name}
          loading="lazy"
        />
      </div>

      <div className="product-info">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-description">{product.description}</p>

        <div className="product-footer">
          <div className="product-price">
            ${product.price.toFixed(2)}
          </div>

          <AddToCartButton
            product={product}
            onSuccess={onAddToCart}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
