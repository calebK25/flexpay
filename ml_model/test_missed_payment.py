from predict import predict_risk

def print_risk_assessment(result, scenario=""):
    """Print risk assessment results in a formatted way"""
    print(f"\n{scenario}")
    print("=" * 50)
    print(f"Will Default: {result['will_default']}")
    print(f"Default Probability: {result['default_probability']:.2%}")
    print("\nTop Risk Factors:")
    for factor in result['risk_factors']:
        print(f"- {factor['feature']}: {factor['importance']:.2%}")

# Initial user profile (good standing)
initial_user = {
    'age': 28,
    'annual_income': 70000,
    'credit_score': 720,
    'employment_length_years': 4,
    'debt_to_income_ratio': 0.25,
    'number_of_credit_cards': 2,
    'past_defaults': 0,
    'monthly_rent': 1600,
    'savings_balance': 12000
}

# Get initial risk assessment
initial_result = predict_risk(initial_user)
print_risk_assessment(initial_result, "INITIAL RISK ASSESSMENT")

# Simulate missed payment by:
# 1. Decreasing credit score
# 2. Adding a past default
# 3. Increasing debt-to-income ratio
user_after_missed_payment = initial_user.copy()
user_after_missed_payment.update({
    'credit_score': 670,  # Credit score drops by 50 points
    'past_defaults': 1,   # Add one missed payment
    'debt_to_income_ratio': 0.30  # Debt ratio increases
})

# Get updated risk assessment
updated_result = predict_risk(user_after_missed_payment)
print_risk_assessment(updated_result, "RISK ASSESSMENT AFTER MISSED PAYMENT")

# Calculate changes
probability_increase = updated_result['default_probability'] - initial_result['default_probability']
print("\nIMPACT ANALYSIS")
print("=" * 50)
print(f"Default Probability Increase: {probability_increase:.2%}")
print("Changes in user profile:")
print("- Credit score decreased by 50 points")
print("- Added 1 past default")
print("- Debt-to-income ratio increased by 5%") 