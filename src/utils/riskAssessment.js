// Risk assessment utility for credit limit adjustments
import { getTransactions } from './knotUtils';

// Risk factors and their weights
const RISK_FACTORS = {
  MISSED_PAYMENTS: 0.3,
  PAYMENT_HISTORY: 0.2,
  TRANSACTION_PATTERNS: 0.2,
  CREDIT_UTILIZATION: 0.15,
  ACCOUNT_AGE: 0.15
};

// Risk levels and their credit limit adjustments
const RISK_LEVELS = {
  LOW: { adjustment: 1.2, threshold: 0.7 },    // 20% increase
  MEDIUM: { adjustment: 1.0, threshold: 0.5 }, // No change
  HIGH: { adjustment: 0.8, threshold: 0.3 },   // 20% decrease
  CRITICAL: { adjustment: 0.5, threshold: 0.1 } // 50% decrease
};

export class RiskAssessment {
  constructor() {
    this.transactionHistory = [];
    this.paymentHistory = [];
    this.creditLimit = 10000; // Default credit limit
    this.initialCreditLimit = 10000;
  }

  // Calculate risk score based on various factors
  async calculateRiskScore(userId) {
    try {
      // Calculate individual risk factors
      const missedPaymentsScore = this.calculateMissedPaymentsScore();
      const paymentHistoryScore = this.calculatePaymentHistoryScore();
      const transactionPatternsScore = this.calculateTransactionPatternsScore();
      const creditUtilizationScore = this.calculateCreditUtilizationScore();
      const accountAgeScore = this.calculateAccountAgeScore();

      // Calculate weighted average risk score
      const riskScore = (
        missedPaymentsScore * RISK_FACTORS.MISSED_PAYMENTS +
        paymentHistoryScore * RISK_FACTORS.PAYMENT_HISTORY +
        transactionPatternsScore * RISK_FACTORS.TRANSACTION_PATTERNS +
        creditUtilizationScore * RISK_FACTORS.CREDIT_UTILIZATION +
        accountAgeScore * RISK_FACTORS.ACCOUNT_AGE
      );

      return Math.max(0, Math.min(1, riskScore));
    } catch (error) {
      console.error('Error calculating risk score:', error);
      throw error;
    }
  }

  // Calculate risk score for missed payments
  calculateMissedPaymentsScore() {
    const missedPayments = this.paymentHistory.filter(payment => payment.status === 'missed').length;
    const totalPayments = this.paymentHistory.length;
    
    if (totalPayments === 0) return 1; // Perfect score for new accounts
    
    const missedPaymentRatio = missedPayments / totalPayments;
    return 1 - missedPaymentRatio;
  }

  // Calculate risk score based on payment history
  calculatePaymentHistoryScore() {
    const onTimePayments = this.paymentHistory.filter(payment => 
      payment.status === 'completed' && 
      new Date(payment.date) <= new Date(payment.dueDate)
    ).length;
    
    const totalPayments = this.paymentHistory.length;
    
    if (totalPayments === 0) return 1;
    
    return onTimePayments / totalPayments;
  }

  // Calculate risk score based on transaction patterns
  calculateTransactionPatternsScore() {
    if (this.transactionHistory.length === 0) return 1;

    // Analyze transaction patterns
    const recentTransactions = this.transactionHistory.slice(-10); // Last 10 transactions
    const amounts = recentTransactions.map(t => t.amount);
    const averageAmount = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
    const maxAmount = Math.max(...amounts);
    const minAmount = Math.min(...amounts);
    
    // Calculate volatility score
    const volatility = (maxAmount - minAmount) / averageAmount;
    
    // Calculate frequency score (transactions per day)
    const days = (new Date() - new Date(recentTransactions[0].date)) / (1000 * 60 * 60 * 24);
    const frequency = recentTransactions.length / days;
    
    // Combine volatility and frequency scores
    const volatilityScore = Math.max(0, 1 - (volatility - 1) / 2);
    const frequencyScore = Math.min(1, frequency / 2); // Normalize to 0-1, max at 2 transactions per day
    
    return (volatilityScore + frequencyScore) / 2;
  }

  // Calculate risk score based on credit utilization
  calculateCreditUtilizationScore() {
    if (this.transactionHistory.length === 0) return 1;

    const totalSpent = this.transactionHistory.reduce((sum, t) => sum + t.amount, 0);
    const utilization = totalSpent / this.creditLimit;
    
    // More granular utilization scoring
    if (utilization < 0.3) return 1;
    if (utilization < 0.5) return 0.8;
    if (utilization < 0.7) return 0.6;
    if (utilization < 0.9) return 0.4;
    return 0.2;
  }

  // Calculate risk score based on account age
  calculateAccountAgeScore() {
    if (this.transactionHistory.length === 0) return 0.5; // Neutral score for new accounts

    const oldestTransaction = new Date(Math.min(...this.transactionHistory.map(t => new Date(t.date))));
    const accountAge = (new Date() - oldestTransaction) / (1000 * 60 * 60 * 24 * 365); // Age in years
    
    // More granular age scoring
    if (accountAge < 0.5) return 0.5; // Less than 6 months
    if (accountAge < 1) return 0.7;  // Less than 1 year
    if (accountAge < 2) return 0.8;  // Less than 2 years
    return 1; // More than 2 years
  }

  // Adjust credit limit based on risk score
  async adjustCreditLimit(userId) {
    try {
      const riskScore = await this.calculateRiskScore(userId);
      
      // Determine risk level and adjustment
      let adjustment = 1.0;
      let riskLevel = 'MEDIUM';

      if (riskScore >= RISK_LEVELS.LOW.threshold) {
        adjustment = RISK_LEVELS.LOW.adjustment;
        riskLevel = 'LOW';
      } else if (riskScore >= RISK_LEVELS.MEDIUM.threshold) {
        adjustment = RISK_LEVELS.MEDIUM.adjustment;
        riskLevel = 'MEDIUM';
      } else if (riskScore >= RISK_LEVELS.HIGH.threshold) {
        adjustment = RISK_LEVELS.HIGH.adjustment;
        riskLevel = 'HIGH';
      } else {
        adjustment = RISK_LEVELS.CRITICAL.adjustment;
        riskLevel = 'CRITICAL';
      }

      // Calculate new credit limit with bounds
      const newCreditLimit = Math.round(this.creditLimit * adjustment);
      const minLimit = this.initialCreditLimit * 0.5; // Minimum 50% of initial limit
      const maxLimit = this.initialCreditLimit * 2;   // Maximum 200% of initial limit

      // Ensure the new limit stays within bounds
      const boundedLimit = Math.min(Math.max(newCreditLimit, minLimit), maxLimit);

      // Update the credit limit
      this.creditLimit = boundedLimit;

      // Log the adjustment details
      console.log(`Risk Assessment Results:
        Risk Score: ${riskScore.toFixed(2)}
        Risk Level: ${riskLevel}
        Previous Limit: $${this.creditLimit}
        New Limit: $${boundedLimit}
        Adjustment: ${(adjustment * 100).toFixed(0)}%
        Factors:
        - Missed Payments: ${this.calculateMissedPaymentsScore().toFixed(2)}
        - Payment History: ${this.calculatePaymentHistoryScore().toFixed(2)}
        - Transaction Patterns: ${this.calculateTransactionPatternsScore().toFixed(2)}
        - Credit Utilization: ${this.calculateCreditUtilizationScore().toFixed(2)}
        - Account Age: ${this.calculateAccountAgeScore().toFixed(2)}
      `);

      return {
        newCreditLimit: boundedLimit,
        riskLevel,
        riskScore,
        adjustment,
        factors: {
          missedPayments: this.calculateMissedPaymentsScore(),
          paymentHistory: this.calculatePaymentHistoryScore(),
          transactionPatterns: this.calculateTransactionPatternsScore(),
          creditUtilization: this.calculateCreditUtilizationScore(),
          accountAge: this.calculateAccountAgeScore()
        }
      };
    } catch (error) {
      console.error('Error adjusting credit limit:', error);
      throw error;
    }
  }

  // Update payment history
  updatePaymentHistory(payment) {
    this.paymentHistory.push(payment);
  }
} 