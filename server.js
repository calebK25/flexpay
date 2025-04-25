const express = require('express');
const cors = require('cors');
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
// express.json() already handles JSON parsing

// Webhook endpoint for Knot API events
app.post('/webhook/knot', async (req, res) => {
  try {
    console.log("Received webhook request body:", JSON.stringify(req.body, null, 2));
    
    const { event_type, data } = req.body;
    
    if (!event_type) {
      console.error('Missing event_type in webhook request');
      return res.status(400).json({ 
        error: 'Missing event type',
        details: 'The event_type parameter is required in the webhook request'
      });
    }

    let response = { received: true };

    switch (event_type) {
      case 'card':
        console.log('Card event received:', data);
        try {
          // Call the /card endpoint to add the card using POST
          const myHeaders = new Headers();
          myHeaders.append("Content-Type", "application/json");

          // Replace "your_username" and "your_password" with your actual credentials
          const credentials = btoa("23c681b3-86c2-4afc-a893-93b851681283:d540d93a7d544cbaa1ee501780a6c347");
          myHeaders.append("Authorization", "Basic " + credentials);

          const raw = JSON.stringify({
            "task_id": data.task_id || "35205", // Use task_id from data or default
            "user": {
              "name": {
                "first_name": "Ada",
                "last_name": "Lovelace"
              },
              "phone_number": "+11234567890",
              "address": {
                "street": "100 Main Street",
                "street2": "#100",
                "city": "New York",
                "region": "NY",
                "postal_code": "12345",
                "country": "US"
              }
            },
            "card": {
              "number": "4242424242424242",
              "expiration": "08/2025",
              "cvv": "123"
            }
          });

          console.log('Sending request to Knot API with body:', raw);

          const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
          };

          const knotResponse = await fetch("https://development.knotapi.com/card", requestOptions);
          const result = await knotResponse.text();
          console.log('Knot API response:', result);

          response = { 
            success: true, 
            message: 'Card added successfully',
            data: result 
          };
        } catch (cardError) {
          console.error('Error adding card:', cardError);
          response = { 
            error: 'Failed to add card',
            details: cardError.message
          };
        }
        break;

      case 'card_switch_success':
        console.log('Card switch successful:', data);
        response = { success: true, message: 'Card switch successful', data };
        break;

      case 'card_switch_failed':
        console.log('Card switch failed:', data);
        response = { success: false, message: 'Card switch failed', data };
        break;

      case 'payment_success':
        console.log('Payment successful:', data);
        response = { success: true, message: 'Payment successful', data };
        break;

      case 'payment_failed':
        console.log('Payment failed:', data);
        response = { success: false, message: 'Payment failed', data };
        break;

      default:
        console.log('Unhandled event type:', event_type);
        response = { 
          success: false, 
          message: 'Unhandled event type',
          event_type 
        };
    }

    // Always send a response
    return res.status(200).json(response);
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      error: 'Webhook processing failed',
      details: error.message
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

// Add credit limit adjustment endpoint
app.post('/api/adjust-credit-limit', async (req, res) => {
  try {
    const { userId, transactionData } = req.body;
    
    if (!userId || !transactionData) {
      return res.status(400).json({
        error: 'Missing required data',
        details: 'userId and transactionData are required'
      });
    }

    // Get current credit limit from storage (in production, this would be from a database)
    let currentLimit = 10000; // Default limit

    // Calculate risk score based on transaction data
    const riskScore = calculateRiskScore(transactionData);
    
    // Determine new credit limit based on risk score
    let newLimit = currentLimit;
    if (riskScore >= 0.7) {
      newLimit = currentLimit * 1.2; // 20% increase for low risk
    } else if (riskScore >= 0.5) {
      newLimit = currentLimit; // No change for medium risk
    } else if (riskScore >= 0.3) {
      newLimit = currentLimit * 0.8; // 20% decrease for high risk
    } else {
      newLimit = currentLimit * 0.5; // 50% decrease for critical risk
    }

    // Ensure the new limit stays within reasonable bounds
    const minLimit = 1000; // Minimum $1,000
    const maxLimit = 50000; // Maximum $50,000
    newLimit = Math.min(Math.max(newLimit, minLimit), maxLimit);

    // Log the adjustment
    console.log(`Credit limit adjustment for user ${userId}:
      Previous limit: $${currentLimit}
      New limit: $${newLimit}
      Risk score: ${riskScore}
      Transaction data: ${JSON.stringify(transactionData)}
    `);

    return res.json({
      success: true,
      newCreditLimit: newLimit,
      riskScore,
      previousLimit: currentLimit
    });
  } catch (error) {
    console.error('Error adjusting credit limit:', error);
    return res.status(500).json({
      error: 'Failed to adjust credit limit',
      details: error.message
    });
  }
});

// Helper function to calculate risk score
function calculateRiskScore(transactionData) {
  const {
    missedPayments = 0,
    totalPayments = 0,
    averageTransactionAmount = 0,
    maxTransactionAmount = 0,
    accountAge = 0,
    creditUtilization = 0
  } = transactionData;

  // Calculate individual risk factors
  const missedPaymentScore = 1 - (missedPayments / Math.max(totalPayments, 1));
  const transactionVolatilityScore = 1 - (maxTransactionAmount / (averageTransactionAmount * 2));
  const accountAgeScore = Math.min(1, accountAge / 2); // Max score after 2 years
  const utilizationScore = 1 - creditUtilization;

  // Weighted average of risk factors
  const riskScore = (
    missedPaymentScore * 0.3 +
    transactionVolatilityScore * 0.2 +
    accountAgeScore * 0.2 +
    utilizationScore * 0.3
  );

  return Math.max(0, Math.min(1, riskScore));
}

// Add error handling middleware
app.use((req, res, next) => {
  console.log(`Received request: ${req.method} ${req.url}`);
  next();
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Knot API Key configured:', !!process.env.REACT_APP_KNOT_API_KEY);
}); 