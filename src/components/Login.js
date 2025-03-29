import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import CreditCardAnimation from './CreditCardAnimation';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shiftCards, setShiftCards] = useState(false);

  useEffect(() => {
    // Start shifting cards after initial reveal
    const timer = setTimeout(() => {
      setShiftCards(true);
    }, 3000); // Increased delay to ensure cards are fully revealed

    return () => clearTimeout(timer);
  }, []);

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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get user data from localStorage
      const storedUserData = localStorage.getItem('userData');
      if (!storedUserData) {
        throw new Error('User not found');
      }

      const userData = JSON.parse(storedUserData);
      if (userData.email !== formData.email) {
        throw new Error('Invalid email or password');
      }

      // In a real app, you would verify the password here
      // For demo purposes, we'll just check if it's not empty
      if (!formData.password) {
        throw new Error('Password is required');
      }

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        // Simulate API call to get user info
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Get user data from localStorage
        const storedUserData = localStorage.getItem('userData');
        if (storedUserData) {
          const userData = JSON.parse(storedUserData);
          if (userData.profileCompleted) {
            // User exists and has completed profile, redirect to dashboard
            navigate('/dashboard');
          } else {
            // User exists but hasn't completed profile, redirect to complete profile
            navigate('/complete-profile');
          }
        } else {
          // Create new user with default values
          const newUserData = {
            firstName: '',
            lastName: '',
            email: 'user@example.com',
            phone: '',
            annualIncome: '',
            employmentStatus: 'employed',
            creditScore: '',
            spendingLimit: 0,
            createdAt: new Date().toISOString(),
            activePlans: [],
            profileCompleted: false
          };

          // Store the new user data
          localStorage.setItem('userData', JSON.stringify(newUserData));
          
          // Redirect to complete profile
          navigate('/complete-profile');
        }
      } catch (err) {
        setError('Google login failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google login failed. Please try again.');
    }
  });

  return (
    <div className="login-container">
      <div className={`credit-cards-wrapper ${shiftCards ? 'shift-left' : ''}`}>
        <CreditCardAnimation />
      </div>
      <div className={`login-content ${shiftCards ? 'slide-in' : ''}`}>
        <div className="login-header">
          <Link to="/" className="login-logo">
            FlexPay
          </Link>
          <h1>Welcome back</h1>
          <p>Don't have an account? <Link to="/register" className="signup-link">Sign up</Link></p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
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
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
          </div>

          <button
            type="submit"
            className={`login-button ${loading ? 'loading' : ''}`}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="google-button"
            onClick={() => googleLogin()}
            disabled={loading}
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="google-icon"
            />
            {loading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </form>

        <div className="login-footer">
          <Link to="/forgot-password" className="forgot-password">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 