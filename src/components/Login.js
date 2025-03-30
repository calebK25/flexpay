import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import CreditCardAnimation from './CreditCardAnimation';
import './Login.css';

const Login = ({ onLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
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
    }, 1000); // Increased delay to ensure cards are fully revealed

    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(formData);
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
      <div className="credit-cards-wrapper">
        <CreditCardAnimation />
      </div>
      <div className={`login-content ${shiftCards ? 'slide-in' : ''}`}>
        <div className="login-header">
          <Link to="/" className="login-logo">
            FlexPay
          </Link>
          <h1>Welcome Back</h1>
          <p>Sign in to your account to continue</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
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
            Continue with Google
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="signup-link">
              Sign up
            </Link>
          </p>
          <Link to="/forgot-password" className="forgot-password">
            Forgot your password?
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login; 