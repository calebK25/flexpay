import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import RiskTracker from './RiskTracker';
import LimitHistoryGraph from './LimitHistoryGraph';
import Notification from './Notification';
import { getPlaidTransactions } from '../utils/plaidUtils';
import { getLinkedCards, linkCard } from '../utils/knotUtils';
import ActivePaymentPlans from './ActivePaymentPlans';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limitChange, setLimitChange] = useState(null);
  const [notification, setNotification] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activePaymentPlans, setActivePaymentPlans] = useState([]);
  const [activePlans, setActivePlans] = useState([]);
  const [paymentHistory, setPaymentHistory] = useState([]);

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

  useEffect(() => {
    fetchTransactions();
    // Load active payment plans from localStorage
    const savedPlans = JSON.parse(localStorage.getItem('activePaymentPlans') || '[]');
    setActivePaymentPlans(savedPlans);
  }, []);

  useEffect(() => {
    // Load active plans and payment history
    const plans = JSON.parse(localStorage.getItem('activePaymentPlans') || '[]');
    const history = JSON.parse(localStorage.getItem('paymentHistory') || '[]');
    setActivePlans(plans.filter(plan => plan.status === 'active'));
    setPaymentHistory(history);
  }, []);

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

  const handlePayNow = (plan) => {
    // Update plan status
    const updatedPlans = activePaymentPlans.map(p => {
      if (p.id === plan.id) {
        // Increment the payment count
        const newPayments = p.payments + 1;
        
        // Calculate next payment date (30 days from now)
        const nextPaymentDate = new Date();
        nextPaymentDate.setDate(nextPaymentDate.getDate() + 30);

        // Update plan status based on payment progress
        const status = newPayments >= p.totalPayments ? 'completed' : 'active';

        return {
          ...p,
          payments: newPayments,
          nextPaymentDate: nextPaymentDate.toISOString(),
          status,
          lastPaymentDate: new Date().toISOString()
        };
      }
      return p;
    });

    // Update active payment plans
    setActivePaymentPlans(updatedPlans);
    localStorage.setItem('activePaymentPlans', JSON.stringify(updatedPlans));

    // Create updated user data object
    const updatedUserData = { ...userData };
    
    // Add payment to history
    if (!updatedUserData.paymentHistory) {
      updatedUserData.paymentHistory = [];
    }
    updatedUserData.paymentHistory.push({
      id: plan.id,
      amount: plan.monthlyPayment,
      date: new Date().toISOString(),
      status: 'paid',
      merchant: plan.merchant
    });

    // Calculate new risk score based on payment history
    const paymentHistory = updatedUserData.paymentHistory;
    const totalPayments = paymentHistory.length;
    const onTimePayments = paymentHistory.filter(p => p.status === 'paid').length;
    const paymentSuccessRate = onTimePayments / totalPayments;

    // Get current risk score
    const currentRiskScore = updatedUserData.riskHistory[updatedUserData.riskHistory.length - 1].score;

    // Calculate new risk score (improve by 5% for on-time payment)
    const newRiskScore = Math.max(
      currentRiskScore - 0.05,
      0
    );

    // Update risk history
    if (!updatedUserData.riskHistory) {
      updatedUserData.riskHistory = [];
    }
    updatedUserData.riskHistory.push({
      date: new Date().toISOString(),
      score: newRiskScore
    });

    // Update spending limit based on new risk score
    const oldLimit = updatedUserData.spendingLimit;
    let newLimit = oldLimit;
    let reason = '';

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
      updatedUserData.spendingLimit = newLimit;
      if (!updatedUserData.limitHistory) {
        updatedUserData.limitHistory = [];
      }
      updatedUserData.limitHistory.push({
        date: new Date().toISOString(),
        limit: newLimit,
        change: {
          amount: newLimit - oldLimit,
          percentage: ((newLimit - oldLimit) / oldLimit) * 100,
          reason
        }
      });

      // Set limit change notification
      setLimitChange({
        amount: newLimit - oldLimit,
        percentage: ((newLimit - oldLimit) / oldLimit) * 100,
        reason
      });
    }

    // Update state and localStorage atomically
    setUserData(updatedUserData);
    localStorage.setItem('userData', JSON.stringify(updatedUserData));

    // Show success notification with payment progress
    const paymentProgress = `${plan.payments + 1}/${plan.totalPayments} months paid`;
    setNotification({
      type: 'success',
      message: `Payment processed: ${paymentProgress}`
    });

    // Update active plans and payment history states
    setActivePlans(updatedPlans.filter(p => p.status === 'active'));
    setPaymentHistory(updatedUserData.paymentHistory);
  };

  const handleMarkAsMissed = (plan) => {
    // Update plan status
    const updatedPlans = activePaymentPlans.map(p => {
      if (p.id === plan.id) {
        return { ...p, status: 'missed' };
      }
      return p;
    });
    setActivePaymentPlans(updatedPlans);
    localStorage.setItem('activePaymentPlans', JSON.stringify(updatedPlans));

    // Create updated user data object
    const updatedUserData = { ...userData };
    
    // Add missed payment to history
    if (!updatedUserData.paymentHistory) {
      updatedUserData.paymentHistory = [];
    }
    updatedUserData.paymentHistory.push({
      id: plan.id,
      amount: plan.monthlyPayment,
      date: new Date().toISOString(),
      status: 'missed',
      merchant: plan.merchant
    });

    // Get current risk score
    const currentRiskScore = updatedUserData.riskHistory[updatedUserData.riskHistory.length - 1].score;

    // Calculate new risk score (increase by 20% for missed payment)
    const newRiskScore = Math.min(
      currentRiskScore + 0.2,
      1
    );

    // Update risk history
    if (!updatedUserData.riskHistory) {
      updatedUserData.riskHistory = [];
    }
    updatedUserData.riskHistory.push({
      date: new Date().toISOString(),
      score: newRiskScore
    });

    // Update spending limit based on new risk score
    const oldLimit = updatedUserData.spendingLimit;
    let newLimit = oldLimit;
    let reason = '';

    // Always decrease limit for missed payment
    const decrease = Math.floor(oldLimit * 0.15); // 15% decrease
    newLimit = oldLimit - decrease;
    reason = "Missed payment detected";

    if (newLimit !== oldLimit) {
      updatedUserData.spendingLimit = newLimit;
      if (!updatedUserData.limitHistory) {
        updatedUserData.limitHistory = [];
      }
      updatedUserData.limitHistory.push({
        date: new Date().toISOString(),
        limit: newLimit,
        change: {
          amount: newLimit - oldLimit,
          percentage: ((newLimit - oldLimit) / oldLimit) * 100,
          reason
        }
      });

      // Set limit change notification
      setLimitChange({
        amount: newLimit - oldLimit,
        percentage: ((newLimit - oldLimit) / oldLimit) * 100,
        reason
      });
    }

    // Update state and localStorage atomically
    setUserData(updatedUserData);
    localStorage.setItem('userData', JSON.stringify(updatedUserData));

    // Show notification with payment progress and limit change
    const paymentProgress = `${plan.payments}/${plan.totalPayments} months paid`;
    setNotification({
      type: 'error',
      message: `Payment missed: ${paymentProgress}. Your spending limit has been decreased by ${Math.abs(((newLimit - oldLimit) / oldLimit) * 100).toFixed(1)}%`
    });

    // Update active plans and payment history states
    setActivePlans(updatedPlans.filter(p => p.status === 'active'));
    setPaymentHistory(updatedUserData.paymentHistory);
  };

  const handleLogout = () => {
    localStorage.removeItem('userData');
    navigate('/login');
  };

  if (!userData) return null;

  const completedPlans = userData.activePlans.filter(plan => plan.status === 'completed');
  const currentRiskScore = userData.riskHistory[userData.riskHistory.length - 1].score;
  const spendingLimit = userData.spendingLimit;

  const getRiskLevel = (score) => {
    if (score < 0.3) return { color: '#22c55e', label: 'Low Risk' };
    if (score < 0.7) return { color: '#eab308', label: 'Medium Risk' };
    return { color: '#ef4444', label: 'High Risk' };
  };

  const riskLevel = getRiskLevel(currentRiskScore);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="dashboard-container">
      <Notification 
        notification={notification}
        onClose={handleCloseNotification}
      />
      <div className="dashboard-header">
        <div className="header-title">
          <h1>Welcome, {userData.name || 'Guest'}</h1>
        </div>
        <div className="header-actions">
          <Link to="/transactions" className="transactions-btn">
            View Transactions
          </Link>
        </div>
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

        <div className="dashboard-section">
          <h2>Active Payment Plans</h2>
          <div className="active-plans-horizontal">
            {activePlans.map((plan, index) => (
              <div key={index} className="plan-card">
                <div className="plan-header">
                  <h3>{plan.merchant}</h3>
                  <span className="status active">Active</span>
                </div>
                <div className="plan-details">
                  <p>Total Amount: ${plan.amount}</p>
                  <p>Monthly Payment: ${plan.monthlyPayment}</p>
                </div>
                <div className="plan-actions">
                  <button 
                    className="pay-now-btn"
                    onClick={() => handlePayNow(plan)}
                  >
                    Pay Now
                  </button>
                  <button 
                    className="missed-btn"
                    onClick={() => handleMarkAsMissed(plan)}
                  >
                    Mark as Missed
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Payment History</h2>
          <div className="payment-history-horizontal">
            {paymentHistory.map((payment, index) => (
              <div key={index} className="payment-history-card">
                <div className="payment-info">
                  <h3>{payment.merchant}</h3>
                  <p>Amount: ${payment.amount}</p>
                  <p>Date: {new Date(payment.date).toLocaleDateString()}</p>
                </div>
                <span className="payment-status completed">Completed</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 