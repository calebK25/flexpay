import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Shop.css';

const MOCK_PRODUCTS = [
  {
    id: 1,
    name: 'Premium Laptop',
    price: 1299.99,
    image: 'https://via.placeholder.com/300x200',
    description: 'High-performance laptop with 16GB RAM and 512GB SSD'
  },
  {
    id: 2,
    name: 'Smartphone Pro',
    price: 899.99,
    image: 'https://via.placeholder.com/300x200',
    description: 'Latest smartphone with advanced camera system'
  },
  {
    id: 3,
    name: 'Wireless Headphones',
    price: 199.99,
    image: 'https://via.placeholder.com/300x200',
    description: 'Noise-cancelling wireless headphones with premium sound'
  }
];

const INSTALLMENT_PLANS = [
  { months: 3, interestRate: 0 },
  { months: 6, interestRate: 0.05 },
  { months: 12, interestRate: 0.08 }
];

const Shop = () => {
  const navigate = useNavigate();
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get user data from localStorage
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const calculateMonthlyPayment = (price, plan) => {
    if (!price || !plan) return 0;
    const monthlyRate = plan.interestRate / 12;
    const numberOfPayments = plan.months;
    const monthlyPayment = (price * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
      (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
    return monthlyRate === 0 ? price / numberOfPayments : monthlyPayment;
  };

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSelectedPlan(null);
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
  };

  const handlePurchase = async () => {
    if (!selectedProduct || !selectedPlan) return;

    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create payment plan
      const paymentPlan = {
        id: Date.now(),
        product: selectedProduct,
        plan: selectedPlan,
        monthlyPayment: calculateMonthlyPayment(selectedProduct.price, selectedPlan),
        totalPayments: selectedPlan.months,
        remainingPayments: selectedPlan.months,
        startDate: new Date().toISOString(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        status: 'active'
      };

      // Update user data with new payment plan
      const updatedUserData = {
        ...userData,
        activePlans: [...(userData.activePlans || []), paymentPlan]
      };

      // Update localStorage
      localStorage.setItem('userData', JSON.stringify(updatedUserData));

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err) {
      setError('Purchase failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!userData) return null;

  return (
    <div className="shop-container">
      <div className="shop-header">
        <h1>Shop</h1>
        <p>Your spending limit: ${userData.spendingLimit.toLocaleString()}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="products-grid">
        {MOCK_PRODUCTS.map(product => (
          <div
            key={product.id}
            className={`product-card ${selectedProduct?.id === product.id ? 'selected' : ''}`}
            onClick={() => handleProductSelect(product)}
          >
            <img src={product.image} alt={product.name} />
            <h3>{product.name}</h3>
            <p className="price">${product.price.toLocaleString()}</p>
            <p className="description">{product.description}</p>
          </div>
        ))}
      </div>

      {selectedProduct && (
        <div className="checkout-section">
          <h2>Choose your payment plan</h2>
          <div className="payment-plans">
            {INSTALLMENT_PLANS.map(plan => (
              <div
                key={plan.months}
                className={`payment-plan ${selectedPlan?.months === plan.months ? 'selected' : ''}`}
                onClick={() => handlePlanSelect(plan)}
              >
                <h3>{plan.months} Months</h3>
                <p className="monthly-payment">
                  ${calculateMonthlyPayment(selectedProduct.price, plan).toFixed(2)}/month
                </p>
                {plan.interestRate > 0 && (
                  <p className="interest-rate">{plan.interestRate * 100}% APR</p>
                )}
              </div>
            ))}
          </div>

          {selectedPlan && (
            <div className="purchase-summary">
              <h3>Purchase Summary</h3>
              <div className="summary-details">
                <p>Product: {selectedProduct.name}</p>
                <p>Price: ${selectedProduct.price.toLocaleString()}</p>
                <p>Plan: {selectedPlan.months} months</p>
                <p>Monthly Payment: ${calculateMonthlyPayment(selectedProduct.price, selectedPlan).toFixed(2)}</p>
                {selectedPlan.interestRate > 0 && (
                  <p>Total Interest: ${(calculateMonthlyPayment(selectedProduct.price, selectedPlan) * selectedPlan.months - selectedProduct.price).toFixed(2)}</p>
                )}
              </div>
              <button
                className={`purchase-button ${loading ? 'loading' : ''}`}
                onClick={handlePurchase}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Complete Purchase'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Shop; 