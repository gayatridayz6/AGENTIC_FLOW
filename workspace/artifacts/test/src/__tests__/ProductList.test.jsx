import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import ProductList from '../components/ProductList';
import products from '../data/products';
import { createAppStore } from '../store';

jest.mock('axios', () => {
  const post = jest.fn();
  return { __esModule: true, default: { create: jest.fn(() => ({ post })), post } };
});
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
  ToastContainer: () => null,
}));

function renderList(props) {
  return render(
    <Provider store={createAppStore()}>
      <ProductList {...props} />
    </Provider>
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('AC-1 Button visibility on every product card', () => {
  it('shouldRenderAddToCartButtonOnEveryProductCardWhenCatalogLoaded', () => {
    renderList();
    const cards = screen.getAllByTestId(/^product-card-/);
    expect(cards).toHaveLength(products.length);
    cards.forEach((card) => {
      expect(within(card).getByRole('button')).toHaveTextContent(/Add to Cart|Out of Stock/);
    });
  });

  it('shouldRenderNoCardsOrButtonsWhenProductListIsEmpty', () => {
    renderList({ products: [] });
    expect(screen.getByRole('list', { name: 'Product listing' })).toBeInTheDocument();
    expect(screen.queryAllByTestId(/^product-card-/)).toHaveLength(0);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it.each([['javascript:alert(1)'], [undefined]])(
    'shouldStillRenderButtonWhenImageUrlIsUnsafeOrMissing (%p)',
    (imageUrl) => {
      renderList({ products: [{ id: 'p-9', name: 'Odd Item', price: 5, imageUrl, inStock: true }] });
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Add to Cart: Odd Item/ })).toBeEnabled();
    }
  );
});
