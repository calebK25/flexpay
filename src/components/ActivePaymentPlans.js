import React, { useState, useEffect } from 'react';
import { openCardSwitcher } from '../utils/knotSDK';
import { RiskAssessment } from '../utils/riskAssessment';
import './ActivePaymentPlans.css';
import CardManager from './CardManager';
import Notification from './Notification';

const ActivePaymentPlans = () => {
  const [activePlans, setActivePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showCardManager, setShowCardManager] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [creditLimit, setCreditLimit] = useState(10000);
  const [riskAssessment] = useState(() => new RiskAssessment());
  const [isCreditLimitUpdating, setIsCreditLimitUpdating] = useState(false);
  const [creditLimitChange, setCreditLimitChange] = useState(null);

  useEffect(() => {
    loadActivePlans();
    const savedLimit = localStorage.getItem('creditLimit');
    if (savedLimit) {
      setCreditLimit(parseInt(savedLimit));
    }
  }, []);

  const loadActivePlans = () => {
    try {
      const plans = JSON.parse(localStorage.getItem('activePaymentPlans') || '[]');
      setActivePlans(plans);
      
      // Update risk assessment with payment history
      plans.forEach(plan => {
        if (plan.payments) {
          plan.payments.forEach(payment => {
            riskAssessment.updatePaymentHistory(payment);
          });
        }
      });
    } catch (err) {
      setError('Failed to load payment plans');
      console.error('Error loading plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateCreditLimit = async (transactionData) => {
    try {
      setIsCreditLimitUpdating(true);
      
      // Calculate risk score using the risk assessment model
      const riskScore = await riskAssessment.calculateRiskScore('test-user');
      
      // Adjust credit limit based on risk score
      const riskResult = await riskAssessment.adjustCreditLimit('test-user');
      
      // Determine if the limit increased or decreased
      const change = riskResult.newCreditLimit > creditLimit ? 'increased' : 'decreased';
      
      // Update all states simultaneously
      Promise.all([
        new Promise(resolve => {
          setCreditLimitChange(change);
          setCreditLimit(riskResult.newCreditLimit);
          localStorage.setItem('creditLimit', riskResult.newCreditLimit.toString());
          resolve();
        })
      ]);
      
      // Reset the change indicator after animation
      setTimeout(() => {
        setCreditLimitChange(null);
        setIsCreditLimitUpdating(false);
      }, 1000);
      
      return riskResult;
    } catch (error) {
      console.error('Error updating credit limit:', error);
      setIsCreditLimitUpdating(false);
      throw error;
    }
  };

  const handleCardSelect = async (cardId) => {
    try {
      // Get the selected card from localStorage
      const cards = JSON.parse(localStorage.getItem('paymentCards') || '[]');
      const selectedCard = cards.find(card => card.id === cardId);

      if (!selectedCard) {
        throw new Error('Selected card not found');
      }

      // Process payment
      const updatedPlans = activePlans.map(p => {
        if (p.id === selectedPlan.id) {
          const payment = {
            date: new Date().toISOString(),
            amount: p.monthlyPayment,
            status: 'completed',
            card: {
              lastFour: selectedCard.lastFour,
              brand: selectedCard.brand
            }
          };

          // Update payment history in risk assessment
          riskAssessment.updatePaymentHistory(payment);

          return {
            ...p,
            lastPayment: payment.date,
            lastPaymentCard: {
              lastFour: selectedCard.lastFour,
              brand: selectedCard.brand
            },
            nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
            payments: [...(p.payments || []), payment]
          };
        }
        return p;
      });

      // Update all states simultaneously
      const [riskResult] = await Promise.all([
        updateCreditLimit({
          missedPayments: updatedPlans.filter(p => p.status === 'missed').length,
          totalPayments: updatedPlans.length,
          averageTransactionAmount: updatedPlans.reduce((sum, p) => sum + p.amount, 0) / updatedPlans.length,
          maxTransactionAmount: Math.max(...updatedPlans.map(p => p.amount)),
          accountAge: 1,
          creditUtilization: updatedPlans.reduce((sum, p) => sum + p.amount, 0) / creditLimit
        }),
        new Promise(resolve => {
          setActivePlans(updatedPlans);
          localStorage.setItem('activePaymentPlans', JSON.stringify(updatedPlans));
          resolve();
        })
      ]);
      
      setShowCardManager(false);
      
      setNotification({
        type: 'success',
        message: `Payment processed successfully. Your credit limit has been adjusted to $${riskResult.newCreditLimit.toLocaleString()} (${riskResult.riskLevel} risk)`
      });
    } catch (err) {
      setNotification({
        type: 'error',
        message: 'Failed to process payment'
      });
      console.error('Payment error:', err);
    }
  };

  const handlePayment = async (plan) => {
    try {
      setLoading(true);
      setSelectedPlan(plan);
      setShowCardManager(true);
    } catch (error) {
      console.error('Error initiating payment:', error);
      setNotification({
        type: 'error',
        message: 'Failed to initiate payment. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMissedPayment = async (plan) => {
    try {
      setLoading(true);
      
      // Create payment record
      const payment = {
        date: new Date().toISOString(),
        amount: plan.monthlyPayment,
        status: 'missed',
        dueDate: plan.nextPayment
      };

      // Update payment history in risk assessment
      riskAssessment.updatePaymentHistory(payment);
      
      // Update the plan status
      const updatedPlans = activePlans.map(p => {
        if (p.id === plan.id) {
          return {
            ...p,
            status: 'missed',
            missedPayments: (p.missedPayments || 0) + 1,
            payments: [...(p.payments || []), payment]
          };
        }
        return p;
      });

      // Update all states simultaneously
      const [riskResult] = await Promise.all([
        updateCreditLimit({
          missedPayments: updatedPlans.filter(p => p.status === 'missed').length,
          totalPayments: updatedPlans.length,
          averageTransactionAmount: updatedPlans.reduce((sum, p) => sum + p.amount, 0) / updatedPlans.length,
          maxTransactionAmount: Math.max(...updatedPlans.map(p => p.amount)),
          accountAge: 1,
          creditUtilization: updatedPlans.reduce((sum, p) => sum + p.amount, 0) / creditLimit
        }),
        new Promise(resolve => {
          setActivePlans(updatedPlans);
          localStorage.setItem('activePaymentPlans', JSON.stringify(updatedPlans));
          resolve();
        })
      ]);

      setNotification({
        type: 'warning',
        message: `Payment marked as missed. Your credit limit has been adjusted to $${riskResult.newCreditLimit.toLocaleString()} (${riskResult.riskLevel} risk)`
      });
    } catch (error) {
      console.error('Error marking payment as missed:', error);
      setNotification({
        type: 'error',
        message: 'Failed to mark payment as missed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const closeNotification = () => {
    setNotification(null);
  };

  if (loading) {
    return <div className="loading">Loading payment plans...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="active-payment-plans">
      <div className="credit-limit-info">
        <h3>Current Credit Limit</h3>
        <p className={`credit-amount ${creditLimitChange === 'increased' ? 'updated' : creditLimitChange === 'decreased' ? 'decreased' : ''}`}>
          ${creditLimit.toLocaleString()}
        </p>
        {isCreditLimitUpdating && (
          <div className="credit-limit-updating">
            Updating credit limit...
          </div>
        )}
      </div>
      <h2>Active Payment Plans</h2>
      {activePlans.length === 0 ? (
        <p>No active payment plans</p>
      ) : (
        <div className="plans-grid">
          {activePlans.map(plan => (
            <div key={plan.id} className="plan-card">
              <h3>{plan.merchant}</h3>
              <div className="plan-details">
                <p>Total Amount: ${plan.amount}</p>
                <p>Monthly Payment: ${plan.monthlyPayment}</p>
                <p>Next Payment: {new Date(plan.nextPayment).toLocaleDateString()}</p>
                {plan.lastPaymentCard && (
                  <p className="last-payment">
                    Last Payment: {plan.lastPaymentCard.brand} •••• {plan.lastPaymentCard.lastFour}
                  </p>
                )}
                <p className={`status ${plan.status}`}>
                  Status: {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
                </p>
              </div>
              <div className="plan-actions">
                <button
                  className="pay-btn"
                  onClick={() => handlePayment(plan)}
                  disabled={plan.status === 'completed'}
                >
                  Pay
                </button>
                <button
                  className="missed-btn"
                  onClick={() => handleMissedPayment(plan)}
                >
                  Mark as Missed
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCardManager && (
        <CardManager
          onSelect={handleCardSelect}
          onClose={() => setShowCardManager(false)}
        />
      )}

      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={closeNotification}
        />
      )}
    </div>
  );
};

export default ActivePaymentPlans; 