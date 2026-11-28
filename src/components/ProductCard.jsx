import AddToCartButton from './AddToCartButton';
import { isSafeImageUrl } from '../utils/validators';

export function formatPrice(price) {
  const value = Number(price);
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : '';
}

export function ProductCard({ product }) {
  return (
    <li className="product-card" data-testid={`product-card-${product.id}`}>
      {isSafeImageUrl(product.imageUrl) ? (
        <img className="product-card__image" src={product.imageUrl} alt={product.name} loading="lazy" />
      ) : (
        <div className="product-card__image product-card__image--placeholder" aria-hidden="true" />
      )}
      <h2 className="product-card__name">{product.name}</h2>
      <p className="product-card__price">{formatPrice(product.price)}</p>
      <AddToCartButton product={product} />
    </li>
  );
}

export default ProductCard;
