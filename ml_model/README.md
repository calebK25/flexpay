# BNPL Risk Prediction Model

This machine learning model predicts the risk of default for Buy Now Pay Later (BNPL) customers based on various financial and personal features.

## Features Used for Prediction

- Age
- Annual Income
- Credit Score
- Employment Length (years)
- Debt-to-Income Ratio
- Number of Credit Cards
- Past Defaults
- Monthly Rent
- Savings Balance

## Setup

1. Install the required dependencies:
```bash
pip install -r requirements.txt
```

2. Train the model:
```bash
python train_model.py
```

This will:
- Generate synthetic training data
- Train a Random Forest Classifier
- Save the model and scaler
- Generate feature importance analysis

## Making Predictions

To make predictions for a new user:

```python
from predict import predict_risk

user_data = {
    'age': 30,
    'annual_income': 65000,
    'credit_score': 680,
    'employment_length_years': 5,
    'debt_to_income_ratio': 0.35,
    'number_of_credit_cards': 3,
    'past_defaults': 0,
    'monthly_rent': 1800,
    'savings_balance': 8000
}

result = predict_risk(user_data)
print(result)
```

The prediction will return:
- `will_default`: Boolean indicating if the user is predicted to default
- `default_probability`: Probability of default (0-1)
- `risk_factors`: Top 3 most important features contributing to the risk assessment

## Model Performance

The model uses a Random Forest Classifier with the following parameters:
- Number of trees: 100
- Maximum depth: 10
- Random state: 42 (for reproducibility)

The model's performance metrics will be displayed after training.

## Note

This is a demonstration model using synthetic data. In a production environment, you would want to:
1. Use real historical data
2. Implement cross-validation
3. Add more sophisticated feature engineering
4. Consider additional features like payment history
5. Implement model monitoring and retraining 