import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import CartBadge from './components/CartBadge';
import ProductList from './components/ProductList';
import { products as defaultProducts } from './data/products';
import { selectIsLoggedIn } from './store/authSlice';
import { hydrateCart, syncGuestCartOnLogin } from './store/cartSlice';

export default function App({ products = defaultProducts }) {
  const dispatch = useDispatch();
  const loggedIn = useSelector(selectIsLoggedIn);

  useEffect(() => {
    dispatch(loggedIn ? syncGuestCartOnLogin() : hydrateCart());
  }, [dispatch, loggedIn]);

  return (
    <>
      <header className="app-header">
        <h1>Shop</h1>
        <CartBadge />
      </header>
      <main>
        <ProductList products={products} />
      </main>
      <ToastContainer position="top-right" autoClose={2000} />
    </>
  );
}
