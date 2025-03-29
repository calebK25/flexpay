import React, { useEffect, useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import axios from 'axios';
import './PlaidLink.css';

const PlaidLinkButton = ({ onSuccess, buttonText = "Link your bank account" }) => {
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateLinkToken = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post('/api/create_link_token');
      setLinkToken(response.data.link_token);
    } catch (err) {
      console.error('Error generating link token:', err);
      setError('Failed to connect to Plaid. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateLinkToken();
  }, []);

  const exchangePublicToken = async (publicToken) => {
    try {
      setLoading(true);
      const response = await axios.post('/api/set_access_token', {
        public_token: publicToken
      });
      if (onSuccess) {
        onSuccess(response.data);
      }
      return response.data;
    } catch (err) {
      console.error('Error exchanging public token:', err);
      setError('Failed to complete account linking. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (public_token, metadata) => {
      exchangePublicToken(public_token);
    },
    onExit: (err, metadata) => {
      if (err) {
        setError('Link process exited with an error. Please try again.');
        console.error('Link exit error:', err);
      }
    },
  });

  const handleClick = useCallback(() => {
    if (ready) {
      open();
    }
  }, [ready, open]);

  if (loading && !linkToken) {
    return <button className="plaid-link-button loading" disabled>Connecting to Plaid...</button>;
  }

  if (error) {
    return (
      <div className="plaid-link-error">
        <p>{error}</p>
        <button className="plaid-link-button" onClick={generateLinkToken}>Try Again</button>
      </div>
    );
  }

  return (
    <button
      className="plaid-link-button"
      onClick={handleClick}
      disabled={!ready || loading}
    >
      {loading ? 'Connecting...' : buttonText}
    </button>
  );
};

export default PlaidLinkButton;
