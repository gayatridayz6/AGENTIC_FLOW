import React, { useState } from 'react';
import { Provider } from 'react-redux';
import store from './store';
import ProductCard from './components/ProductCard';
import './App.css';

/**
 * Main App Component
 * Displays product listing with Add to Cart functionality
 */
function App() {
  // Sample product data
  const [products] = useState([
    {
      id: '1',
      name: 'Wireless Headphones',
      description: 'High-quality wireless headphones with noise cancellation',
      price: 99.99,
      imageUrl: 'https://via.placeholder.com/200?text=Headphones',
      inStock: true
    },
    {
      id: '2',
      name: 'USB-C Cable',
      description: 'Durable USB-C charging cable, 6ft',
      price: 12.99,
      imageUrl: 'https://via.placeholder.com/200?text=USB+Cable',
      inStock: true
    },
    {
      id: '3',
      name: 'Phone Case',
      description: 'Protective phone case with premium material',
      price: 24.99,
      imageUrl: 'https://via.placeholder.com/200?text=Phone+Case',
      inStock: false
    },
    {
      id: '4',
      name: 'Screen Protector',
      description: 'Tempered glass screen protector',
      price: 9.99,
      imageUrl: 'https://via.placeholder.com/200?text=Screen+Protector',
      inStock: true
    },
    {
      id: '5',
      name: 'Portable Charger',
      description: '20000mAh portable power bank',
      price: 34.99,
      imageUrl: 'https://via.placeholder.com/200?text=Power+Bank',
      inStock: true
    },
    {
      id: '6',
      name: 'Screen Stand',
      description: 'Adjustable laptop/tablet stand',
      price: 19.99,
      imageUrl: 'https://via.placeholder.com/200?text=Stand',
      inStock: true
    }
  ]);

  const handleAddToCart = (cartItem) => {
    console.log('Item added to cart:', cartItem);
  };

  return (
    <Provider store={store}>
      <div className="app">
        <header className="app-header">
          <h1>Shopping Store</h1>
          <div className="header-right">
            <span className="cart-icon">🛒</span>
            <span className="cart-count" data-testid="cart-counter">0</span>
          </div>
        </header>

        <main className="app-main">
          <section className="products-section">
            <h2>Available Products</h2>
            <div className="products-grid">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                />
              ))}
            </div>
          </section>
        </main>

        <footer className="app-footer">
          <p>&copy; 2026 Shopping Store. All rights reserved.</p>
        </footer>
      </div>
    </Provider>
  );
}

export default App;
