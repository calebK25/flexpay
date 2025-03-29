import React, { useState, useEffect } from 'react';
import './CreditCardAnimation.css';

const CreditCardAnimation = () => {
  const [displayText, setDisplayText] = useState('');
  const [showPurple, setShowPurple] = useState(false);

  useEffect(() => {
    const message = "Make Every Purchase Work for ";
    let currentIndex = 0;

    const interval = setInterval(() => {
      if (currentIndex < message.length) {
        setDisplayText(message.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(interval);
        setShowPurple(true);
      }
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="credit-cards-container">
      <div className="credit-card card-1">
        <div className="card-content">
          <div className="card-chip"></div>
          <div className="card-number">•••• •••• •••• 1234</div>
          <div className="card-details">
            <span>JOHN DOE</span>
            <span>12/25</span>
          </div>
        </div>
      </div>

      <div className="credit-card card-2">
        <div className="card-content">
          <div className="card-chip"></div>
          <div className="card-number">•••• •••• •••• 5678</div>
          <div className="card-details">
            <span>JANE SMITH</span>
            <span>03/26</span>
          </div>
        </div>
      </div>

      <div className="credit-card card-3">
        <div className="card-content">
          <div className="card-chip"></div>
          <div className="card-number">•••• •••• •••• 9012</div>
          <div className="card-details">
            <span>ALEX JONES</span>
            <span>06/27</span>
          </div>
        </div>
      </div>
      <div className="animated-text">
        {displayText}
        {showPurple && <span className="purple-text">You.</span>}
      </div>
    </div>
  );
};

export default CreditCardAnimation; 