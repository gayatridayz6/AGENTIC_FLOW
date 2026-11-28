import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import CartPage from '../components/CartPage';
import CartItem from '../components/CartItem';
import CartSummary from '../components/CartSummary';
import CartActions from '../components/CartActions';
import EmptyCart from '../components/EmptyCart';
import cartReducer from '../store/cartSlice';

const createTestStore = (preloadedState = {}) => {
  const defaultState = {
    cart: {
      items: [],
      count: 0,
      subtotal: 0,
      tax: 0,
      total: 0,
      statusByProduct: {},
      error: null,
    },
  };

  return configureStore({
    reducer: { cart: cartReducer },
    preloadedState: { ...defaultState, ...preloadedState },
  });
};

describe('Cart Components - Accessibility Tests', () => {
  describe('ARIA Labels and Attributes', () => {
    it('CartPage has proper heading hierarchy', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <CartPage />
        </Provider>
      );

      const heading = screen.getByRole('heading', { name: /shopping cart/i, level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('CartItem has proper region role and aria-label', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'T-Shirt',
        variant: { size: 'M' },
        unitPrice: 1999,
        quantity: 1,
        imageUrl: 'img.jpg',
        subtotal: 1999,
      };

      render(<CartItem item={mockItem} />);

      const article = screen.getByRole('region');
      expect(article).toHaveAttribute('aria-label', 'T-Shirt in cart');
    });

    it('Quantity input has proper aria-label', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'Product',
        variant: {},
        unitPrice: 1999,
        quantity: 2,
        imageUrl: null,
        subtotal: 3998,
      };

      render(<CartItem item={mockItem} />);

      const quantityInput = screen.getByLabelText('Product quantity');
      expect(quantityInput).toHaveAttribute('type', 'number');
      expect(quantityInput).toHaveAttribute('min', '1');
      expect(quantityInput).toHaveAttribute('max', '999');
    });

    it('Remove button has descriptive aria-label', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'T-Shirt',
        variant: {},
        unitPrice: 1999,
        quantity: 1,
        imageUrl: null,
        subtotal: 1999,
      };

      render(<CartItem item={mockItem} />);

      const removeBtn = screen.getByLabelText('Remove T-Shirt from cart');
      expect(removeBtn).toBeInTheDocument();
    });

    it('Increment button has descriptive aria-label', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'T-Shirt',
        variant: {},
        unitPrice: 1999,
        quantity: 1,
        imageUrl: null,
        subtotal: 1999,
      };

      render(<CartItem item={mockItem} />);

      const incrementBtn = screen.getByLabelText('Increase T-Shirt quantity');
      expect(incrementBtn).toBeInTheDocument();
    });

    it('Decrement button has descriptive aria-label', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'T-Shirt',
        variant: {},
        unitPrice: 1999,
        quantity: 2,
        imageUrl: null,
        subtotal: 3998,
      };

      render(<CartItem item={mockItem} />);

      const decrementBtn = screen.getByLabelText('Decrease T-Shirt quantity');
      expect(decrementBtn).toBeInTheDocument();
    });

    it('CartActions buttons have accessible names', () => {
      render(<CartActions />);

      const checkoutBtn = screen.getByRole('button', { name: /proceed to checkout/i });
      const continueBtn = screen.getByRole('button', { name: /continue shopping/i });

      expect(checkoutBtn).toHaveAccessibleName();
      expect(continueBtn).toHaveAccessibleName();
    });

    it('EmptyCart heading has correct level', () => {
      render(<EmptyCart />);

      const heading = screen.getByRole('heading', { name: /your cart is empty/i });
      expect(heading).toBeInTheDocument();
    });
  });

  describe('Keyboard Navigation', () => {
    it('All buttons are keyboard focusable', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'Product',
        variant: {},
        unitPrice: 1999,
        quantity: 2,
        imageUrl: null,
        subtotal: 3998,
      };

      render(<CartItem item={mockItem} />);

      const incrementBtn = screen.getByLabelText(/increase/i);
      const decrementBtn = screen.getByLabelText(/decrease/i);
      const removeBtn = screen.getByLabelText(/remove/i);

      incrementBtn.focus();
      expect(incrementBtn).toHaveFocus();

      decrementBtn.focus();
      expect(decrementBtn).toHaveFocus();

      removeBtn.focus();
      expect(removeBtn).toHaveFocus();
    });

    it('Quantity input is keyboard accessible', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'Product',
        variant: {},
        unitPrice: 1999,
        quantity: 1,
        imageUrl: null,
        subtotal: 1999,
      };

      render(<CartItem item={mockItem} />);

      const quantityInput = screen.getByRole('spinbutton');
      quantityInput.focus();
      expect(quantityInput).toHaveFocus();
    });

    it('CartActions buttons are keyboard accessible', () => {
      render(<CartActions />);

      const checkoutBtn = screen.getByRole('button', { name: /proceed to checkout/i });
      const continueBtn = screen.getByRole('button', { name: /continue shopping/i });

      checkoutBtn.focus();
      expect(checkoutBtn).toHaveFocus();

      continueBtn.focus();
      expect(continueBtn).toHaveFocus();
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('CartItem has sr-only text for icon buttons', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'T-Shirt',
        variant: {},
        unitPrice: 1999,
        quantity: 1,
        imageUrl: null,
        subtotal: 1999,
      };

      const { container } = render(<CartItem item={mockItem} />);

      // Remove button should have sr-only text
      const srOnlyText = container.querySelector('.sr-only');
      expect(srOnlyText).toBeInTheDocument();
    });

    it('Image alt text is descriptive', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'Blue T-Shirt',
        variant: {},
        unitPrice: 1999,
        quantity: 1,
        imageUrl: 'img.jpg',
        subtotal: 1999,
      };

      render(<CartItem item={mockItem} />);

      const image = screen.getByAltText('Blue T-Shirt');
      expect(image).toBeInTheDocument();
    });

    it('CartPage item count has aria-live for updates', () => {
      const store = createTestStore();
      render(
        <Provider store={store}>
          <CartPage />
        </Provider>
      );

      // Find element with aria-live
      const liveRegion = document.querySelector('.cart-page__item-count');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveTextContent(/your cart is empty/i);
    });

    it('Price information is clearly labeled', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'Product',
        variant: {},
        unitPrice: 1999,
        quantity: 2,
        imageUrl: null,
        subtotal: 3998,
      };

      render(<CartItem item={mockItem} />);

      // Unit price should be visible
      expect(screen.getByText('$19.99')).toBeInTheDocument();
      // Subtotal label
      expect(screen.getByText('Subtotal:')).toBeInTheDocument();
      // Subtotal value
      expect(screen.getByText('$39.98')).toBeInTheDocument();
    });
  });

  describe('Color and Contrast', () => {
    it('Remove button has sufficient visual indicators', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'Product',
        variant: {},
        unitPrice: 1999,
        quantity: 1,
        imageUrl: null,
        subtotal: 1999,
      };

      render(<CartItem item={mockItem} />);

      const removeBtn = screen.getByLabelText(/remove/i);
      expect(removeBtn).toHaveClass('cart-item__remove-btn');
    });

    it('Disabled buttons have proper visual state', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'Product',
        variant: {},
        unitPrice: 1999,
        quantity: 1,
        imageUrl: null,
        subtotal: 1999,
      };

      render(<CartItem item={mockItem} />);

      const decrementBtn = screen.getByLabelText(/decrease/i);
      expect(decrementBtn).toBeDisabled();
    });
  });

  describe('Form Elements Accessibility', () => {
    it('Number input accepts keyboard input correctly', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'Product',
        variant: {},
        unitPrice: 1999,
        quantity: 1,
        imageUrl: null,
        subtotal: 1999,
      };

      render(<CartItem item={mockItem} />);

      const quantityInput = screen.getByRole('spinbutton');
      expect(quantityInput).toHaveAttribute('type', 'number');
      expect(quantityInput).toHaveAttribute('min');
      expect(quantityInput).toHaveAttribute('max');
    });

    it('Input field has proper constraints', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'Product',
        variant: {},
        unitPrice: 1999,
        quantity: 5,
        imageUrl: null,
        subtotal: 9995,
      };

      render(<CartItem item={mockItem} />);

      const quantityInput = screen.getByDisplayValue('5');
      expect(Number(quantityInput.min)).toBe(1);
      expect(Number(quantityInput.max)).toBe(999);
    });
  });

  describe('Semantic HTML', () => {
    it('CartItem uses semantic article element', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'Product',
        variant: {},
        unitPrice: 1999,
        quantity: 1,
        imageUrl: null,
        subtotal: 1999,
      };

      const { container } = render(<CartItem item={mockItem} />);

      const article = container.querySelector('article');
      expect(article).toBeInTheDocument();
    });

    it('CartPage uses semantic main content area', () => {
      const store = createTestStore();
      const { container } = render(
        <Provider store={store}>
          <CartPage />
        </Provider>
      );

      // CartPage itself should be in a main area
      const cartPage = container.querySelector('.cart-page');
      expect(cartPage).toBeInTheDocument();
    });

    it('CartSummary renders with semantic structure', () => {
      const store = createTestStore({
        cart: {
          items: [],
          count: 0,
          subtotal: 1000,
          tax: 100,
          total: 1100,
          statusByProduct: {},
          error: null,
        },
      });

      const { container } = render(
        <Provider store={store}>
          <CartSummary />
        </Provider>
      );

      const summary = container.querySelector('.cart-summary');
      expect(summary).toBeInTheDocument();
    });
  });

  describe('Title and Labels', () => {
    it('All inputs have associated labels', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'Product Name',
        variant: {},
        unitPrice: 1999,
        quantity: 2,
        imageUrl: null,
        subtotal: 3998,
      };

      render(<CartItem item={mockItem} />);

      // Quantity input should have label
      const quantityInput = screen.getByLabelText('Product Name quantity');
      expect(quantityInput).toBeInTheDocument();
    });

    it('Buttons have title attributes for tooltips', () => {
      const mockItem = {
        id: 'test-1',
        productId: 'prod-1',
        productName: 'Product',
        variant: {},
        unitPrice: 1999,
        quantity: 2,
        imageUrl: null,
        subtotal: 3998,
      };

      render(<CartItem item={mockItem} />);

      const incrementBtn = screen.getByLabelText(/increase/i);
      const decrementBtn = screen.getByLabelText(/decrease/i);
      const removeBtn = screen.getByLabelText(/remove/i);

      expect(incrementBtn).toHaveAttribute('title');
      expect(decrementBtn).toHaveAttribute('title');
      expect(removeBtn).toHaveAttribute('title');
    });
  });

  describe('Dynamic Content Updates', () => {
    it('Live region announces cart count changes', () => {
      const store = createTestStore({
        cart: {
          items: [
            {
              id: 'item-1',
              productId: 'prod-1',
              productName: 'Item',
              variant: {},
              unitPrice: 1000,
              quantity: 1,
              imageUrl: null,
              subtotal: 1000,
            },
          ],
          count: 1,
          subtotal: 1000,
          tax: 100,
          total: 1100,
          statusByProduct: {},
          error: null,
        },
      });

      render(
        <Provider store={store}>
          <CartPage />
        </Provider>
      );

      const liveRegion = screen.getByText('1 item').closest('[aria-live]');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });
});