import React, { useState, useEffect } from 'react';
import { getLinkedCards, linkCard, getUserMerchants } from '../utils/knotUtils';
import './PaymentMethods.css';

const PaymentMethods = ({ userId, onCardSwitch }) => {
  const [cards, setCards] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const [cardsData, merchantsData] = await Promise.all([
        getLinkedCards(userId),
        getUserMerchants(userId)
      ]);
      setCards(cardsData);
      setMerchants(merchantsData);
    } catch (err) {
      setError('Failed to load payment methods and merchant history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (cardData) => {
    try {
      const newCard = await linkCard(userId, cardData);
      setCards([...cards, newCard]);
      setShowAddCard(false);
    } catch (err) {
      setError('Failed to add new card');
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading payment methods...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="payment-methods-container">
      <div className="payment-methods-section">
        <h2>Payment Methods</h2>
        <div className="cards-grid">
          {cards.map(card => (
            <div key={card.id} className="card-item">
              <div className="card-icon">
                {card.brand === 'visa' ? (
                  <svg viewBox="0 0 24 24" fill="#1A1F71">
                    <path d="M24 8.77h-2.468v7.565h-1.425V8.77h-1.462V7.53H24v1.24zM18.986 7.53h-2.479v8.805h2.479c1.234 0 2.214-.54 2.214-1.416 0-.72-.504-1.188-1.342-1.282v-.045c.99-.109 1.674-.846 1.674-1.71 0-1.26-1.304-2.352-3.566-2.352zm1.083 2.791c0 .54-.442.935-1.119.935h-.952v-1.876h.952c.677 0 1.119.395 1.119.941zm.237 2.867c0 .503-.41.91-1.119.91h-1.084v-1.821h1.084c.71 0 1.119.407 1.119.911zM14.32 7.53h-1.462v8.805h1.462V7.53zM9.74 7.53H7.26v8.805h2.48V7.53zM7.26 6.29H5.834v1.24h1.425V6.29z"/>
                  </svg>
                ) : card.brand === 'mastercard' ? (
                  <svg viewBox="0 0 24 24" fill="#EB001B">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="#000000">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                )}
              </div>
              <div className="card-details">
                <div className="card-number">•••• {card.last4}</div>
                <div className="card-expiry">Expires {card.exp_month}/{card.exp_year}</div>
              </div>
              <button 
                className="switch-card-btn"
                onClick={() => onCardSwitch(card.id)}
              >
                Switch to this card
              </button>
            </div>
          ))}
        </div>
        <button 
          className="add-card-btn"
          onClick={() => setShowAddCard(true)}
        >
          Add New Card
        </button>
      </div>

      <div className="merchant-history-section">
        <h2>Merchant History</h2>
        <div className="merchants-grid">
          {merchants.map(merchant => (
            <div key={merchant.id} className="merchant-item">
              <div className="merchant-icon">
                {merchant.logo_url ? (
                  <img src={merchant.logo_url} alt={merchant.name} />
                ) : (
                  <div className="merchant-placeholder">
                    {merchant.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className="merchant-details">
                <div className="merchant-name">{merchant.name}</div>
                <div className="merchant-category">{merchant.category}</div>
              </div>
              <div className="merchant-stats">
                <div className="transaction-count">
                  {merchant.transaction_count} transactions
                </div>
                <div className="total-spent">
                  ${merchant.total_spent.toFixed(2)} total
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethods; 