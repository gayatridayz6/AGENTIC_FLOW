import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import AddToCartButton from '../components/AddToCartButton';
import cartReducer from '../store/cartSlice';
import * as CartService from '../services/CartService';

// Mock CartService
jest.mock('../services/CartService');

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

    const button = screen.getByTestId('add-to-cart-btn');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Add to Cart');
    expect(button).not.toBeDisabled();
  });

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

    const button = screen.getByTestId('add-to-cart-btn');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent('Out of Stock');
    expect(button).toHaveClass('out-of-stock');
  });

  test('button shows loading state when clicked', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    CartService.addToCart = jest.fn().mockResolvedValueOnce({
      success: true,
      itemCount: 1,
      items: [{ productId: '1', quantity: 1 }]
    });

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} />
      </Provider>
    );

    const button = screen.getByTestId('add-to-cart-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent('Adding...');
      expect(button).toBeDisabled();
    });
  });

  test('button shows success state after successful add', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    CartService.addToCart = jest.fn().mockResolvedValueOnce({
      success: true,
      itemCount: 1,
      items: [{ productId: '1', quantity: 1 }]
    });

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} />
      </Provider>
    );

    const button = screen.getByTestId('add-to-cart-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveTextContent('Added ✓');
      expect(button).toHaveClass('success');
    });
  });

  test('toast notification displays on successful add to cart', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    CartService.addToCart = jest.fn().mockResolvedValueOnce({
      success: true,
      itemCount: 1,
      items: [{ productId: '1', quantity: 1 }]
    });

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} />
      </Provider>
    );

    const button = screen.getByTestId('add-to-cart-btn');
    fireEvent.click(button);

    await waitFor(() => {
      const toast = screen.getByTestId('toast-notification');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveTextContent('Item added to cart');
    });
  });

  test('CartService.addToCart called with correct product ID', async () => {
    const mockProduct = {
      id: 'test-product-123',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    CartService.addToCart = jest.fn().mockResolvedValueOnce({
      success: true,
      itemCount: 1,
      items: []
    });

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} />
      </Provider>
    );

    const button = screen.getByTestId('add-to-cart-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(CartService.addToCart).toHaveBeenCalledWith('test-product-123', 1);
    });
  });

  test('handles API error gracefully', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    CartService.addToCart = jest.fn().mockRejectedValueOnce(new Error('Network error'));

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} />
      </Provider>
    );

    const button = screen.getByTestId('add-to-cart-btn');
    fireEvent.click(button);

    await waitFor(() => {
      const toast = screen.getByTestId('toast-notification');
      expect(toast).toBeInTheDocument();
      expect(toast).toHaveTextContent('Error');
      expect(button).not.toBeDisabled();
      expect(button).toHaveTextContent('Add to Cart');
    });
  });

  test('onSuccess callback is called when item added successfully', async () => {
    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    const onSuccessMock = jest.fn();

    CartService.addToCart = jest.fn().mockResolvedValueOnce({
      success: true,
      itemCount: 1,
      items: []
    });

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} onSuccess={onSuccessMock} />
      </Provider>
    );

    const button = screen.getByTestId('add-to-cart-btn');
    fireEvent.click(button);

    await waitFor(() => {
      expect(onSuccessMock).toHaveBeenCalled();
    });
  });

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

    const button = screen.getByTestId('add-to-cart-btn');
    expect(button).toHaveAttribute('aria-label');
  });

  test('button reverts to default state after 2 seconds', async () => {
    jest.useFakeTimers();

    const mockProduct = {
      id: '1',
      name: 'Test Product',
      price: 29.99,
      inStock: true
    };

    CartService.addToCart = jest.fn().mockResolvedValueOnce({
      success: true,
      itemCount: 1,
      items: []
    });

    render(
      <Provider store={store}>
        <AddToCartButton product={mockProduct} />
      </Provider>
    );

    const button = screen.getByTestId('add-to-cart-btn');
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
