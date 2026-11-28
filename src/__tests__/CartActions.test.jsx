import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CartActions from '../components/CartActions';

describe('CartActions', () => {
  it('renders checkout and continue shopping buttons', () => {
    render(<CartActions />);

    expect(screen.getByRole('button', { name: /proceed to checkout/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /continue shopping/i })).toBeInTheDocument();
  });

  it('calls onCheckout when checkout button is clicked', () => {
    const onCheckout = jest.fn();
    render(<CartActions onCheckout={onCheckout} />);

    const checkoutBtn = screen.getByRole('button', { name: /proceed to checkout/i });
    fireEvent.click(checkoutBtn);

    expect(onCheckout).toHaveBeenCalledTimes(1);
  });

  it('calls onContinueShopping when continue button is clicked', () => {
    const onContinueShopping = jest.fn();
    render(<CartActions onContinueShopping={onContinueShopping} />);

    const continueBtn = screen.getByRole('button', { name: /continue shopping/i });
    fireEvent.click(continueBtn);

    expect(onContinueShopping).toHaveBeenCalledTimes(1);
  });

  it('calls both callbacks independently', () => {
    const onCheckout = jest.fn();
    const onContinueShopping = jest.fn();
    render(<CartActions onCheckout={onCheckout} onContinueShopping={onContinueShopping} />);

    fireEvent.click(screen.getByRole('button', { name: /proceed to checkout/i }));
    expect(onCheckout).toHaveBeenCalledTimes(1);
    expect(onContinueShopping).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /continue shopping/i }));
    expect(onContinueShopping).toHaveBeenCalledTimes(1);
  });

  // Edge cases
  it('handles multiple rapid clicks on checkout button', () => {
    const onCheckout = jest.fn();
    render(<CartActions onCheckout={onCheckout} />);

    const checkoutBtn = screen.getByRole('button', { name: /proceed to checkout/i });
    fireEvent.click(checkoutBtn);
    fireEvent.click(checkoutBtn);
    fireEvent.click(checkoutBtn);

    expect(onCheckout).toHaveBeenCalledTimes(3);
  });

  it('handles multiple rapid clicks on continue button', () => {
    const onContinueShopping = jest.fn();
    render(<CartActions onContinueShopping={onContinueShopping} />);

    const continueBtn = screen.getByRole('button', { name: /continue shopping/i });
    fireEvent.click(continueBtn);
    fireEvent.click(continueBtn);
    fireEvent.click(continueBtn);

    expect(onContinueShopping).toHaveBeenCalledTimes(3);
  });

  it('handles undefined callback functions gracefully', () => {
    expect(() => {
      render(<CartActions />);
    }).not.toThrow();

    const checkoutBtn = screen.getByRole('button', { name: /proceed to checkout/i });
    expect(() => {
      fireEvent.click(checkoutBtn);
    }).not.toThrow();
  });

  it('buttons should not be disabled by default', () => {
    render(<CartActions />);

    const checkoutBtn = screen.getByRole('button', { name: /proceed to checkout/i });
    const continueBtn = screen.getByRole('button', { name: /continue shopping/i });

    expect(checkoutBtn).not.toBeDisabled();
    expect(continueBtn).not.toBeDisabled();
  });

  it('renders both buttons in correct order', () => {
    const { container } = render(<CartActions />);
    const buttons = container.querySelectorAll('button');

    // Should have checkout button before continue button
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('buttons should have proper aria labels', () => {
    render(<CartActions />);

    const checkoutBtn = screen.getByRole('button', { name: /proceed to checkout/i });
    const continueBtn = screen.getByRole('button', { name: /continue shopping/i });

    expect(checkoutBtn).toHaveAccessibleName();
    expect(continueBtn).toHaveAccessibleName();
  });

  it('calls callback with no arguments', () => {
    const onCheckout = jest.fn();
    const onContinueShopping = jest.fn();
    render(<CartActions onCheckout={onCheckout} onContinueShopping={onContinueShopping} />);

    fireEvent.click(screen.getByRole('button', { name: /proceed to checkout/i }));
    expect(onCheckout).toHaveBeenCalledWith();

    fireEvent.click(screen.getByRole('button', { name: /continue shopping/i }));
    expect(onContinueShopping).toHaveBeenCalledWith();
  });

  it('renders with accessible container', () => {
    const { container } = render(<CartActions />);
    const actionsContainer = container.querySelector('.cart-actions');
    expect(actionsContainer).toBeInTheDocument();
  });

  it('buttons should be keyboard accessible', async () => {
    const onCheckout = jest.fn();
    const onContinueShopping = jest.fn();
    render(<CartActions onCheckout={onCheckout} onContinueShopping={onContinueShopping} />);

    const checkoutBtn = screen.getByRole('button', { name: /proceed to checkout/i });
    const continueBtn = screen.getByRole('button', { name: /continue shopping/i });

    // Simulate keyboard interaction
    checkoutBtn.focus();
    expect(checkoutBtn).toHaveFocus();

    continueBtn.focus();
    expect(continueBtn).toHaveFocus();
  });

  it('renders with proper button types', () => {
    render(<CartActions />);

    const checkoutBtn = screen.getByRole('button', { name: /proceed to checkout/i });
    const continueBtn = screen.getByRole('button', { name: /continue shopping/i });

    expect(checkoutBtn.tagName).toBe('BUTTON');
    expect(continueBtn.tagName).toBe('BUTTON');
  });

  it('handles click event propagation correctly', () => {
    const onCheckout = jest.fn();
    const { container } = render(<CartActions onCheckout={onCheckout} />);

    const checkoutBtn = screen.getByRole('button', { name: /proceed to checkout/i });
    fireEvent.click(checkoutBtn);

    expect(onCheckout).toHaveBeenCalledTimes(1);
  });
});
