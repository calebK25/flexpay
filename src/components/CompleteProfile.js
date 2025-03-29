import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CompleteProfile.css';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    annualIncome: '',
    employmentStatus: 'employed',
    creditScore: ''
  });
  const [spendingLimit, setSpendingLimit] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    if (!storedUserData) {
      navigate('/login');
    }
  }, [navigate]);

  const calculateSpendingLimit = (data) => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Calculate spending limit
      const limit = calculateSpendingLimit(formData);
      setSpendingLimit(limit);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get existing user data
      const storedUserData = JSON.parse(localStorage.getItem('userData'));
      
      // Update user data with new information
      const updatedUserData = {
        ...storedUserData,
        ...formData,
        spendingLimit: limit,
        profileCompleted: true
      };

      // Store updated user data
      localStorage.setItem('userData', JSON.stringify(updatedUserData));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="complete-profile-container">
      <div className="complete-profile-content">
        <div className="complete-profile-header">
          <h1>Complete Your Profile</h1>
          <p>Please provide your financial information to get started</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="complete-profile-form">
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
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
            <label htmlFor="lastName">Last Name</label>
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
            className={`complete-profile-button ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Processing...' : 'Complete Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile; 