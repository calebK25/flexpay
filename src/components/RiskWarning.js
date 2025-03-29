import React from 'react';
import { checkOverSpending, predictPaymentRisk } from '../utils/paymentUtils';
import './RiskWarning.css';

const RiskWarning = ({ userData, activePlans, newPurchaseAmount }) => {
  const { warnings } = checkOverSpending(activePlans, userData.annualIncome);
  const riskAssessment = predictPaymentRisk(userData, activePlans);

  if (warnings.length === 0 && riskAssessment.riskLevel === 'low') {
    return null;
  }

  return (
    <div className="risk-warning-container">
      {warnings.map((warning, index) => (
        <div key={index} className={`warning-box ${warning.severity}`}>
          <div className="warning-header">
            <svg className="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {warning.severity === 'high' ? (
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              ) : (
                <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span className="warning-title">
              {warning.severity === 'high' ? 'High Risk Warning' : 'Warning'}
            </span>
          </div>
          <p className="warning-message">{warning.message}</p>
        </div>
      ))}

      {riskAssessment.riskLevel !== 'low' && (
        <div className="risk-assessment">
          <h3 className="risk-assessment-title">Payment Risk Assessment</h3>
          <div className="risk-level-indicator">
            <div className={`risk-level ${riskAssessment.riskLevel}`}>
              {riskAssessment.riskLevel.charAt(0).toUpperCase() + riskAssessment.riskLevel.slice(1)} Risk
            </div>
            <div className="risk-score">
              Risk Score: {(riskAssessment.riskScore * 100).toFixed(0)}%
            </div>
          </div>
          
          <div className="risk-factors">
            <h4>Risk Factors:</h4>
            <ul>
              {Object.entries(riskAssessment.factors).map(([factor, value]) => (
                value > 0 && (
                  <li key={factor}>
                    {factor.replace(/([A-Z])/g, ' $1').toLowerCase()}: {(value * 100).toFixed(0)}%
                  </li>
                )
              ))}
            </ul>
          </div>

          {riskAssessment.recommendations.length > 0 && (
            <div className="recommendations">
              <h4>Recommendations:</h4>
              <ul>
                {riskAssessment.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskWarning; 