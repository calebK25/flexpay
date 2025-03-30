const express = require('express');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const cors = require('cors');
const bodyParser = require('body-parser');
const { getKnotClient } = require('./knotUtils');
const axios = require('axios');
require('dotenv').config();

const app = express();

// Configure CORS
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Knot-Client-Id', 'Knot-Secret']
}));

app.use(express.json());
app.use(bodyParser.json());

// Get environment from .env file
const environment = process.env.PLAID_ENV || 'sandbox';
const basePath = environment === 'production' 
  ? PlaidEnvironments.production 
  : PlaidEnvironments.sandbox;

const configuration = new Configuration({
  basePath,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.REACT_APP_PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.REACT_APP_PLAID_SECRET,
      'Plaid-Version': '2020-09-14'
    },
  },
});

const plaidClient = new PlaidApi(configuration);

// Initialize Knot client
const knotClient = getKnotClient();

// Create Plaid link token
app.post('/api/create-link-token', async (req, res) => {
  try {
    console.log('Creating Plaid link token...');
    
    if (!process.env.REACT_APP_PLAID_CLIENT_ID || !process.env.REACT_APP_PLAID_SECRET) {
      console.error('Plaid credentials not configured');
      return res.status(500).json({ 
        error: 'Plaid credentials not configured',
        details: 'Please check your environment variables'
      });
    }

    // Generate a unique user ID for this session
    const userId = `user_${Date.now()}`;
    
    const request = {
      user: { client_user_id: userId },
      client_name: 'FlexPay Demo',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en'
    };

    console.log('Sending request to Plaid:', request);

    const response = await plaidClient.linkTokenCreate(request);
    
    console.log('Plaid response:', response.data);

    if (!response.data || !response.data.link_token) {
      throw new Error('No link token received from Plaid');
    }

    return res.json({
      link_token: response.data.link_token
    });
  } catch (error) {
    console.error('Error creating Plaid link token:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return res.status(500).json({
      error: 'Failed to create link token',
      details: error.message
    });
  }
});

// Webhook endpoint for Knot API events
app.post('/webhook/knot', async (req, res) => {
  try {
    const { event_type, data } = req.body;
    
    if (!event_type) {
      console.error('Missing event_type in webhook request');
      return res.status(400).json({ 
        error: 'Missing event type',
        details: 'The event_type parameter is required in the webhook request'
      });
    }
    
    switch (event_type) {
      case 'card_switch_success':
        console.log('Card switch successful:', data);
        break;

      case 'card_switch_failed':
        console.log('Card switch failed:', data);
        break;

      case 'payment_success':
        console.log('Payment successful:', data);
        break;

      case 'payment_failed':
        console.log('Payment failed:', data);
        break;

      default:
        console.log('Unhandled event type:', event_type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error.message
    });
  }
});

// Create processor token for Knot integration
app.post('/api/create-processor-token', async (req, res) => {
  try {
    const { access_token, account_id } = req.body;
    
    if (!access_token || !account_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const request = {
      access_token,
      account_id,
      processor: 'knot'
    };

    const response = await plaidClient.processorTokenCreate(request);
    res.json({ processor_token: response.data.processor_token });
  } catch (error) {
    console.error('Error creating processor token:', error);
    res.status(500).json({ 
      error: 'Failed to create processor token',
      details: error.response?.data || error.message 
    });
  }
});

// Create Knot session endpoint
app.post('/api/create-knot-session', async (req, res) => {
  try {
    const { clientId, product } = req.body;
    
    if (!clientId) {
      console.error('Missing clientId in request');
      return res.status(400).json({ 
        error: 'Client ID is required',
        details: 'The clientId parameter is missing from the request body'
      });
    }

    if (!process.env.REACT_APP_KNOT_API_KEY) {
      console.error('Knot API key is not configured');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'Knot API key is not configured in the server environment'
      });
    }

    console.log('Creating Knot session with:', { clientId, product });

    // Create session request body
    const requestBody = {
      client_id: clientId,
      product: product || 'transaction_link',
      environment: 'development',
      entry_point: 'onboarding'
    };

    console.log('Sending request to Knot API:', {
      url: 'https://development.knotapi.com/api/v2/sessions',
      body: requestBody,
      headers: {
        'Authorization': 'Bearer [REDACTED]',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    const response = await axios.post('https://development.knotapi.com/api/v2/sessions', requestBody, {
      headers: {
        'Authorization': `Bearer ${process.env.REACT_APP_KNOT_API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log('Knot API response:', response.data);

    if (!response.data || !response.data.session_id) {
      console.error('Invalid response from Knot API:', response.data);
      return res.status(500).json({ 
        error: 'Invalid API response',
        details: 'The Knot API response did not contain a valid session ID'
      });
    }

    return res.json({
      session_id: response.data.session_id
    });
  } catch (error) {
    console.error('Error creating Knot session:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers
    });
    
    if (error.code === 'ECONNABORTED') {
      return res.status(504).json({
        error: 'Request timeout',
        details: 'The Knot API request timed out'
      });
    }

    if (error.response) {
      return res.status(error.response.status).json({
        error: error.response.data?.message || 'Knot API error',
        details: error.response.data
      });
    }

    return res.status(500).json({
      error: 'Internal server error',
      details: error.message
    });
  }
});

// Exchange Plaid public token for access token
app.post('/api/exchange-token', async (req, res) => {
  try {
    const { public_token } = req.body;
    
    if (!public_token) {
      return res.status(400).json({ 
        error: 'Public token is required',
        details: 'The public_token parameter is missing from the request body'
      });
    }

    console.log('Exchanging public token for access token...');

    const response = await plaidClient.itemPublicTokenExchange({
      public_token: public_token
    });

    console.log('Token exchange successful:', response.data);

    return res.json({
      access_token: response.data.access_token,
      item_id: response.data.item_id
    });
  } catch (error) {
    console.error('Error exchanging token:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return res.status(500).json({
      error: 'Failed to exchange token',
      details: error.message
    });
  }
});

// Add error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// const PORT = process.env.PORT || 3001;
const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${environment} mode`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Knot API Key configured:', !!process.env.REACT_APP_KNOT_API_KEY);
  console.log('Plaid credentials configured:', {
    clientId: !!process.env.REACT_APP_PLAID_CLIENT_ID,
    secret: !!process.env.REACT_APP_PLAID_SECRET
  });
}); 