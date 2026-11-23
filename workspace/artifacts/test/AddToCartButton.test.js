import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AddToCartButton from '../AddToCartButton';
import cartReducer from '../cartSlice';
import * as CartService from '../CartService';

// Mock CartService
jest.mock('../CartService');

describe('AddToCartButton Component', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        cart: cartReducer
      }
    });
    jest.clearAllMocks();
  });

  // Test 1: Button renders with default state
  test('renders button with "Add to Cart" text in default state', () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} />
      </Provider>
    );

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Add to Cart');
    expect(button).not.toBeDisabled();
  });

  // Test 2: Button disabled when product is out of stock
  test('button is disabled and shows "Out of Stock" when product is out of stock', () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      inStock: false
    };

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} />
      </Provider>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Out of Stock');
    expect(button).toHaveClass('out-of-stock');
  });

  // Test 3: Button shows loading state when clicked
  test('button shows loading state when clicked', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    CartService.addToCart.mockResolvedValueOnce({
      success: true,
      itemCount: 1,
      items: [{ productId: '1', quantity: 1 }]
    });

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} />
      </Provider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent('Adding...');
      expect(button).toBeDisabled();
    });
  });

  // Test 4: Button shows success state after successful add
  test('button shows success state after successful cart add', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    CartService.addToCart.mockResolvedValueOnce({
      success: true,
      itemCount: 1,
      items: [{ productId: '1', quantity: 1 }]
    });

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} />
      </Provider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent('Added ✓');
      expect(button).toHaveClass('success');
    });
  });

  // Test 5: Toast notification shows on success
  test('toast notification displays on successful add to cart', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    CartService.addToCart.mockResolvedValueOnce({
      success: true,
      itemCount: 1,
      items: [{ productId: '1', quantity: 1 }]
    });

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} />
      </Provider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const toast = screen.getByText(/Item added to cart/i);
      expect(toast).toBeInTheDocument();
    });
  });

  // Test 6: API call made with correct parameters
  test('CartService.addToCart called with correct product ID', async () => {
    const mockProduct = {
      id: 'test-product-123',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    CartService.addToCart.mockResolvedValueOnce({
      success: true,
      itemCount: 1,
      items: []
    });

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} />
      </Provider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(CartService.addToCart).toHaveBeenCalledWith('test-product-123', 1);
    });
  });

  // Test 7: Error handling
  test('handles API error gracefully', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    CartService.addToCart.mockRejectedValueOnce(new Error('Network error'));

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} />
      </Provider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      const errorToast = screen.getByText(/Error/i);
      expect(errorToast).toBeInTheDocument();
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent('Add to Cart');
    });
  });

  // Test 8: Callback invoked on success
  test('onSuccess callback is called when item added successfully', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    const onSuccessMock = jest.fn();

    CartService.addToCart.mockResolvedValueOnce({
      success: true,
      itemCount: 1,
      items: []
    });

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} onSuccess={onSuccessMock} />
      </Provider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalled();
    });
  });

  // Test 9: Accessibility - aria-label
  test('button has proper accessibility attributes', () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} />
      </Provider>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Add Test Product to cart');
  });

  // Test 10: Button reverts to default state after success
  test('button reverts to default state after 2 seconds', async () => {
    jest.useFakeTimers();

    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    CartService.addToCart.mockResolvedValueOnce({
      success: true,
      itemCount: 1,
      items: []
    });

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} />
      </Provider>
    );

    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent('Added ✓');
    });

    jest.advanceTimersByTime(2000);

    await waitFor(() => {
      expect(button).toHaveTextContent('Add to Cart');
      expect(button).not.toBeDisabled();
    });

    jest.useRealTimers();
  });
});
