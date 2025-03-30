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
  const [notification, setNotification] = useState(null);
  const [showAddCard, setShowAddCard] = useState(false);
  const [userCards, setUserCards] = useState([]);
  const [supportedMerchants, setSupportedMerchants] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentPlans, setShowPaymentPlans] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Payment plan options
  const paymentPlans = [
    { id: 'full', name: 'Pay in Full', months: 1, interestRate: 0 },
    { id: '3month', name: '3 Month Plan', months: 3, interestRate: 5.99 },
    { id: '6month', name: '6 Month Plan', months: 6, interestRate: 7.99 },
    { id: '12month', name: '12 Month Plan', months: 12, interestRate: 9.99 }
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

  const handlePayClick = (transaction) => {
    setSelectedTransaction(transaction);
    setShowPaymentPlans(true);
  };

  const handlePaymentPlanSelect = async (plan) => {
    try {
      setLoading(true);
      
      // Calculate monthly payment amount
      const monthlyPayment = (selectedTransaction.amount / plan.months).toFixed(2);
      
      // Create a new payment plan
      const newPlan = {
        id: `plan_${Math.random().toString(36).substr(2, 9)}`,
        merchant: selectedTransaction.merchant,
        amount: selectedTransaction.amount,
        monthlyPayment: parseFloat(monthlyPayment),
        payments: 0,
        totalPayments: plan.months,
        dueDate: new Date().toISOString(),
        nextPaymentDate: new Date().toISOString(),
        status: 'active',
        apr: plan.interestRate,
        planName: plan.name
      };

      // Get existing plans from localStorage
      const existingPlans = JSON.parse(localStorage.getItem('activePaymentPlans') || '[]');
      
      // Add the new plan
      const updatedPlans = [...existingPlans, newPlan];
      
      // Save to localStorage
      localStorage.setItem('activePaymentPlans', JSON.stringify(updatedPlans));

      setNotification({
        type: 'success',
        message: `Payment plan created: ${plan.name}`
      });
      setShowPaymentPlans(false);
    } catch (error) {
      setError('Failed to create payment plan');
      console.error('Error creating payment plan:', error);
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
                onClick={() => handleOpenCardSwitcher(transaction.merchant_id)}
                disabled={loading}
              >
                Switch Card
              </button>
              <button 
                className="pay-btn"
                onClick={() => handlePayClick(transaction)}
                disabled={loading}
              >
                Pay
              </button>
            </div>
          </div>
        ))}
      </div>

      {showPaymentPlans && selectedTransaction && (
        <div className="payment-plans-modal">
          <div className="modal-content">
            <h2>Select Payment Plan</h2>
            <p>Amount: ${selectedTransaction.amount.toFixed(2)}</p>
            <div className="payment-plans-grid">
              {paymentPlans.map((plan) => {
                const monthlyPayment = (selectedTransaction.amount / plan.months).toFixed(2);
                return (
                  <div 
                    key={plan.id} 
                    className="payment-plan-card"
                    onClick={() => handlePaymentPlanSelect(plan)}
                  >
                    <h3>{plan.name}</h3>
                    <div className="plan-details">
                      <p>${monthlyPayment}/month</p>
                      <p>{plan.months} payments</p>
                      <p>APR: {plan.interestRate}%</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button 
              className="close-modal-btn"
              onClick={() => setShowPaymentPlans(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={handleCloseNotification}
        />
      )}

      {showAddCard && (
        <AddCard
          onClose={() => setShowAddCard(false)}
          onAddCard={handleAddCard}
        />
      )}
    </div>
  );
};

export default Transactions;
