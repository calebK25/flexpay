import React, { useState, useEffect } from 'react';
import { getPlaidTransactions } from '../utils/plaidUtils';
import { getAvailableCards, switchCard } from '../utils/knotUtils';
import '../components/Transactions.css';
import Notification from '../components/Notification';
import AddCard from '../components/AddCard';
import { knotSDK } from '../utils/knotSDK';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [availableCards, setAvailableCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardSelection, setShowCardSelection] = useState(false);
  const [notification, setNotification] = useState(null);
  const [paymentPlan, setPaymentPlan] = useState(null);
  const [showPaymentPlanModal, setShowPaymentPlanModal] = useState(false);
  const [showAddCard, setShowAddCard] = useState(false);
  const [userCards, setUserCards] = useState([]);
  const [supportedMerchants, setSupportedMerchants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Payment plan options with monthly payment information
  const paymentPlanOptions = [
    { 
      id: 'full', 
      name: 'Pay in Full', 
      payments: 1,
      apr: '0%',
      description: 'Pay the full amount immediately'
    },
    { 
      id: '3month', 
      name: '3 Month Plan', 
      payments: 3,
      apr: '5.99%',
      description: 'Split into 3 monthly payments'
    },
    { 
      id: '6month', 
      name: '6 Month Plan', 
      payments: 6,
      apr: '7.99%',
      description: 'Split into 6 monthly payments'
    },
    { 
      id: '12month', 
      name: '12 Month Plan', 
      payments: 12,
      apr: '9.99%',
      description: 'Split into 12 monthly payments'
    }
  ];

  useEffect(() => {
    fetchTransactions();
    // Load saved cards from localStorage
    const savedCards = JSON.parse(localStorage.getItem('userCards') || '[]');
    setUserCards(savedCards);
    // Load supported merchants
    setSupportedMerchants(knotSDK.getSupportedMerchants());
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const data = await getPlaidTransactions();
      setTransactions(data);
    } catch (err) {
      setError('Failed to fetch transactions');
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = (newCard) => {
    const updatedCards = [...userCards, newCard];
    setUserCards(updatedCards);
    localStorage.setItem('userCards', JSON.stringify(updatedCards));
    setNotification({
      type: 'success',
      message: 'Card added successfully!'
    });
  };

  const handleTransactionClick = async (transaction) => {
    try {
      setSelectedTransaction(transaction);
      // Combine user's saved cards with available cards
      const allCards = [...userCards, ...(await getAvailableCards(transaction.id))];
      setAvailableCards(allCards);
      setShowCardSelection(true);
      setShowPaymentPlanModal(true);
    } catch (err) {
      setError('Failed to fetch available cards');
      console.error('Error fetching available cards:', err);
    }
  };

  const handleCardSelect = (card) => {
    setSelectedCard(card);
  };

  const handlePaymentPlanSelect = (plan) => {
    setPaymentPlan(plan);
  };

  const handleSwitchCard = async () => {
    if (!selectedTransaction || !selectedCard || !paymentPlan) return;

    try {
      await switchCard(selectedTransaction.id, selectedCard.id);
      
      // Calculate monthly payment amount
      const monthlyPayment = paymentPlan.payments === 1 
        ? selectedTransaction.amount 
        : (selectedTransaction.amount / paymentPlan.payments).toFixed(2);

      // Create a new payment plan
      const newPlan = {
        id: `plan_${Math.random().toString(36).substr(2, 9)}`,
        merchant: selectedTransaction.merchant,
        amount: selectedTransaction.amount,
        monthlyPayment: parseFloat(monthlyPayment),
        payments: 0,
        totalPayments: paymentPlan.payments,
        cardBrand: selectedCard.brand,
        cardLastFour: selectedCard.last_four,
        dueDate: new Date().toISOString(),
        nextPaymentDate: new Date().toISOString(),
        status: 'pending',
        apr: paymentPlan.apr
      };

      // Get existing plans from localStorage
      const existingPlans = JSON.parse(localStorage.getItem('activePaymentPlans') || '[]');
      
      // Add the new plan
      const updatedPlans = [...existingPlans, newPlan];
      
      // Save to localStorage
      localStorage.setItem('activePaymentPlans', JSON.stringify(updatedPlans));

      // Update user data with new payment plan
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (!userData.paymentHistory) {
        userData.paymentHistory = [];
      }
      if (!userData.riskHistory) {
        userData.riskHistory = [{
          date: new Date().toISOString(),
          score: 0.5 // Initial risk score
        }];
      }
      localStorage.setItem('userData', JSON.stringify(userData));

      setNotification({
        type: 'success',
        message: `Card switched successfully! Payment plan: ${paymentPlan.name}`
      });
      setShowCardSelection(false);
      setShowPaymentPlanModal(false);
      fetchTransactions(); // Refresh transactions
    } catch (err) {
      setError('Failed to switch card');
      console.error('Error switching card:', err);
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  const handleOpenCardSwitcher = async (merchantId) => {
    try {
      setError(null);
      setLoading(true);
      await knotSDK.openCardSwitcher(merchantId);
    } catch (error) {
      console.error('Error opening card switcher:', error);
      setError('Failed to open card switcher. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTransactionLink = async (merchantId) => {
    try {
      setError(null);
      setLoading(true);
      await knotSDK.openTransactionLink(merchantId);
    } catch (error) {
      console.error('Error opening transaction link:', error);
      setError('Failed to open transaction link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading transactions...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="transactions-container">
      <div className="transactions-header">
        <h1>Transactions</h1>
        <div className="header-actions">
          <button 
            className="add-card-btn"
            onClick={() => setShowAddCard(true)}
          >
            Add Card
          </button>
        </div>
      </div>

      <div className="transactions-list">
        {transactions.map((transaction) => (
          <div
            key={transaction.id}
            className="transaction-card"
            onClick={() => handleTransactionClick(transaction)}
          >
            <div className="transaction-info">
              <h3>{transaction.merchant}</h3>
              <p className="transaction-date">
                {new Date(transaction.date).toLocaleDateString()}
              </p>
              </div>
            <div className="transaction-amount">
              ${transaction.amount.toFixed(2)}
            </div>
            <div className="transaction-actions">
              <button 
                className="card-switch-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCardSwitcher(transaction.merchant_id);
                }}
                disabled={loading}
              >
                Switch Card
              </button>
              <button 
                className="transaction-link-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenTransactionLink(transaction.merchant_id);
                }}
                disabled={loading}
              >
                Link Transaction
            </button>
        </div>
          </div>
        ))}
      </div>

      {showCardSelection && (
        <div className="card-selection-modal">
          <div className="modal-content">
            <h2>Select Payment Method</h2>
            <div className="cards-grid">
              {availableCards.map((card) => (
                <div
                  key={card.id}
                  className={`card-option ${selectedCard?.id === card.id ? 'selected' : ''}`}
                  onClick={() => setSelectedCard(card)}
                >
                  <div className="card-brand">{card.brand}</div>
                  <div className="card-number">•••• {card.last_four}</div>
                  <div className="card-expiry">Expires {card.expiry}</div>
                </div>
              ))}
      </div>

            <div className="payment-plan-section">
              <h3>Select Payment Plan</h3>
              <div className="payment-plan-grid">
                {paymentPlanOptions.map((plan) => (
                  <div
                    key={plan.id}
                    className={`payment-plan-option ${paymentPlan?.id === plan.id ? 'selected' : ''}`}
                    onClick={() => handlePaymentPlanSelect(plan)}
                  >
                    <div className="plan-name">{plan.name}</div>
                    <div className="plan-payments">
                      {plan.payments} payment{plan.payments > 1 ? 's' : ''}
          </div>
                    <div className="plan-apr">
                      <span className="apr-label">APR:</span>
                      <span className="apr-value">{plan.apr}</span>
          </div>
                    <div className="plan-description">{plan.description}</div>
          </div>
                ))}
          </div>
        </div>

            <div className="modal-actions">
              <button
                className="switch-card-btn"
                onClick={handleSwitchCard}
                disabled={!selectedCard || !paymentPlan}
              >
                Confirm Payment Method
              </button>
              <button 
                className="cancel-btn" 
                onClick={() => {
                  setShowCardSelection(false);
                  setShowPaymentPlanModal(false);
                }}
              >
                Cancel
              </button>
                </div>
              </div>
        </div>
      )}

      {showAddCard && (
        <AddCard
          onClose={() => setShowAddCard(false)}
          onAddCard={handleAddCard}
        />
      )}

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Transactions;
