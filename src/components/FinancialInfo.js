import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FinancialInfo.css';

const FinancialInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="financial-info">
      <div className="financial-header">
        <button className="back-button" onClick={() => navigate('/dashboard')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back to Dashboard
        </button>
        <h1>Financial Information</h1>
        <p>Learn how your risk assessment and spending limit are calculated</p>
      </div>

      <div className="info-sections">
        <section className="info-section">
          <h2>Risk Assessment Factors</h2>
          <div className="factor-grid">
            <div className="factor-card">
              <div className="factor-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Credit Score</h3>
              <p>Your credit score is a key factor in determining your risk level. Higher scores indicate lower risk.</p>
              <ul>
                <li>Excellent (750+): Low risk</li>
                <li>Good (700-749): Moderate risk</li>
                <li>Fair (650-699): Higher risk</li>
                <li>Poor (Below 650): High risk</li>
              </ul>
            </div>

            <div className="factor-card">
              <div className="factor-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Payment History</h3>
              <p>Your track record of making payments on time significantly impacts your risk assessment.</p>
              <ul>
                <li>On-time payments: Positive impact</li>
                <li>Late payments: Negative impact</li>
                <li>Missed payments: Significant negative impact</li>
                <li>Payment frequency: Regular payments preferred</li>
              </ul>
            </div>

            <div className="factor-card">
              <div className="factor-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Employment Status</h3>
              <p>Your employment stability and income level are considered in risk assessment.</p>
              <ul>
                <li>Full-time employment: Positive impact</li>
                <li>Employment length: Longer tenure preferred</li>
                <li>Income level: Higher income reduces risk</li>
                <li>Income stability: Consistent income preferred</li>
              </ul>
            </div>

            <div className="factor-card">
              <div className="factor-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3>Debt-to-Income Ratio</h3>
              <p>Your debt-to-income ratio helps determine your ability to manage additional credit.</p>
              <ul>
                <li>Low ratio (under 30%): Positive impact</li>
                <li>Moderate ratio (30-40%): Neutral impact</li>
                <li>High ratio (over 40%): Negative impact</li>
                <li>Very high ratio (over 50%): Significant negative impact</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h2>Spending Limit Calculation</h2>
          <div className="calculation-info">
            <div className="calculation-card">
              <h3>Base Limit</h3>
              <p>Your base spending limit is calculated as a percentage of your annual income:</p>
              <ul>
                <li>Initial limit: 20% of annual income</li>
                <li>Maximum limit: 40% of annual income</li>
                <li>Minimum limit: 10% of annual income</li>
              </ul>
            </div>

            <div className="calculation-card">
              <h3>Adjustment Factors</h3>
              <p>Your base limit is adjusted based on various factors:</p>
              <ul>
                <li>Credit score impact: ±10%</li>
                <li>Payment history impact: ±15%</li>
                <li>Employment stability impact: ±5%</li>
                <li>Debt-to-income impact: ±10%</li>
              </ul>
            </div>

            <div className="calculation-card">
              <h3>Dynamic Updates</h3>
              <p>Your spending limit is regularly reviewed and may be adjusted based on:</p>
              <ul>
                <li>Payment behavior</li>
                <li>Risk score changes</li>
                <li>Income changes</li>
                <li>Credit score updates</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FinancialInfo; 