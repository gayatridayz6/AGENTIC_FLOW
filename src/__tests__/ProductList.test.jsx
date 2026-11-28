import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import ProductCard, { formatPrice } from '../components/ProductCard';
import ProductList from '../components/ProductList';
import productsData from '../data/products';
import { createAppStore } from '../store';

jest.mock('axios', () => {
  const post = jest.fn();
  return { __esModule: true, default: { create: jest.fn(() => ({ post })), post } };
});
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
  ToastContainer: () => null,
}));

function renderWithStore(ui) {
  return render(<Provider store={createAppStore()}>{ui}</Provider>);
}

describe('products sample data', () => {
  it('AC1: has products with unique ids, names and at least one out-of-stock item', () => {
    expect(productsData.length).toBeGreaterThan(0);
    expect(new Set(productsData.map((p) => p.id)).size).toBe(productsData.length);
    expect(productsData.some((p) => p.inStock === false)).toBe(true);
    expect(productsData.some((p) => p.inStock === true)).toBe(true);
  });
});

describe('ProductList', () => {
  it('AC1: renders one list item per product', () => {
    renderWithStore(<ProductList />);
    const list = screen.getByRole('list', { name: 'Product listing' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(productsData.length);
  });

  it('AC1: renders an Add to Cart / Out of Stock button on EVERY product card', () => {
    renderWithStore(<ProductList />);
    productsData.forEach((product) => {
      const card = screen.getByTestId(`product-card-${product.id}`);
      const buttons = within(card).getAllByRole('button');
      expect(buttons).toHaveLength(1);
      expect(buttons[0]).toHaveTextContent(product.inStock ? 'Add to Cart' : 'Out of Stock');
    });
    expect(screen.getAllByRole('button')).toHaveLength(productsData.length);
  });

  it('AC5: in-stock products have enabled buttons, out-of-stock ones are disabled', () => {
    renderWithStore(<ProductList />);
    productsData.forEach((product) => {
      const card = screen.getByTestId(`product-card-${product.id}`);
      const button = within(card).getByRole('button');
      if (product.inStock) {
        expect(button).toBeEnabled();
      } else {
        expect(button).toBeDisabled();
        expect(button).toHaveTextContent(/^Out of Stock$/);
      }
    });
  });

  it('AC5: the count of "Out of Stock" buttons equals the count of unavailable products', () => {
    renderWithStore(<ProductList />);
    const expected = productsData.filter((p) => !p.inStock).length;
    expect(screen.getAllByText('Out of Stock')).toHaveLength(expected);
    expect(screen.getAllByText('Add to Cart')).toHaveLength(productsData.length - expected);
  });

  it('AC1: renders custom products passed via props', () => {
    const products = [
      { id: 'x1', name: 'Alpha', price: 1, imageUrl: '', inStock: true },
      { id: 'x2', name: 'Beta', price: 2, imageUrl: '', inStock: false },
    ];
    renderWithStore(<ProductList products={products} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('AC1: renders an empty list without buttons when there are no products', () => {
    renderWithStore(<ProductList products={[]} />);
    expect(screen.getByRole('list', { name: 'Product listing' })).toBeEmptyDOMElement();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('AC10: the list carries the responsive grid class', () => {
    renderWithStore(<ProductList />);
    expect(screen.getByRole('list', { name: 'Product listing' })).toHaveClass('product-list');
  });
});

describe('ProductCard', () => {
  const base = { id: 'p-1', name: 'Mug', price: 9.5, imageUrl: '', inStock: true };

  it('AC1: shows name, formatted price and the button', () => {
    renderWithStore(<ul><ProductCard product={base} /></ul>);
    expect(screen.getByRole('heading', { name: 'Mug' })).toBeInTheDocument();
    expect(screen.getByText('$9.50')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add to Cart: Mug' })).toBeInTheDocument();
  });

  it('AC1: renders a lazy-loaded image with alt text for a safe http(s) image url', () => {
    renderWithStore(<ul><ProductCard product={{ ...base, imageUrl: 'https://cdn.example.com/mug.png' }} /></ul>);
    const img = screen.getByRole('img', { name: 'Mug' });
    expect(img).toHaveAttribute('src', 'https://cdn.example.com/mug.png');
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveClass('product-card__image');
  });

  it.each([
    ['empty', ''],
    ['javascript scheme', 'javascript:alert(1)'],
    ['data uri', 'data:image/svg+xml;base64,AAAA'],
    ['undefined', undefined],
  ])('AC1: falls back to a placeholder for an unsafe/missing image url (%s)', (_label, imageUrl) => {
    const { container } = renderWithStore(<ul><ProductCard product={{ ...base, imageUrl }} /></ul>);
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(container.querySelector('img')).toBeNull();
    const placeholder = container.querySelector('.product-card__image--placeholder');
    expect(placeholder).toBeInTheDocument();
    expect(placeholder).toHaveAttribute('aria-hidden', 'true');
  });

  it('AC5: an out-of-stock product renders a disabled "Out of Stock" button', () => {
    renderWithStore(<ul><ProductCard product={{ ...base, inStock: false }} /></ul>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/^Out of Stock$/);
  });
});

describe('formatPrice', () => {
  it('AC1: formats numbers and numeric strings with two decimals', () => {
    expect(formatPrice(19.99)).toBe('$19.99');
    expect(formatPrice(49.5)).toBe('$49.50');
    expect(formatPrice(24)).toBe('$24.00');
    expect(formatPrice('12.5')).toBe('$12.50');
  });

  it('AC1: returns an empty string for non-numeric prices', () => {
    expect(formatPrice(undefined)).toBe('');
    expect(formatPrice('abc')).toBe('');
    expect(formatPrice(NaN)).toBe('');
    expect(formatPrice(Infinity)).toBe('');
  });

  it('AC1: documents that null is formatted as $0.00', () => {
    // BUG (low): Number(null) === 0, so a null price renders "$0.00" rather than being hidden.
    expect(formatPrice(null)).toBe('$0.00');
  });
});
