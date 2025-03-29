import joblib
import numpy as np
import json

def load_model():
    """Load the trained model and scaler"""
    model = joblib.load('bnpl_risk_model.joblib')
    scaler = joblib.load('scaler.joblib')
    return model, scaler

def predict_risk(user_data):
    """
    Predict the risk of default for a user
    
    Parameters:
    user_data (dict): Dictionary containing user features:
        - age
        - annual_income
        - credit_score
        - employment_length_years
        - debt_to_income_ratio
        - number_of_credit_cards
        - past_defaults
        - monthly_rent
        - savings_balance
    """
    model, scaler = load_model()
    
    # Convert user data to array in correct order
    features = [
        'age', 'annual_income', 'credit_score', 'employment_length_years',
        'debt_to_income_ratio', 'number_of_credit_cards', 'past_defaults',
        'monthly_rent', 'savings_balance'
    ]
    
    X = np.array([user_data[feature] for feature in features]).reshape(1, -1)
    
    # Scale the features
    X_scaled = scaler.transform(X)
    
    # Make prediction
    prediction = model.predict(X_scaled)[0]
    probability = model.predict_proba(X_scaled)[0][1]
    
    # Load feature importance
    with open('feature_importance.json', 'r') as f:
        feature_importance = json.load(f)
    
    # Get top 3 risk factors
    risk_factors = sorted(
        feature_importance.items(),
        key=lambda x: x[1],
        reverse=True
    )[:3]
    
    return {
        'will_default': bool(prediction),
        'default_probability': float(probability),
        'risk_factors': [
            {
                'feature': factor[0],
                'importance': float(factor[1])
            }
            for factor in risk_factors
        ]
    }

if __name__ == "__main__":
    # Example usage
    example_user = {
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
    
    result = predict_risk(example_user)
    print("\nPrediction Results:")
    print(f"Will Default: {result['will_default']}")
    print(f"Default Probability: {result['default_probability']:.2%}")
    print("\nTop Risk Factors:")
    for factor in result['risk_factors']:
        print(f"- {factor['feature']}: {factor['importance']:.2%}") 