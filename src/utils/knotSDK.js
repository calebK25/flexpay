// Load the Knot SDK from the CDN
import axios from 'axios';
import KnotapiJS from "knotapi-js";

const script = document.createElement('script');
script.src = 'https://unpkg.com/knotapi-js@next';
document.head.appendChild(script);

const KNOT_ID = process.env.REACT_APP_KNOT_CLIENT_ID;
const KNOT_SECRET = process.env.REACT_APP_KNOT_SECRET;

class KnotSDK {
  constructor() {
    // Wait for the script to load before initializing
    script.onload = () => {
      this.knotapi = new window.KnotapiJS.default();
      this.processorToken = null;
      
      // List of supported merchants for testing
      this.supportedMerchants = [
        {
          id: 'merchant_123',
          name: 'Amazon',
          description: 'Amazon.com'
        },
        {
          id: 'merchant_456',
          name: 'Walmart',
          description: 'Walmart.com'
        },
        {
          id: 'merchant_789',
          name: 'Target',
          description: 'Target.com'
        },
        {
          id: 'merchant_101',
          name: 'Best Buy',
          description: 'BestBuy.com'
        },
        {
          id: 'merchant_102',
          name: 'Costco',
          description: 'Costco.com'
        }
      ];
    };
  }

  async createProcessorToken(accessToken, accountId) {
    try {
      const response = await fetch('http://localhost:3001/api/create-processor-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken,
          account_id: accountId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create processor token');
      }

      const data = await response.json();
      this.processorToken = data.processor_token;
      return data.processor_token;
    } catch (error) {
      console.error('Error creating processor token:', error);
      throw error;
    }
  }

  async createSession() {
    try {
      console.log('Creating Knot session with clientId:', process.env.REACT_APP_KNOT_CLIENT_ID);
      const clientId = process.env.REACT_APP_KNOT_CLIENT_ID;
      if (!process.env.REACT_APP_KNOT_CLIENT_ID) {
        throw new Error('Knot Client ID is not configured');
      }

      const product = 'transaction_link';

      try {
        const requestBody = {
          external_user_id: "test",
          type: product || 'transaction_link',
          ...(product === "card_switcher" && { card_id: "test" })
        };
        console.log('Creating Knot session with:', { clientId, product });
    
        if (!clientId) {
          throw new Error('Client ID is required');
        }
        
        console.log('Sending request to Knot API:', requestBody);
        const basicAuthHeader = 'Basic ' + btoa(`${process.env.REACT_APP_KNOT_CLIENT_ID}:${process.env.REACT_APP_KNOT_API_KEY}`);
        console.log('Basic auth header:', basicAuthHeader);
        const res = await axios.post('https://development.knotapi.com/session/create', requestBody, {
          headers: {
            'Authorization': basicAuthHeader,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
    
        console.log('Knot API response:', res.data);
    
        if (!res.data || !res.data.session) {
          throw new Error('Invalid response from Knot API');
        }
    
        res.json({
          session_id: res.data.session
        });
      } catch (error) {
        console.error('Error creating Knot session:', error.res?.data || error.message);
        res.status(500).json({
          error: error.response?.data?.message || error.message || 'Failed to create Knot session'
        });
      }

      console.log('Response status:', response.status);
      
      if (!res.ok) {
        const errorData = await res.json();
        console.error('Server error response:', errorData);
        throw new Error(errorData.error || 'Failed to create session');
      }

      const data = await response.json();
      console.log('Session created successfully:', data);

      if (!data.session_id) {
        throw new Error('No session ID received from server');
      }

      return data.session_id;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async openCardSwitcher(merchantId) {
    const knotapi = new KnotapiJS();

    // Invoke the open method with parameters
    knotapi.open({
      sessionId: "d0817c84-f148-49cd-b5b4-d836ea716c8e",
      clientId: "23c681b3-86c2-4afc-a893-93b851681283",
      environment: "development",  // or "production"
      product: "card_switcher",  // or "transaction_link"
      merchantIds: [17],
      entryPoint: "onboarding"
    });
    // try {
    //   const response = await axios.post('https://development.knotapi.com/card', {
    //     merchant_id: merchantId,
    //     client_id: KNOT_ID,
    //     client_secret: KNOT_SECRET
    //   });
    //   return response.data;
    // } catch (error) {
    //   console.error('Error opening card switcher:', error);
    //   throw error;
    // }
  }

  async openTransactionLink(merchantId) {
    try {
      const response = await axios.post('https://development.knotapi.com/transaction-link', {
        merchant_id: merchantId,
        client_id: KNOT_ID,
        client_secret: KNOT_SECRET
      });
      return response.data;
    } catch (error) {
      console.error('Error opening transaction link:', error);
      throw error;
    }
  }

  // Helper method to get supported merchants
  getSupportedMerchants() {
    return this.supportedMerchants;
  }
}

export const knotSDK = new KnotSDK(); 