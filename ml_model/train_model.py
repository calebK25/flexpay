import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix
import joblib
import json

def generate_fake_data(n_samples=1000):
    """Generate fake data for BNPL risk prediction"""
    np.random.seed(42)
    
    data = {
        'age': np.random.normal(35, 10, n_samples),
        'annual_income': np.random.normal(75000, 25000, n_samples),
        'credit_score': np.random.normal(700, 50, n_samples),
        'employment_length_years': np.random.normal(8, 5, n_samples),
        'debt_to_income_ratio': np.random.normal(0.3, 0.1, n_samples),
        'number_of_credit_cards': np.random.poisson(3, n_samples),
        'past_defaults': np.random.poisson(0.2, n_samples),
        'monthly_rent': np.random.normal(2000, 500, n_samples),
        'savings_balance': np.random.normal(10000, 5000, n_samples),
        # New features
        'monthly_income': np.random.normal(6250, 2083, n_samples),  # Annual income / 12
        'monthly_expenses': np.random.normal(4000, 1000, n_samples),
        'credit_utilization': np.random.normal(0.3, 0.15, n_samples),
        'number_of_loans': np.random.poisson(1.5, n_samples),
        'loan_payment_history': np.random.normal(0.95, 0.1, n_samples),  # 0-1 score
        'bankruptcy_history': np.random.binomial(1, 0.05, n_samples),  # 0 or 1
        'recent_credit_inquiries': np.random.poisson(2, n_samples),
        'length_of_credit_history': np.random.normal(10, 5, n_samples),
        'defaulted': np.zeros(n_samples)
    }
    
    # Convert to DataFrame
    df = pd.DataFrame(data)
    
    # Ensure all values are positive and within reasonable ranges
    df['age'] = df['age'].clip(lower=18, upper=100)
    df['annual_income'] = df['annual_income'].clip(lower=20000, upper=500000)
    df['credit_score'] = df['credit_score'].clip(lower=300, upper=850)
    df['employment_length_years'] = df['employment_length_years'].clip(lower=0, upper=50)
    df['debt_to_income_ratio'] = df['debt_to_income_ratio'].clip(lower=0, upper=1)
    df['number_of_credit_cards'] = df['number_of_credit_cards'].clip(lower=0, upper=20)
    df['past_defaults'] = df['past_defaults'].clip(lower=0, upper=10)
    df['monthly_rent'] = df['monthly_rent'].clip(lower=500, upper=5000)
    df['savings_balance'] = df['savings_balance'].clip(lower=0, upper=100000)
    df['monthly_income'] = df['monthly_income'].clip(lower=1667, upper=41667)
    df['monthly_expenses'] = df['monthly_expenses'].clip(lower=1000, upper=10000)
    df['credit_utilization'] = df['credit_utilization'].clip(lower=0, upper=1)
    df['number_of_loans'] = df['number_of_loans'].clip(lower=0, upper=10)
    df['loan_payment_history'] = df['loan_payment_history'].clip(lower=0, upper=1)
    df['recent_credit_inquiries'] = df['recent_credit_inquiries'].clip(lower=0, upper=20)
    df['length_of_credit_history'] = df['length_of_credit_history'].clip(lower=0, upper=50)
    
    # Generate target variable (defaulted) based on features with more realistic probabilities
    df['defaulted'] = (
        (df['credit_score'] < 600) * 0.7 +  # 70% chance of default if credit score < 600
        (df['debt_to_income_ratio'] > 0.4) * 0.5 +  # 50% chance if high DTI
        (df['past_defaults'] > 0) * 0.6 +  # 60% chance if past defaults
        (df['annual_income'] < 40000) * 0.4 +  # 40% chance if low income
        (df['bankruptcy_history'] == 1) * 0.8 +  # 80% chance if bankruptcy history
        (df['loan_payment_history'] < 0.8) * 0.6 +  # 60% chance if poor payment history
        (df['credit_utilization'] > 0.8) * 0.5 +  # 50% chance if high credit utilization
        (df['monthly_expenses'] > df['monthly_income'] * 0.9) * 0.4  # 40% chance if expenses > 90% of income
    ) > 0.5  # Default if probability > 0.5
    
    return df

def train_model():
    """Train the BNPL risk prediction model"""
    # Generate fake data
    print("Generating fake data...")
    df = generate_fake_data(10000)
    
    # Prepare features and target
    features = [
        'age', 'annual_income', 'credit_score', 'employment_length_years',
        'debt_to_income_ratio', 'number_of_credit_cards', 'past_defaults',
        'monthly_rent', 'savings_balance', 'monthly_income', 'monthly_expenses',
        'credit_utilization', 'number_of_loans', 'loan_payment_history',
        'bankruptcy_history', 'recent_credit_inquiries', 'length_of_credit_history'
    ]
    X = df[features]
    y = df['defaulted']
    
    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )
    
    # Scale the features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train the model with more realistic parameters
    print("Training model...")
    model = RandomForestClassifier(
        n_estimators=200,  # More trees for better generalization
        max_depth=15,      # Deeper trees to capture complex patterns
        min_samples_split=5,  # Require more samples to split
        min_samples_leaf=2,   # Require more samples in leaves
        max_features='sqrt',  # Use sqrt of features for each split
        class_weight='balanced',  # Handle class imbalance
        random_state=42
    )
    model.fit(X_train_scaled, y_train)
    
    # Evaluate the model
    y_pred = model.predict(X_test_scaled)
    print("\nModel Performance:")
    print(classification_report(y_test, y_pred))
    
    # Save the model and scaler
    print("\nSaving model and scaler...")
    joblib.dump(model, 'bnpl_risk_model.joblib')
    joblib.dump(scaler, 'scaler.joblib')
    
    # Save feature importance
    feature_importance = dict(zip(features, model.feature_importances_))
    with open('feature_importance.json', 'w') as f:
        json.dump(feature_importance, f, indent=4)
    
    print("\nModel training completed successfully!")

if __name__ == "__main__":
    train_model() 