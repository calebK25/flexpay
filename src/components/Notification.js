import React from 'react';
import './Notification.css';

const Notification = ({ notification, onClose }) => {
  if (!notification) return null;

  return (
    <div className={`notification ${notification.type}`}>
      <span className="message">{notification.message}</span>
      <button onClick={onClose} aria-label="Close notification">
        ×
      </button>
    </div>
  );
};

export default Notification; 