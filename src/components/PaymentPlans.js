import React, { useState } from 'react';
import './PaymentPlans.css';

const PaymentPlans = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  productPrice,
  userData,
  installmentPlans = [
    { months: 3, interestRate: 0, creditIncrease: 5 },
    { months: 6, interestRate: 2.5, creditIncrease: 10 },
    { months: 12, interestRate: 4.9, creditIncrease: 15 }
  ]
}) => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  if (!isOpen) return null;

  const calculateMonthlyPayment = (months, interestRate) => {
    const totalAmount = productPrice * (1 + interestRate / 100);
    return (totalAmount / months).toFixed(2);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleConfirm = () => {
    if (selectedPlan) {
      onConfirm(selectedPlan);
      onClose();
    }
  };

  const isEligibleForCreditIncrease = () => {
    if (!userData) return false;
    
    const hasGoodPaymentHistory = userData.missedPayments === 0;
    const hasCompletedPlans = userData.completedPlans && userData.completedPlans.length > 0;
    
    return hasGoodPaymentHistory && hasCompletedPlans;
  };

  const calculatePotentialCreditLimit = (currentLimit, increasePercentage) => {
    return currentLimit * (1 + increasePercentage / 100);
  };

  return (
    <div className="payment-plans-modal" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="close-modal-btn" onClick={onClose}>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2>Choose Your Payment Plan</h2>
        
        {isEligibleForCreditIncrease() && (
          <div className="credit-increase-banner">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <p>Congratulations! You're eligible for credit increases with good payment history</p>
          </div>
        )}

        <div className="payment-plans-grid">
          {installmentPlans.map((plan) => {
            const monthlyPayment = calculateMonthlyPayment(plan.months, plan.interestRate);
            const isSelected = selectedPlan?.months === plan.months;
            const potentialCreditLimit = isEligibleForCreditIncrease() 
              ? calculatePotentialCreditLimit(userData?.spendingLimit || 0, plan.creditIncrease)
              : 0;

            return (
              <div
                key={plan.months}
                className={`payment-plan-card ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedPlan(plan)}
              >
                <h3>{plan.months} Monthly Payments</h3>
                <div className="plan-details">
                  <p className="monthly-amount">
                    {formatCurrency(monthlyPayment)}/mo
                  </p>
                  <p className={`interest-rate ${plan.interestRate === 0 ? 'zero' : ''}`}>
                    {plan.interestRate === 0 ? (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="16" height="16">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Interest-free
                      </>
                    ) : (
                      `${plan.interestRate}% APR`
                    )}
                  </p>
                  <p className="payments-count">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {plan.months} monthly payments
                  </p>
                  {isEligibleForCreditIncrease() && (
                    <div className="credit-increase-info">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <div>
                        <p>Credit increase after completion</p>
                        <p className="potential-limit">Up to {formatCurrency(potentialCreditLimit)}</p>
                        <p className="increase-percentage">+{plan.creditIncrease}% increase</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {selectedPlan && (
          <div className="plan-summary">
            <h3>Payment Summary</h3>
            <div className="summary-details">
              <div className="summary-item">
                <span className="summary-label">Purchase Amount</span>
                <span className="summary-value">{formatCurrency(productPrice)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Monthly Payment</span>
                <span className="summary-value">
                  {formatCurrency(calculateMonthlyPayment(selectedPlan.months, selectedPlan.interestRate))}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Number of Payments</span>
                <span className="summary-value">{selectedPlan.months} months</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Interest Rate</span>
                <span className="summary-value">
                  {selectedPlan.interestRate === 0 ? 'Interest-free' : `${selectedPlan.interestRate}% APR`}
                </span>
              </div>
              {isEligibleForCreditIncrease() && (
                <div className="summary-item credit-increase">
                  <span className="summary-label">Potential Credit Limit After Completion</span>
                  <span className="summary-value">
                    {formatCurrency(calculatePotentialCreditLimit(userData?.spendingLimit || 0, selectedPlan.creditIncrease))}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <button 
          className="confirm-btn" 
          onClick={handleConfirm}
          disabled={!selectedPlan}
        >
          Confirm Payment Plan
        </button>
      </div>
    </div>
  );
};

export default PaymentPlans; 