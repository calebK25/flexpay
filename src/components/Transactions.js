import React, { useState, useEffect } from 'react';
import { getTransactions, getLinkedCards, linkCard, getAvailableCards, switchCard } from '../utils/knotUtils';
import Notification from './Notification';
import './Transactions.css';

const Transactions = ({ userId }) => {
  const [transactions, setTransactions] = useState([]);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showPaymentPlanModal, setShowPaymentPlanModal] = useState(false);
  const [paymentPlanDetails, setPaymentPlanDetails] = useState({
    numberOfPayments: 3,
    startDate: new Date().toISOString().split('T')[0]
  });
  const [newCardData, setNewCardData] = useState({
    number: '',
    exp_month: '',
    exp_year: '',
    cvc: '',
    brand: ''
  });
  const [notification, setNotification] = useState(null);
  const [availableCards, setAvailableCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);

  useEffect(() => {
    loadData();
  }, [userId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [transactionsData, cardsData] = await Promise.all([
        getTransactions(userId),
        getLinkedCards(userId)
      ]);
      setTransactions(transactionsData);
      setCards(cardsData);
    } catch (err) {
      setError('Failed to load transactions and payment methods');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async (e) => {
    e.preventDefault();
    try {
      const newCard = await linkCard(userId, newCardData);
      setCards([...cards, newCard]);
      setShowAddCard(false);
      setNewCardData({
        number: '',
        exp_month: '',
        exp_year: '',
        cvc: '',
        brand: ''
      });
    } catch (err) {
      setError('Failed to add new card');
      console.error(err);
    }
  };

  const handleCreatePaymentPlan = (transaction, cardId) => {
    setSelectedTransaction(transaction);
    setSelectedCardId(cardId);
    setShowPaymentPlanModal(true);
  };

  const handleSubmitPaymentPlan = async (e) => {
    e.preventDefault();
    try {
      if (!selectedCardId) {
        setError('Please select a payment method');
        return;
      }

      const planAmount = selectedTransaction.amount / paymentPlanDetails.numberOfPayments;
      const selectedCard = cards.find(card => card.id === selectedCardId);
      
      // Create payment plan object
      const plan = {
        id: `plan_${Date.now()}`,
        transactionId: selectedTransaction.id,
        cardId: selectedCardId,
        cardDetails: {
          brand: selectedCard.brand,
          last4: selectedCard.last4,
          exp_month: selectedCard.exp_month,
          exp_year: selectedCard.exp_year
        },
        amount: planAmount,
        totalAmount: selectedTransaction.amount,
        numberOfPayments: paymentPlanDetails.numberOfPayments,
        remainingPayments: paymentPlanDetails.numberOfPayments,
        startDate: paymentPlanDetails.startDate,
        nextPaymentDate: paymentPlanDetails.startDate,
        status: 'active',
        merchant: selectedTransaction.merchant,
        itemName: selectedTransaction.itemName || selectedTransaction.merchant,
        monthlyPayment: planAmount
      };

      // Get current user data
      const storedUserData = localStorage.getItem('userData');
      const userData = JSON.parse(storedUserData);

      // Initialize activePlans if it doesn't exist
      if (!userData.activePlans) {
        userData.activePlans = [];
      }

      // Add the new plan to active plans
      userData.activePlans.push(plan);

      // Update user data in localStorage
      localStorage.setItem('userData', JSON.stringify(userData));

      // Update transaction with payment plan
      setTransactions(transactions.map(t => 
        t.id === selectedTransaction.id 
          ? { ...t, paymentPlan: plan }
          : t
      ));

      setShowPaymentPlanModal(false);
      setSelectedTransaction(null);
      setSelectedCardId(null);
      setPaymentPlanDetails({
        numberOfPayments: 3,
        startDate: new Date().toISOString().split('T')[0]
      });

      // Show success notification
      setNotification({
        type: 'success',
        message: 'Payment plan created successfully'
      });
    } catch (err) {
      setError('Failed to create payment plan');
      console.error(err);
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  const handleTransactionSelect = async (transaction) => {
    setSelectedTransaction(transaction);
    setSelectedCard(null);
    try {
      const cards = await getAvailableCards(transaction.id);
      setAvailableCards(cards);
    } catch (err) {
      setError('Failed to load available cards');
      console.error(err);
    }
  };

  const handleCardSelect = (card) => {
    setSelectedCard(card);
  };

  const handleSwitchCard = async () => {
    if (!selectedTransaction || !selectedCard) return;

    try {
      await switchCard(selectedTransaction.id, selectedCard.id);
      setNotification({
        type: 'success',
        message: 'Card successfully switched for this transaction'
      });
      loadData(); // Reload transactions to show updated card
      setSelectedTransaction(null);
      setSelectedCard(null);
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to switch card'
      });
      console.error(err);
    }
  };

  if (loading) {
    return <div className="loading">Loading transactions...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="transactions-container">
      <Notification 
        notification={notification}
        onClose={handleCloseNotification}
      />
      <div className="transactions-header">
        <h2>Recent Transactions</h2>
        <button 
          className="add-card-btn"
          onClick={() => setShowAddCard(true)}
        >
          Add New Card
        </button>
      </div>

      {showAddCard && (
        <div className="add-card-form">
          <h3>Add New Card</h3>
          <form onSubmit={handleAddCard}>
            <div className="form-group">
              <label>Card Number</label>
              <input
                type="text"
                value={newCardData.number}
                onChange={(e) => setNewCardData({...newCardData, number: e.target.value})}
                placeholder="1234 5678 9012 3456"
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Expiry Month</label>
                <input
                  type="text"
                  value={newCardData.exp_month}
                  onChange={(e) => setNewCardData({...newCardData, exp_month: e.target.value})}
                  placeholder="MM"
                  maxLength="2"
                  required
                />
              </div>
              <div className="form-group">
                <label>Expiry Year</label>
                <input
                  type="text"
                  value={newCardData.exp_year}
                  onChange={(e) => setNewCardData({...newCardData, exp_year: e.target.value})}
                  placeholder="YY"
                  maxLength="2"
                  required
                />
              </div>
              <div className="form-group">
                <label>CVC</label>
                <input
                  type="text"
                  value={newCardData.cvc}
                  onChange={(e) => setNewCardData({...newCardData, cvc: e.target.value})}
                  placeholder="123"
                  maxLength="4"
                  required
                />
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="submit-btn">Add Card</button>
              <button type="button" className="cancel-btn" onClick={() => setShowAddCard(false)}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {showPaymentPlanModal && selectedTransaction && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Create Payment Plan</h3>
            <form onSubmit={handleSubmitPaymentPlan}>
              <div className="form-group">
                <label>Select Payment Method</label>
                <select
                  value={selectedCardId || ''}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  required
                  className="card-select"
                >
                  <option value="">Choose a card</option>
                  {cards.map(card => (
                    <option key={card.id} value={card.id}>
                      {card.brand.toUpperCase()} •••• {card.last4} (Expires {card.exp_month}/{card.exp_year})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Number of Payments</label>
                <select
                  value={paymentPlanDetails.numberOfPayments}
                  onChange={(e) => setPaymentPlanDetails({
                    ...paymentPlanDetails,
                    numberOfPayments: parseInt(e.target.value)
                  })}
                  required
                >
                  <option value="2">2 payments</option>
                  <option value="3">3 payments</option>
                  <option value="4">4 payments</option>
                  <option value="6">6 payments</option>
                  <option value="12">12 payments</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={paymentPlanDetails.startDate}
                  onChange={(e) => setPaymentPlanDetails({
                    ...paymentPlanDetails,
                    startDate: e.target.value
                  })}
                  required
                />
              </div>
              <div className="payment-summary">
                <p>Total Amount: ${selectedTransaction.amount.toFixed(2)}</p>
                <p>Payment Amount: ${(selectedTransaction.amount / paymentPlanDetails.numberOfPayments).toFixed(2)}</p>
                <p>Number of Payments: {paymentPlanDetails.numberOfPayments}</p>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Create Plan</button>
                <button type="button" className="cancel-btn" onClick={() => setShowPaymentPlanModal(false)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="transactions-list">
        {transactions.map(transaction => (
          <div 
            key={transaction.id} 
            className={`transaction-item ${selectedTransaction?.id === transaction.id ? 'selected' : ''}`}
            onClick={() => handleTransactionSelect(transaction)}
          >
            <div className="transaction-header">
              <div className="transaction-info">
                <h3>{transaction.merchant}</h3>
                <span className="transaction-date">
                  {new Date(transaction.date).toLocaleDateString()}
                </span>
              </div>
              <div className="transaction-amount">
                ${transaction.amount.toFixed(2)}
              </div>
            </div>

            <div className="transaction-details">
              <div className="transaction-status">
                Status: <span className={`status ${transaction.status.toLowerCase()}`}>
                  {transaction.status}
                </span>
              </div>

              {transaction.paymentPlan ? (
                <div className="payment-plan-info">
                  <h4>Payment Plan Details</h4>
                  <div className="plan-details">
                    <p>Number of Payments: {transaction.paymentPlan.numberOfPayments}</p>
                    <p>Payment Amount: ${transaction.paymentPlan.amount.toFixed(2)}</p>
                    <p>Start Date: {new Date(transaction.paymentPlan.startDate).toLocaleDateString()}</p>
                    <p>Status: <span className={`status ${transaction.paymentPlan.status}`}>
                      {transaction.paymentPlan.status}
                    </span></p>
                  </div>
                </div>
              ) : (
                <div className="payment-options">
                  <h4>Payment Options</h4>
                  <div className="cards-grid">
                    {cards.map(card => (
                      <div 
                        key={card.id}
                        className={`card-option ${selectedCard?.id === card.id ? 'selected' : ''}`}
                        onClick={() => handleCardSelect(card)}
                      >
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
                          className="create-plan-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCreatePaymentPlan(transaction, card.id);
                          }}
                        >
                          Create Payment Plan
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedTransaction && (
        <div className="card-selection-modal">
          <h3>Select a New Card</h3>
          <div className="cards-grid">
            {availableCards.map(card => (
              <div 
                key={card.id}
                className={`card-option ${selectedCard?.id === card.id ? 'selected' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleCardSelect(card);
                }}
              >
                <div className="card-brand">{card.brand}</div>
                <div className="card-last4">•••• {card.last4}</div>
                <div className="card-expiry">Expires {card.exp_month}/{card.exp_year}</div>
              </div>
            ))}
          </div>
          <div className="modal-actions">
            <button 
              className="cancel-btn"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedTransaction(null);
                setSelectedCard(null);
              }}
            >
              Cancel
            </button>
            <button 
              className="switch-btn"
              disabled={!selectedCard}
              onClick={handleSwitchCard}
            >
              Switch Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions; 