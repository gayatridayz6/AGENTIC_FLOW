import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import axios from 'axios';
import ProductList from '../components/ProductList';
import { products } from '../data/products';
import { createAppStore } from '../store';
import { GUEST_CART_KEY } from '../services/guestCartStorage';

jest.mock('axios', () => ({ __esModule: true, default: { post: jest.fn(), get: jest.fn() } }));
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
  ToastContainer: () => null,
}));

const renderList = (list, store = createAppStore()) => {
  render(
    <Provider store={store}>
      <ProductList products={list} />
    </Provider>
  );
  return store;
};

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
});

describe('AC1 - Add to Cart button visibility', () => {
  it('shouldRenderAddToCartButtonOnEveryProductCardWhenListLoads', () => {
    renderList(products);
    const cards = screen.getAllByTestId(/^product-card-/);
    expect(cards).toHaveLength(products.length);
    cards.forEach((card, index) => {
      const button = within(card).getByRole('button');
      // Out-of-stock products still show a button (labeled Out of Stock) - see AC3.
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent(products[index].inStock ? 'Add to Cart' : 'Out of Stock');
    });
  });

  it.each([
    ['no image and no price', { id: 'p-x1', name: 'Bare Item', stock: 5, inStock: true }],
    ['image present', { id: 'p-x2', name: 'Pic Item', price: 9.5, imageUrl: 'http://img/x.png', stock: 5 }],
    ['stock fields missing', { id: 'p-x3', name: 'Unknown Stock', price: 1 }],
  ])('shouldRenderEnabledAddToCartButtonWhenProductHas %s', (_label, product) => {
    renderList([product]);
    expect(screen.getByRole('button', { name: 'Add to Cart' })).toBeEnabled();
  });

  it('shouldRenderNoButtonsWhenProductListIsEmpty', () => {
    renderList([]);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

describe('AC3 - Inventory handling', () => {
  it.each([
    ['inStock false', { id: 'p-o1', name: 'Gone A', inStock: false }],
    ['stock zero', { id: 'p-o2', name: 'Gone B', stock: 0 }],
    ['negative stock', { id: 'p-o3', name: 'Gone C', stock: -2 }],
  ])('shouldDisableButtonAndLabelOutOfStockWhen %s', (_label, product) => {
    renderList([product]);
    const button = screen.getByRole('button', { name: `${product.name} is out of stock` });
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Out of Stock');
  });

  it('shouldDoNothingWhenOutOfStockButtonIsClicked', async () => {
    const store = renderList(products);
    const soldOut = products.find((p) => p.inStock === false);
    const button = within(screen.getByTestId(`product-card-${soldOut.id}`)).getByRole('button');

    await userEvent.setup().click(button);

    expect(axios.post).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(GUEST_CART_KEY)).toBeNull();
    expect(store.getState().cart.count).toBe(0);
    expect(store.getState().cart.status).toBe('idle');
  });
});
