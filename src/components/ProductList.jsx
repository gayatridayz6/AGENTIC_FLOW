import ProductCard from './ProductCard';
import productsData from '../data/products';

export function ProductList({ products = productsData }) {
  return (
    <ul className="product-list" aria-label="Product listing">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ul>
  );
}

export default ProductList;
