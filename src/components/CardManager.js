import React, { useState, useEffect } from 'react';
import './CardManager.css';

const CardManager = ({ onSelect, onClose }) => {
  const [cards, setCards] = useState([]);
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [newCard, setNewCard] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });

  useEffect(() => {
    // Load cards from localStorage
    const savedCards = JSON.parse(localStorage.getItem('paymentCards') || '[]');
    setCards(savedCards);
  }, []);

  const handleAddCard = (e) => {
    e.preventDefault();
    const cardId = Date.now().toString();
    const newCardData = {
      id: cardId,
      ...newCard,
      lastFour: newCard.number.slice(-4),
      brand: getCardBrand(newCard.number)
    };
    
    const updatedCards = [...cards, newCardData];
    setCards(updatedCards);
    localStorage.setItem('paymentCards', JSON.stringify(updatedCards));
    setShowAddCard(false);
    setNewCard({ number: '', expiry: '', cvv: '', name: '' });
    setSelectedCardId(cardId);
  };

  const handleCardSelect = (cardId) => {
    setSelectedCardId(cardId);
    onSelect(cardId);
  };

  const getCardBrand = (number) => {
    if (number.startsWith('4')) return 'Visa';
    if (number.startsWith('5')) return 'Mastercard';
    if (number.startsWith('3')) return 'American Express';
    return 'Other';
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.slice(0, 2) + '/' + v.slice(2, 4);
    }
    return v;
  };

  return (
    <div className="card-manager-modal">
      <div className="modal-content">
        <h3>Select Payment Card</h3>
        <div className="cards-grid">
          {cards.map(card => (
            <div 
              key={card.id} 
              className={`card-item ${selectedCardId === card.id ? 'selected' : ''}`}
              onClick={() => handleCardSelect(card.id)}
            >
              <div className="card-brand">{card.brand}</div>
              <div className="card-number">•••• {card.lastFour}</div>
              <div className="card-expiry">{card.expiry}</div>
              <div className="card-name">{card.name}</div>
            </div>
          ))}
          <div 
            className="card-item add-card"
            onClick={() => setShowAddCard(true)}
          >
            <div className="add-card-icon">+</div>
            <div className="add-card-text">Add New Card</div>
          </div>
        </div>

        {showAddCard && (
          <div className="add-card-form">
            <h4>Add New Card</h4>
            <form onSubmit={handleAddCard}>
              <div className="form-group">
                <label>Card Number</label>
                <input
                  type="text"
                  value={newCard.number}
                  onChange={(e) => setNewCard({ ...newCard, number: formatCardNumber(e.target.value) })}
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
                    value={newCard.expiry}
                    onChange={(e) => setNewCard({ ...newCard, expiry: formatExpiry(e.target.value) })}
                    placeholder="MM/YY"
                    maxLength="5"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input
                    type="text"
                    value={newCard.cvv}
                    onChange={(e) => setNewCard({ ...newCard, cvv: e.target.value.replace(/[^0-9]/g, '') })}
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
                  value={newCard.name}
                  onChange={(e) => setNewCard({ ...newCard, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAddCard(false)} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  Save Card
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="cancel-btn">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CardManager; 