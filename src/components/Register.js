import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    annualIncome: '',
    employmentStatus: 'employed',
    creditScore: '',
  });
  const [spendingLimit, setSpendingLimit] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateSpendingLimit = (data) => {
    // Basic spending limit calculation based on income and credit score
    const income = parseFloat(data.annualIncome) || 0;
    const creditScore = parseInt(data.creditScore) || 0;
    
    let baseLimit = income * 0.2; // 20% of annual income
    
    // Adjust based on credit score
    if (creditScore >= 750) {
      baseLimit *= 1.5;
    } else if (creditScore >= 650) {
      baseLimit *= 1.2;
    } else if (creditScore >= 550) {
      baseLimit *= 0.8;
    } else {
      baseLimit *= 0.5;
    }

    // Adjust based on employment status
    if (data.employmentStatus === 'self-employed') {
      baseLimit *= 0.8;
    }

    return Math.round(baseLimit);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Calculate spending limit
      const limit = calculateSpendingLimit(formData);
      setSpendingLimit(limit);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store user data and spending limit in localStorage (simulating backend)
      localStorage.setItem('userData', JSON.stringify({
        ...formData,
        spendingLimit: limit,
        createdAt: new Date().toISOString(),
        activePlans: [] // Initialize empty activePlans array
      }));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      setError('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="register-container">
      <div className="register-content">
        <div className="register-header">
          <Link to="/" className="register-logo">
            FlexPay
          </Link>
          <h1>Create your account</h1>
          <p>Already have an account? <Link to="/sign-in" className="signin-link">Sign in</Link></p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label htmlFor="firstName">First name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lastName">Last name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="annualIncome">Annual income</label>
            <input
              type="number"
              id="annualIncome"
              name="annualIncome"
              value={formData.annualIncome}
              onChange={handleInputChange}
              required
              min="0"
            />
          </div>

          <div className="form-group">
            <label htmlFor="employmentStatus">Employment status</label>
            <select
              id="employmentStatus"
              name="employmentStatus"
              value={formData.employmentStatus}
              onChange={handleInputChange}
              required
            >
              <option value="employed">Employed</option>
              <option value="self-employed">Self-employed</option>
              <option value="unemployed">Unemployed</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="creditScore">Credit score (optional)</label>
            <input
              type="number"
              id="creditScore"
              name="creditScore"
              value={formData.creditScore}
              onChange={handleInputChange}
              min="300"
              max="850"
            />
          </div>

          {spendingLimit && (
            <div className="spending-limit">
              <h3>Your estimated spending limit</h3>
              <p className="limit-amount">${spendingLimit.toLocaleString()}</p>
            </div>
          )}

          <button 
            type="submit" 
            className={`register-button ${isLoading ? 'loading' : ''}`}
          >
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className="register-footer">
          <p>By creating an account, you agree to our <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link>.</p>
        </div>
      </div>
    </div>
  );
};

export default Register; 