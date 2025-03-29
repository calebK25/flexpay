// Constants for risk assessment
const MAX_DEBT_TO_INCOME_RATIO = 0.4; // 40% of income
const MAX_ACTIVE_PLANS = 5;
const RISK_THRESHOLD = 0.7; // 70% risk threshold for warnings

// Calculate total BNPL debt and check for over-spending
export const checkOverSpending = (activePlans, annualIncome) => {
  const totalDebt = activePlans.reduce((sum, plan) => sum + plan.amount, 0);
  const monthlyIncome = annualIncome / 12;
  const debtToIncomeRatio = totalDebt / monthlyIncome;
  
  const warnings = [];
  
  if (debtToIncomeRatio > MAX_DEBT_TO_INCOME_RATIO) {
    warnings.push({
      type: 'high_debt_ratio',
      message: `Your total BNPL debt ($${totalDebt.toFixed(2)}) exceeds 40% of your monthly income. This may impact your ability to make payments.`,
      severity: 'high'
    });
  }
  
  if (activePlans.length >= MAX_ACTIVE_PLANS) {
    warnings.push({
      type: 'too_many_plans',
      message: `You currently have ${activePlans.length} active payment plans. Having too many plans may increase your risk of missing payments.`,
      severity: 'medium'
    });
  }
  
  return {
    totalDebt,
    debtToIncomeRatio,
    warnings
  };
};

// Predict payment risk based on historical data
export const predictPaymentRisk = (userData, activePlans) => {
  const {
    creditScore,
    employmentLength,
    debtToIncomeRatio,
    paymentHistory
  } = userData;

  // Calculate risk factors
  const creditScoreRisk = creditScore < 650 ? 0.3 : 0;
  const employmentRisk = employmentLength < 12 ? 0.2 : 0;
  const debtRatioRisk = debtToIncomeRatio > 0.3 ? 0.2 : 0;
  
  // Calculate payment history risk
  const missedPayments = paymentHistory.filter(payment => !payment.paid).length;
  const totalPayments = paymentHistory.length;
  const paymentRisk = (missedPayments / totalPayments) * 0.3;
  
  // Calculate active plans risk
  const activePlansRisk = activePlans.length * 0.05;
  
  // Calculate total risk score (0-1)
  const totalRisk = Math.min(
    creditScoreRisk + employmentRisk + debtRatioRisk + paymentRisk + activePlansRisk,
    1
  );
  
  // Generate risk assessment
  const assessment = {
    riskScore: totalRisk,
    riskLevel: totalRisk > 0.7 ? 'high' : totalRisk > 0.4 ? 'medium' : 'low',
    factors: {
      creditScore: creditScoreRisk,
      employment: employmentRisk,
      debtRatio: debtRatioRisk,
      paymentHistory: paymentRisk,
      activePlans: activePlansRisk
    },
    recommendations: []
  };
  
  // Add recommendations based on risk factors
  if (creditScoreRisk > 0) {
    assessment.recommendations.push('Consider improving your credit score before taking on more debt');
  }
  if (employmentRisk > 0) {
    assessment.recommendations.push('Wait until you have at least 12 months of employment history');
  }
  if (debtRatioRisk > 0) {
    assessment.recommendations.push('Reduce your existing debt before taking on more payments');
  }
  if (paymentRisk > 0) {
    assessment.recommendations.push('Focus on making all payments on time to improve your payment history');
  }
  if (activePlansRisk > 0) {
    assessment.recommendations.push('Consider reducing the number of active payment plans');
  }
  
  return assessment;
};

// Check if a new purchase would be risky
export const checkPurchaseRisk = (userData, activePlans, newPurchaseAmount) => {
  const { warnings } = checkOverSpending(activePlans, userData.annualIncome);
  const riskAssessment = predictPaymentRisk(userData, activePlans);
  
  // Calculate new debt-to-income ratio with the purchase
  const currentDebt = activePlans.reduce((sum, plan) => sum + plan.amount, 0);
  const newDebtToIncomeRatio = (currentDebt + newPurchaseAmount) / (userData.annualIncome / 12);
  
  const purchaseRisk = {
    canProceed: true,
    warnings: [...warnings],
    riskAssessment,
    recommendations: riskAssessment.recommendations,
    newDebtToIncomeRatio
  };
  
  // Add specific purchase warnings
  if (newDebtToIncomeRatio > MAX_DEBT_TO_INCOME_RATIO) {
    purchaseRisk.warnings.push({
      type: 'purchase_would_exceed_limit',
      message: `This purchase would increase your debt-to-income ratio to ${(newDebtToIncomeRatio * 100).toFixed(1)}%.`,
      severity: 'high'
    });
  }
  
  if (riskAssessment.riskScore > RISK_THRESHOLD) {
    purchaseRisk.warnings.push({
      type: 'high_risk_purchase',
      message: 'Based on your payment history and current financial situation, this purchase carries a high risk of missed payments.',
      severity: 'high'
    });
    purchaseRisk.canProceed = false;
  }
  
  return purchaseRisk;
}; 