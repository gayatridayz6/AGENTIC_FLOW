import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import Header from './components/Header';
import ProductList from './components/ProductList';
import { hydrateGuestCart } from './store/cartSlice';
import { loadGuestCart } from './services/cartStorage';

export function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(hydrateGuestCart(loadGuestCart()));
  }, [dispatch]);

  return (
    <>
      <Header />
      <main className="page">
        <h1 className="page__title">Products</h1>
        <ProductList />
      </main>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}

export default App;
