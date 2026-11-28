import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartItem from '../components/CartItem';

describe('CartItem', () => {
  const mockItem = {
    id: 'test-item-1',
    productId: 'prod-123',
    productName: 'Awesome T-Shirt',
    variant: { size: 'M', color: 'blue' },
    unitPrice: 1999,
    quantity: 2,
    imageUrl: 'https://example.com/image.jpg',
    subtotal: 3998,
  };

  it('renders cart item with product details', () => {
    render(<CartItem item={mockItem} />);

    expect(screen.getByText('Awesome T-Shirt')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2')).toBeInTheDocument();
    expect(screen.getByText('$19.99')).toBeInTheDocument();
  });

  it('renders variant information', () => {
    render(<CartItem item={mockItem} />);
    expect(screen.getByText('M blue')).toBeInTheDocument();
  });

  it('calls onUpdateQuantity when increment button is clicked', () => {
    const onUpdateQuantity = jest.fn();
    render(<CartItem item={mockItem} onUpdateQuantity={onUpdateQuantity} />);

    const incrementBtn = screen.getByLabelText('Increase Awesome T-Shirt quantity');
    fireEvent.click(incrementBtn);

    expect(onUpdateQuantity).toHaveBeenCalledWith('test-item-1', 3);
  });

  it('calls onUpdateQuantity when decrement button is clicked', () => {
    const onUpdateQuantity = jest.fn();
    render(<CartItem item={mockItem} onUpdateQuantity={onUpdateQuantity} />);

    const decrementBtn = screen.getByLabelText('Decrease Awesome T-Shirt quantity');
    fireEvent.click(decrementBtn);

    expect(onUpdateQuantity).toHaveBeenCalledWith('test-item-1', 1);
  });

  it('disables decrement button when quantity is 1', () => {
    const item = { ...mockItem, quantity: 1 };
    render(<CartItem item={item} />);

    const decrementBtn = screen.getByLabelText('Decrease Awesome T-Shirt quantity');
    expect(decrementBtn).toBeDisabled();
  });

  it('calls onRemoveItem when remove button is clicked', () => {
    const onRemoveItem = jest.fn();
    render(<CartItem item={mockItem} onRemoveItem={onRemoveItem} />);

    const removeBtn = screen.getByLabelText('Remove Awesome T-Shirt from cart');
    fireEvent.click(removeBtn);

    expect(onRemoveItem).toHaveBeenCalledWith('test-item-1');
  });

  it('updates quantity via input field', () => {
    const onUpdateQuantity = jest.fn();
    render(<CartItem item={mockItem} onUpdateQuantity={onUpdateQuantity} />);

    const quantityInput = screen.getByDisplayValue('2');
    fireEvent.change(quantityInput, { target: { value: '5' } });

    expect(onUpdateQuantity).toHaveBeenCalledWith('test-item-1', 5);
  });

  it('renders image with fallback placeholder', () => {
    const { rerender } = render(<CartItem item={mockItem} />);
    const image = screen.getByAltText('Awesome T-Shirt');
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');

    const itemNoImage = { ...mockItem, imageUrl: null };
    rerender(<CartItem item={itemNoImage} />);
    expect(screen.getByText('No Image')).toBeInTheDocument();
  });

  it('displays correct subtotal', () => {
    render(<CartItem item={mockItem} />);
    expect(screen.getByText('$39.98')).toBeInTheDocument();
  });

  // Edge cases
  it('handles large quantities', () => {
    const largeQuantityItem = { ...mockItem, quantity: 999, subtotal: 1997001 };
    const onUpdateQuantity = jest.fn();
    render(<CartItem item={largeQuantityItem} onUpdateQuantity={onUpdateQuantity} />);

    expect(screen.getByDisplayValue('999')).toBeInTheDocument();
    const incrementBtn = screen.getByLabelText('Increase Awesome T-Shirt quantity');
    fireEvent.click(incrementBtn);
    expect(onUpdateQuantity).toHaveBeenCalledWith('test-item-1', 1000);
  });

  it('renders variant with size only', () => {
    const itemWithSizeOnly = { ...mockItem, variant: { size: 'L' } };
    render(<CartItem item={itemWithSizeOnly} />);
    expect(screen.getByText('L')).toBeInTheDocument();
  });

  it('renders variant with color only', () => {
    const itemWithColorOnly = { ...mockItem, variant: { color: 'red' } };
    render(<CartItem item={itemWithColorOnly} />);
    expect(screen.getByText('red')).toBeInTheDocument();
  });

  it('renders with no variant information', () => {
    const itemNoVariant = { ...mockItem, variant: {} };
    render(<CartItem item={itemNoVariant} />);
    // Should not display variant text if both size and color are missing
    const article = screen.getByRole('region', { name: /in cart/ });
    expect(article).toBeInTheDocument();
  });

  it('ignores invalid quantity input', () => {
    const onUpdateQuantity = jest.fn();
    render(<CartItem item={mockItem} onUpdateQuantity={onUpdateQuantity} />);

    const quantityInput = screen.getByDisplayValue('2');
    fireEvent.change(quantityInput, { target: { value: '-5' } });

    // Should not call callback for invalid input
    expect(onUpdateQuantity).not.toHaveBeenCalledWith('test-item-1', -5);
  });

  it('ignores zero quantity input', () => {
    const onUpdateQuantity = jest.fn();
    render(<CartItem item={mockItem} onUpdateQuantity={onUpdateQuantity} />);

    const quantityInput = screen.getByDisplayValue('2');
    fireEvent.change(quantityInput, { target: { value: '0' } });

    expect(onUpdateQuantity).not.toHaveBeenCalledWith('test-item-1', 0);
  });

  it('handles NaN in quantity input', () => {
    const onUpdateQuantity = jest.fn();
    render(<CartItem item={mockItem} onUpdateQuantity={onUpdateQuantity} />);

    const quantityInput = screen.getByDisplayValue('2');
    fireEvent.change(quantityInput, { target: { value: 'abc' } });

    // Should not call callback for NaN
    expect(onUpdateQuantity).not.toHaveBeenCalled();
  });

  it('renders with high price values', () => {
    const expensiveItem = { ...mockItem, unitPrice: 999999, subtotal: 1999998 };
    render(<CartItem item={expensiveItem} />);
    expect(screen.getByText('$9999.99')).toBeInTheDocument();
    expect(screen.getByText('$19999.98')).toBeInTheDocument();
  });

  it('renders with cent-only prices', () => {
    const cheapItem = { ...mockItem, unitPrice: 50, subtotal: 100 };
    render(<CartItem item={cheapItem} />);
    expect(screen.getByText('$0.50')).toBeInTheDocument();
    expect(screen.getByText('$1.00')).toBeInTheDocument();
  });

  it('enables decrement button when quantity > 1', () => {
    const item = { ...mockItem, quantity: 2 };
    render(<CartItem item={item} />);

    const decrementBtn = screen.getByLabelText('Decrease Awesome T-Shirt quantity');
    expect(decrementBtn).not.toBeDisabled();
  });

  it('renders remove button with accessibility attributes', () => {
    render(<CartItem item={mockItem} />);

    const removeBtn = screen.getByLabelText('Remove Awesome T-Shirt from cart');
    expect(removeBtn).toHaveAttribute('title', 'Remove item');
  });

  it('renders increment button with accessibility attributes', () => {
    render(<CartItem item={mockItem} />);

    const incrementBtn = screen.getByLabelText('Increase Awesome T-Shirt quantity');
    expect(incrementBtn).toHaveAttribute('title', 'Increase quantity');
  });

  it('renders quantity input with min and max attributes', () => {
    render(<CartItem item={mockItem} />);

    const quantityInput = screen.getByDisplayValue('2');
    expect(quantityInput).toHaveAttribute('min', '1');
    expect(quantityInput).toHaveAttribute('max', '999');
  });

  it('handles image load error gracefully', () => {
    render(<CartItem item={mockItem} />);
    const image = screen.getByAltText('Awesome T-Shirt');

    // Simulate image load error
    fireEvent.error(image);

    // Image should have error handler that shows SVG placeholder
    expect(image.src).toContain('data:image/svg+xml');
  });

  it('renders article with proper region label', () => {
    render(<CartItem item={mockItem} />);

    const article = screen.getByRole('region');
    expect(article).toHaveAttribute('aria-label', 'Awesome T-Shirt in cart');
  });

  it('calls handlers only once per click', () => {
    const onUpdateQuantity = jest.fn();
    const onRemoveItem = jest.fn();
    render(<CartItem item={mockItem} onUpdateQuantity={onUpdateQuantity} onRemoveItem={onRemoveItem} />);

    const removeBtn = screen.getByLabelText('Remove Awesome T-Shirt from cart');
    fireEvent.click(removeBtn);
    fireEvent.click(removeBtn);

    expect(onRemoveItem).toHaveBeenCalledTimes(2);
  });
});
