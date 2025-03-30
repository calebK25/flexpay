import React, { useState } from 'react';
import './AddCard.css';

const AddCard = ({ onClose, onAddCard }) => {
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // For demo purposes, we'll create a fake card with the provided data
    const fakeCard = {
      id: `card_${Math.random().toString(36).substr(2, 9)}`,
      brand: 'Visa', // You could detect this based on the card number
      last_four: cardData.number.slice(-4),
      name: cardData.name,
      expiry: cardData.expiry,
      // Add any other required fields
    };
    onAddCard(fakeCard);
    onClose();
  };

  return (
    <div className="add-card-modal">
      <div className="modal-content">
        <h2>Add New Card</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Card Number</label>
            <input
              type="text"
              value={cardData.number}
              onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
              placeholder="1234 5678 9012 3456"
              maxLength="19"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Expiry Date</label>
              <input
                type="text"
                value={cardData.expiry}
                onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                placeholder="MM/YY"
                maxLength="5"
                required
              />
            </div>
            <div className="form-group">
              <label>CVC</label>
              <input
                type="text"
                value={cardData.cvc}
                onChange={(e) => setCardData({ ...cardData, cvc: e.target.value })}
                placeholder="123"
                maxLength="4"
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Cardholder Name</label>
            <input
              type="text"
              value={cardData.name}
              onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>
          <div className="modal-actions">
            <button type="submit" className="add-card-btn">
              Add Card
            </button>
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCard; 