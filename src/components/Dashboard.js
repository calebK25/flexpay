import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import RiskTracker from './RiskTracker';
import LimitHistoryGraph from './LimitHistoryGraph';
import Notification from './Notification';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limitChange, setLimitChange] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      const data = JSON.parse(storedUserData);
      // Initialize payment history if it doesn't exist
      if (!data.paymentHistory) {
        data.paymentHistory = [];
      }
      // Initialize risk history if it doesn't exist
      if (!data.riskHistory) {
        data.riskHistory = [{
          date: new Date().toISOString(),
          score: calculateInitialRiskScore(data)
        }];
      }
      // Initialize spending limit if it doesn't exist
      if (!data.spendingLimit) {
        data.spendingLimit = calculateInitialSpendingLimit(data);
      }
      // Initialize limit history if it doesn't exist
      if (!data.limitHistory) {
        data.limitHistory = [{
          date: new Date().toISOString(),
          limit: data.spendingLimit
        }];
      }
      setUserData(data);
      localStorage.setItem('userData', JSON.stringify(data));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const calculateInitialRiskScore = (data) => {
    // Base risk score calculation
    let riskScore = 0;
    
    // Credit score factor (weight: 30%)
    if (data.creditScore < 580) riskScore += 0.3;
    else if (data.creditScore < 670) riskScore += 0.2;
    else if (data.creditScore < 740) riskScore += 0.1;
    
    // Income factor (weight: 25%)
    if (data.annualIncome < 30000) riskScore += 0.25;
    else if (data.annualIncome < 50000) riskScore += 0.15;
    else if (data.annualIncome < 75000) riskScore += 0.05;
    
    // Employment length factor (weight: 15%)
    if (data.employmentLength < 1) riskScore += 0.15;
    else if (data.employmentLength < 3) riskScore += 0.1;
    else if (data.employmentLength < 5) riskScore += 0.05;
    
    // Debt-to-income ratio factor (weight: 30%)
    if (data.debtToIncomeRatio > 0.5) riskScore += 0.3;
    else if (data.debtToIncomeRatio > 0.4) riskScore += 0.2;
    else if (data.debtToIncomeRatio > 0.3) riskScore += 0.1;
    
    return Math.min(Math.max(riskScore, 0), 1);
  };

  const calculateInitialSpendingLimit = (data) => {
    // Base spending limit calculation based on annual income
    let baseLimit = data.annualIncome * 0.2; // 20% of annual income

    // Adjust based on credit score
    if (data.creditScore >= 750) baseLimit *= 1.5;
    else if (data.creditScore >= 700) baseLimit *= 1.2;
    else if (data.creditScore < 600) baseLimit *= 0.5;

    // Adjust based on employment length
    if (data.employmentLength >= 5) baseLimit *= 1.2;
    else if (data.employmentLength < 1) baseLimit *= 0.7;

    // Adjust based on debt-to-income ratio
    if (data.debtToIncomeRatio > 0.4) baseLimit *= 0.8;

    return Math.round(baseLimit);
  };

  const updateSpendingLimit = (newRiskScore) => {
    const oldLimit = userData.spendingLimit;
    let newLimit = oldLimit;
    let reason = '';

    // Only update limit if risk score changes significantly
    if (newRiskScore < 0.3) { // Low risk
      // 20% chance to increase limit
      if (Math.random() < 0.2) {
        const increase = Math.floor(oldLimit * 0.05); // 5% increase
        newLimit = oldLimit + increase;
        reason = "Excellent payment history and low risk score";
      }
    } else if (newRiskScore > 0.7) { // High risk
      // Always decrease limit for high risk
      const decrease = Math.floor(oldLimit * 0.15); // 15% decrease
      newLimit = oldLimit - decrease;
      reason = "Recent missed payments and high risk score";
    }

    if (newLimit !== oldLimit) {
      const percentageChange = ((newLimit - oldLimit) / oldLimit) * 100;
      const limitChangeData = {
        amount: newLimit - oldLimit,
        percentage: percentageChange,
        reason: reason
      };
      setLimitChange(limitChangeData);

      // Update user data
      const updatedUserData = {
        ...userData,
        spendingLimit: newLimit,
        limitHistory: [
          ...userData.limitHistory,
          {
            date: new Date().toISOString(),
            limit: newLimit,
            change: limitChangeData
          }
        ]
      };
      setUserData(updatedUserData);
      localStorage.setItem('userData', JSON.stringify(updatedUserData));

      // Clear notification after 8 seconds
      setTimeout(() => {
        setLimitChange(null);
      }, 8000);
    }
  };

  const markPaymentAsPaid = (paymentId) => {
    if (userData) {
      const updatedUserData = { ...userData };
      const payment = updatedUserData.activePlans.find(plan => plan.id === paymentId);
      
      if (payment) {
        // Update payment status
        payment.status = 'paid';
        
        // Add to payment history
        updatedUserData.paymentHistory.push({
          id: paymentId,
          amount: payment.amount,
          dueDate: payment.dueDate,
          status: 'paid',
          datePaid: new Date().toISOString()
        });

        // Update risk score
        const newRiskScore = Math.max(
          userData.riskHistory[userData.riskHistory.length - 1].score - 0.05,
          0
        );
        
        updatedUserData.riskHistory.push({
          date: new Date().toISOString(),
          score: newRiskScore
        });

        setUserData(updatedUserData);
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        // Update spending limit based on new risk score
        updateSpendingLimit(newRiskScore);
      }
    }
  };

  const markPaymentAsMissed = (paymentId) => {
    if (userData) {
      const updatedUserData = { ...userData };
      const payment = updatedUserData.activePlans.find(plan => plan.id === paymentId);
      
      if (payment) {
        // Update payment status
        payment.status = 'missed';
        
        // Add to payment history
        updatedUserData.paymentHistory.push({
          id: paymentId,
          amount: payment.amount,
          dueDate: payment.dueDate,
          status: 'missed',
          dateMissed: new Date().toISOString()
        });

        // Update risk score (increase by 20% for missed payment)
        const newRiskScore = Math.min(
          userData.riskHistory[userData.riskHistory.length - 1].score + 0.2,
          1
        );
        
        updatedUserData.riskHistory.push({
          date: new Date().toISOString(),
          score: newRiskScore
        });

        setUserData(updatedUserData);
        localStorage.setItem('userData', JSON.stringify(updatedUserData));
        
        // Update spending limit based on new risk score
        updateSpendingLimit(newRiskScore);
      }
    }
  };

  const handleCloseNotification = () => {
    setNotification(null);
  };

  if (!userData) return null;

  const activePlans = userData.activePlans.filter(plan => plan.status === 'active');
  const completedPlans = userData.activePlans.filter(plan => plan.status === 'completed');
  const currentRiskScore = userData.riskHistory[userData.riskHistory.length - 1].score;
  const spendingLimit = userData.spendingLimit;

  const getRiskLevel = (score) => {
    if (score < 0.3) return { color: '#22c55e', label: 'Low Risk' };
    if (score < 0.7) return { color: '#eab308', label: 'Medium Risk' };
    return { color: '#ef4444', label: 'High Risk' };
  };

  const riskLevel = getRiskLevel(currentRiskScore);

  return (
    <div className="dashboard-container">
      <Notification 
        notification={notification}
        onClose={handleCloseNotification}
      />
      <div className="dashboard-header">
        <h1>Welcome back, {userData?.name || 'User'}</h1>
        <Link to="/transactions" className="transactions-btn">
          View Transactions
        </Link>
        <div className="dashboard-stats">
          <div className="stat-item">
            <p className="stat-label">Your spending limit</p>
            <div className="limit-container">
              <h2 className="stat-value">${userData.spendingLimit.toLocaleString()}</h2>
            </div>
          </div>
          <div className="stat-item">
            <p className="stat-label">Risk Assessment</p>
            <div className="risk-score-container">
              <h2 className="stat-value" style={{ color: riskLevel.color }}>
                {(currentRiskScore * 100).toFixed(0)}
              </h2>
              <span className="risk-label" style={{ backgroundColor: riskLevel.color }}>
                {riskLevel.label}
              </span>
              <Link to="/financial-info" className="tooltip-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        <div className="risk-score-section">
          <div className="risk-score-header">
            <div className="section-title">
              <h2>Risk Score History</h2>
              <p className="section-description">
                Track your risk score changes over time and see how your payment behavior affects it
              </p>
            </div>
          </div>
          <div className="risk-tracker">
            <div className="risk-metrics">
              <div className="metric-item">
                <span className="metric-label">Payment Success Rate</span>
                <span className="metric-value">
                  {((userData.paymentHistory.filter(p => p.status === 'paid').length / userData.paymentHistory.length) * 100 || 100).toFixed(1)}%
                </span>
              </div>
              <div className="metric-item">
                <span className="metric-label">Total Payments</span>
                <span className="metric-value">{userData.paymentHistory.length}</span>
              </div>
              <div className="metric-item">
                <span className="metric-label">On-time Payments</span>
                <span className="metric-value success">
                  {userData.paymentHistory.filter(p => p.status === 'paid').length}
                </span>
              </div>
            </div>
            <RiskTracker 
              riskHistory={userData.riskHistory} 
              paymentHistory={userData.paymentHistory}
            />
          </div>
        </div>

        <div className="limit-history-section">
          <div className="section-title">
            <h2>Spending Limit History</h2>
            <p className="section-description">
              View how your spending limit has changed over time based on your risk assessment
            </p>
          </div>
          <div className="limit-history-container">
            <LimitHistoryGraph limitHistory={userData.limitHistory} />
            {limitChange && (
              <div className={`limit-change ${limitChange.amount > 0 ? 'positive' : 'negative'}`}>
                <div className="limit-change-header">
                  <span className="limit-change-title">
                    {limitChange.amount > 0 ? 'Limit Increased' : 'Limit Decreased'}
                  </span>
                  <span className="limit-change-amount">
                    {limitChange.amount > 0 ? '+' : ''}{limitChange.amount.toLocaleString()}
                  </span>
                </div>
                <span className="limit-change-percentage">
                  {limitChange.percentage > 0 ? '+' : ''}{limitChange.percentage.toFixed(1)}%
                </span>
                <span className="limit-change-reason">{limitChange.reason}</span>
              </div>
            )}
          </div>
        </div>

        <div className="active-plans-section">
          <div className="section-header">
            <h2>Active Payment Plans</h2>
            <p className="section-description">
              Manage your current payment plans and track their status
            </p>
          </div>
          {activePlans.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 7H4C2.89543 7 2 7.89543 2 9V19C2 20.1046 2.89543 21 4 21H20C21.1046 21 22 20.1046 22 19V9C22 7.89543 21.1046 7 20 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M16 21V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>No active payment plans</p>
            </div>
          ) : (
            <div className="plans-grid">
              {activePlans.map(plan => (
                <div key={plan.id} className="plan-card">
                  <div className="plan-header">
                    <h3>{plan.itemName}</h3>
                    <span className="status">Active</span>
                  </div>
                  <div className="plan-details">
                    <div className="detail-item">
                      <span className="detail-label">Monthly Payment</span>
                      <span className="detail-value">${plan.monthlyPayment.toFixed(2)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Remaining Payments</span>
                      <span className="detail-value">{plan.remainingPayments}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Next Payment</span>
                      <span className="detail-value">{new Date(plan.nextPaymentDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="button-group">
                    <button 
                      onClick={() => markPaymentAsPaid(plan.id)}
                      className="btn-primary"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Mark as Paid
                    </button>
                    <button 
                      onClick={() => markPaymentAsMissed(plan.id)}
                      className="btn-danger"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Mark as Missed
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {completedPlans.length > 0 && (
          <div className="completed-plans-section">
            <h2>Completed Payment Plans</h2>
            <div className="plans-grid">
              {completedPlans.map(plan => (
                <div key={plan.id} className="plan-card completed">
                  <div className="plan-header">
                    <h3>{plan.itemName}</h3>
                    <span className="status completed">Completed</span>
                  </div>
                  <div className="plan-details">
                    <p>Monthly Payment: ${plan.monthlyPayment.toFixed(2)}</p>
                    <p>Total Payments: {plan.totalPayments}</p>
                    <p>Completed On: {new Date(plan.nextPaymentDate).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 