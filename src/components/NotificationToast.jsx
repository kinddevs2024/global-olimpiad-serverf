import { useEffect, useState } from 'react';
import './NotificationToast.css';

const NotificationToast = ({ message, type = 'info', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`notification-toast ${type} ${isVisible ? 'visible' : ''}`}>
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-message">{message}</div>
      <button 
        className="notification-close"
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => {
            if (onClose) onClose();
          }, 300);
        }}
      >
        ×
      </button>
    </div>
  );
};

export default NotificationToast;

