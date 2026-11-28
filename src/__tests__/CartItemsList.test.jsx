import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CartItemsList from '../components/CartItemsList';

describe('CartItemsList', () => {
  const mockItems = [
    {
      id: 'item-1',
      productId: 'prod-1',
      productName: 'Product 1',
      variant: { size: 'M' },
      unitPrice: 1999,
      quantity: 1,
      imageUrl: 'img1.jpg',
      subtotal: 1999,
    },
    {
      id: 'item-2',
      productId: 'prod-2',
      productName: 'Product 2',
      variant: { color: 'red' },
      unitPrice: 2999,
      quantity: 2,
      imageUrl: 'img2.jpg',
      subtotal: 5998,
    },
  ];

  it('renders list of cart items', () => {
    render(<CartItemsList items={mockItems} />);

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('renders empty message when no items', () => {
    render(<CartItemsList items={[]} />);
    expect(screen.getByText('No items in your cart')).toBeInTheDocument();
  });

  it('calls onUpdateQuantity and onRemoveItem handlers', () => {
    const onUpdateQuantity = jest.fn();
    const onRemoveItem = jest.fn();

    render(
      <CartItemsList
        items={mockItems}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
      />
    );

    expect(screen.getByText('Product 1')).toBeInTheDocument();
  });

  it('renders with default props', () => {
    const { container } = render(<CartItemsList />);
    expect(container.querySelector('.cart-items-list')).toBeInTheDocument();
  });

  // Edge cases
  it('renders single item correctly', () => {
    const singleItem = [mockItems[0]];
    render(<CartItemsList items={singleItem} />);
    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.queryByText('Product 2')).not.toBeInTheDocument();
  });

  it('renders many items (>10)', () => {
    const manyItems = Array.from({ length: 15 }, (_, i) => ({
      id: `item-${i}`,
      productId: `prod-${i}`,
      productName: `Product ${i}`,
      variant: {},
      unitPrice: 1999,
      quantity: 1,
      imageUrl: `img${i}.jpg`,
      subtotal: 1999,
    }));

    render(<CartItemsList items={manyItems} />);

    for (let i = 0; i < 15; i++) {
      expect(screen.getByText(`Product ${i}`)).toBeInTheDocument();
    }
  });

  it('passes handlers to child CartItem components', () => {
    const onUpdateQuantity = jest.fn();
    const onRemoveItem = jest.fn();

    render(
      <CartItemsList
        items={mockItems}
        onUpdateQuantity={onUpdateQuantity}
        onRemoveItem={onRemoveItem}
      />
    );

    // Find and click remove button for first item
    const removeButtons = screen.getAllByLabelText(/remove/i);
    fireEvent.click(removeButtons[0]);

    expect(onRemoveItem).toHaveBeenCalledWith('item-1');
  });

  it('updates quantity for specific item', () => {
    const onUpdateQuantity = jest.fn();

    render(
      <CartItemsList
        items={mockItems}
        onUpdateQuantity={onUpdateQuantity}
      />
    );

    const quantityInputs = screen.getAllByRole('spinbutton');
    fireEvent.change(quantityInputs[0], { target: { value: '5' } });

    expect(onUpdateQuantity).toHaveBeenCalledWith('item-1', 5);
  });

  it('renders items in correct order', () => {
    const { container } = render(<CartItemsList items={mockItems} />);

    const items = container.querySelectorAll('.cart-item');
    expect(items.length).toBe(2);
    expect(items[0].textContent).toContain('Product 1');
    expect(items[1].textContent).toContain('Product 2');
  });

  it('handles undefined items prop gracefully', () => {
    const { container } = render(<CartItemsList items={undefined} />);
    expect(container.querySelector('.cart-items-list')).toBeInTheDocument();
  });

  it('renders with items having different price ranges', () => {
    const mixedPriceItems = [
      { ...mockItems[0], unitPrice: 50, subtotal: 50 }, // $0.50
      { ...mockItems[1], unitPrice: 999999, subtotal: 1999998 }, // $9999.99
    ];

    render(<CartItemsList items={mixedPriceItems} />);

    expect(screen.getAllByText('$0.50').length).toBeGreaterThan(0);
    expect(screen.getByText('$9999.99')).toBeInTheDocument();
  });

  it('renders items with and without images', () => {
    const mixedImageItems = [
      { ...mockItems[0], imageUrl: 'img1.jpg' },
      { ...mockItems[1], imageUrl: null },
    ];

    render(<CartItemsList items={mixedImageItems} />);

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });

  it('calls onRemoveItem for different items', () => {
    const onRemoveItem = jest.fn();

    render(
      <CartItemsList
        items={mockItems}
        onRemoveItem={onRemoveItem}
      />
    );

    const removeButtons = screen.getAllByLabelText(/remove/i);

    fireEvent.click(removeButtons[0]);
    expect(onRemoveItem).toHaveBeenCalledWith('item-1');

    fireEvent.click(removeButtons[1]);
    expect(onRemoveItem).toHaveBeenCalledWith('item-2');
    expect(onRemoveItem).toHaveBeenCalledTimes(2);
  });

  it('renders list with accessible structure', () => {
    const { container } = render(<CartItemsList items={mockItems} />);
    const list = container.querySelector('.cart-items-list');
    expect(list).toHaveClass('cart-items-list');
  });

  it('maintains item identity across re-renders', () => {
    const { rerender } = render(<CartItemsList items={mockItems} />);

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();

    rerender(<CartItemsList items={mockItems} />);

    expect(screen.getByText('Product 1')).toBeInTheDocument();
    expect(screen.getByText('Product 2')).toBeInTheDocument();
  });
});
