import React, { useEffect, useState } from 'react';
import './Toast.css';

/**
 * Toast Notification Component
 * Displays temporary notifications to user
 */
const Toast = ({ message, type = 'success', duration = 3000 }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  if (!isVisible) return null;

  return (
    <div
      className={`toast toast-${type}`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid="toast-notification"
    >
      <span className="toast-message">{message}</span>
    </div>
  );
};

export default Toast;
