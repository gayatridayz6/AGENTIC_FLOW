import fs from 'fs';
import path from 'path';
import { render, screen, within } from '@testing-library/react';
import { Provider } from 'react-redux';
import App from '../App';
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

// jsdom does not lay out CSS, so responsive behaviour (AC10) is verified two ways:
//  1. the stylesheet / HTML shell contain the mobile-first breakpoints and touch targets;
//  2. the rendered DOM structure is identical for mobile and desktop viewport widths.
function readFirstExisting(candidates) {
  const found = candidates.find((candidate) => fs.existsSync(candidate));
  if (!found) throw new Error(`None of the candidate files exist: ${candidates.join(', ')}`);
  return fs.readFileSync(found, 'utf8');
}

const cwd = process.cwd();
const css = readFirstExisting([
  path.resolve(__dirname, '..', 'styles.css'),
  path.resolve(cwd, 'src', 'styles.css'),
  path.resolve(cwd, 'workspace', 'artifacts', 'dev', 'src', 'styles.css'),
]).replace(/\/\*[\s\S]*?\*\//g, '');
const html = readFirstExisting([
  path.resolve(__dirname, '..', '..', 'public', 'index.html'),
  path.resolve(cwd, 'public', 'index.html'),
  path.resolve(cwd, 'workspace', 'artifacts', 'dev', 'public', 'index.html'),
]);

function getMediaBlock(source, query) {
  const start = source.indexOf(`@media ${query}`);
  if (start === -1) return null;
  const bodyStart = source.indexOf('{', start) + 1;
  let depth = 1;
  for (let i = bodyStart; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(bodyStart, i);
    }
  }
  return null;
}

const squash = (text) => text.replace(/\s+/g, ' ');

describe('AC10: responsive stylesheet (desktop and mobile)', () => {
  const baseCss = css.slice(0, css.indexOf('@media'));

  it('AC10: the HTML shell has a responsive viewport meta tag', () => {
    expect(html).toMatch(/<meta\s+name="viewport"\s+content="width=device-width,\s*initial-scale=1"\s*\/?>/);
  });

  it('AC10: defines the mobile and desktop breakpoints', () => {
    expect(css).toContain('@media (max-width: 599px)');
    expect(css).toContain('@media (min-width: 600px)');
    expect(css).toContain('@media (min-width: 900px)');
    expect(css).toContain('@media (min-width: 1200px)');
  });

  it('AC10: is mobile-first - the base product grid is a single column', () => {
    expect(squash(baseCss)).toMatch(/\.product-list \{[^}]*grid-template-columns: 1fr;/);
    expect(squash(baseCss)).toMatch(/\.product-list \{[^}]*display: grid;/);
  });

  it.each([
    ['(min-width: 600px)', 'repeat(2, 1fr)'],
    ['(min-width: 900px)', 'repeat(3, 1fr)'],
    ['(min-width: 1200px)', 'repeat(4, 1fr)'],
  ])('AC10: %s switches the product grid to %s', (query, columns) => {
    const block = getMediaBlock(css, query);
    expect(block).not.toBeNull();
    expect(squash(block)).toContain(`grid-template-columns: ${columns}`);
  });

  it('AC10: tablet breakpoint widens the header padding for desktop', () => {
    const block = getMediaBlock(css, '(min-width: 600px)');
    expect(squash(block)).toMatch(/\.site-header \{[^}]*padding:/);
  });

  it('AC10: mobile breakpoint repositions the toast container below the header', () => {
    const block = getMediaBlock(css, '(max-width: 599px)');
    expect(block).not.toBeNull();
    expect(block).toContain('.Toastify__toast-container--top-right');
  });

  it('AC10: add-to-cart buttons are full width with a 44px minimum touch target', () => {
    const rule = squash(baseCss).match(/\.add-to-cart-btn \{[^}]*\}/)[0];
    expect(rule).toContain('width: 100%');
    expect(rule).toContain('min-height: 44px');
  });

  it('AC10: the cart icon keeps a 44px minimum touch target', () => {
    const rule = squash(baseCss).match(/\.cart-icon \{[^}]*\}/)[0];
    expect(rule).toContain('min-width: 44px');
    expect(rule).toContain('min-height: 44px');
  });

  it('AC10: the header is sticky and the page content is width-constrained and centred', () => {
    expect(squash(baseCss)).toMatch(/\.site-header \{[^}]*position: sticky;/);
    expect(squash(baseCss)).toMatch(/\.page \{[^}]*max-width: 1200px;[^}]*margin: 0 auto;/);
  });

  it('AC10: provides a visible keyboard focus style and an sr-only helper', () => {
    expect(css).toContain('.add-to-cart-btn:focus-visible');
    expect(css).toContain('.sr-only');
  });

  it('AC9/AC3/AC5: styles every button state (added, out_of_stock, error, disabled)', () => {
    expect(css).toContain('.add-to-cart-btn--added');
    expect(css).toContain('.add-to-cart-btn--out_of_stock');
    expect(css).toContain('.add-to-cart-btn--error');
    expect(css).toContain('.add-to-cart-btn:disabled');
  });
});

describe('AC10: DOM structure is viewport independent', () => {
  const originalWidth = window.innerWidth;

  afterEach(() => {
    window.innerWidth = originalWidth;
  });

  it.each([
    ['mobile (375px)', 375],
    ['tablet (768px)', 768],
    ['desktop (1280px)', 1280],
  ])('AC10: renders header, cart counter and a button on every card on %s', (_label, width) => {
    window.innerWidth = width;
    window.dispatchEvent(new Event('resize'));

    render(
      <Provider store={createAppStore()}>
        <App />
      </Provider>
    );

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByTestId('cart-count')).toBeInTheDocument();
    const list = screen.getByRole('list', { name: 'Product listing' });
    expect(list).toHaveClass('product-list');
    expect(within(list).getAllByRole('listitem')).toHaveLength(productsData.length);
    expect(within(list).getAllByRole('button')).toHaveLength(productsData.length);
  });
});
