import AddToCartButton from './AddToCartButton';

const formatPrice = (price) => (typeof price === 'number' ? `$${price.toFixed(2)}` : '');

export default function ProductCard({ product }) {
  return (
    <li className="product-card" data-testid={`product-card-${product.id}`}>
      {product.imageUrl ? <img className="product-card__image" src={product.imageUrl} alt={product.name} /> : null}
      <h3 className="product-card__name">{product.name}</h3>
      <p className="product-card__price">{formatPrice(product.price)}</p>
      <AddToCartButton product={product} />
    </li>
  );
}
