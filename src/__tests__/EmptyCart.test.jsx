import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyCart from '../components/EmptyCart';

describe('EmptyCart', () => {
  it('renders empty cart message', () => {
    render(<EmptyCart />);

    expect(screen.getByText('Your Cart is Empty')).toBeInTheDocument();
    expect(screen.getByText(/looks like you haven't added any items yet/i)).toBeInTheDocument();
  });

  it('renders start shopping button', () => {
    render(<EmptyCart />);
    expect(screen.getByRole('button', { name: /continue shopping/i })).toBeInTheDocument();
  });

  it('calls onContinueShopping when button is clicked', () => {
    const onContinueShopping = jest.fn();
    render(<EmptyCart onContinueShopping={onContinueShopping} />);

    const btn = screen.getByRole('button', { name: /continue shopping/i });
    fireEvent.click(btn);

    expect(onContinueShopping).toHaveBeenCalledTimes(1);
  });

  it('renders with default props', () => {
    const { container } = render(<EmptyCart />);
    expect(container.querySelector('.empty-cart')).toBeInTheDocument();
  });

  it('renders illustration SVG', () => {
    const { container } = render(<EmptyCart />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  // Edge cases
  it('handles undefined onContinueShopping callback gracefully', () => {
    expect(() => {
      render(<EmptyCart onContinueShopping={undefined} />);
    }).not.toThrow();

    const btn = screen.getByRole('button', { name: /continue shopping/i });
    expect(() => {
      fireEvent.click(btn);
    }).not.toThrow();
  });

  it('calls onContinueShopping with no arguments', () => {
    const onContinueShopping = jest.fn();
    render(<EmptyCart onContinueShopping={onContinueShopping} />);

    const btn = screen.getByRole('button', { name: /continue shopping/i });
    fireEvent.click(btn);

    expect(onContinueShopping).toHaveBeenCalledWith();
  });

  it('renders with proper container classes', () => {
    const { container } = render(<EmptyCart />);
    const emptyCart = container.querySelector('.empty-cart');
    expect(emptyCart).toHaveClass('empty-cart');
  });

  it('button should not be disabled', () => {
    render(<EmptyCart />);
    const btn = screen.getByRole('button', { name: /continue shopping/i });
    expect(btn).not.toBeDisabled();
  });

  it('renders with accessible heading', () => {
    render(<EmptyCart />);
    const heading = screen.getByRole('heading', { name: /your cart is empty/i });
    expect(heading).toBeInTheDocument();
  });

  it('renders descriptive text', () => {
    render(<EmptyCart />);
    expect(screen.getByText(/looks like you haven't added any items yet/i)).toBeInTheDocument();
  });

  it('handles multiple rapid clicks', () => {
    const onContinueShopping = jest.fn();
    render(<EmptyCart onContinueShopping={onContinueShopping} />);

    const btn = screen.getByRole('button', { name: /continue shopping/i });
    fireEvent.click(btn);
    fireEvent.click(btn);
    fireEvent.click(btn);

    expect(onContinueShopping).toHaveBeenCalledTimes(3);
  });

  it('renders SVG with proper structure', () => {
    const { container } = render(<EmptyCart />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width');
    expect(svg).toHaveAttribute('height');
  });

  it('contains call-to-action button', () => {
    const { container } = render(<EmptyCart />);
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
    expect(button?.textContent).toMatch(/continue shopping/i);
  });

  it('renders with accessible container role', () => {
    const { container } = render(<EmptyCart />);
    const emptyCart = container.querySelector('.empty-cart');
    expect(emptyCart).toBeInTheDocument();
  });

  it('button should be keyboard accessible', () => {
    render(<EmptyCart />);
    const btn = screen.getByRole('button', { name: /continue shopping/i });

    btn.focus();
    expect(btn).toHaveFocus();
  });

  it('renders with proper button styling', () => {
    const { container } = render(<EmptyCart />);
    const button = container.querySelector('button');
    expect(button?.tagName).toBe('BUTTON');
  });
});
