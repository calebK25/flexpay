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
          id: 17,
          name: 'Amazon',
          description: 'Amazon.com'
        },
        {
          id: 18,
          name: 'Walmart',
          description: 'Walmart.com'
        },
        {
          id: 19,
          name: 'Target',
          description: 'Target.com'
        },
        {
          id: 20,
          name: 'Best Buy',
          description: 'BestBuy.com'
        },
        {
          id: 21,
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

  async createSession(product = 'card_switcher') {
    try {
      if (!KNOT_ID || !KNOT_SECRET) {
        throw new Error('Knot credentials are not configured');
      }

      const requestBody = {
        external_user_id: "user_" + Date.now(),
        type: product,
        ...(product === "card_switcher" && { card_id: "test" })
      };

      console.log('Creating Knot session with:', { clientId: KNOT_ID, product });
      
      const basicAuthHeader = 'Basic ' + btoa(`${KNOT_ID}:${KNOT_SECRET}`);
      const response = await axios.post('https://development.knotapi.com/session/create', requestBody, {
        headers: {
          'Authorization': basicAuthHeader,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Knot API session response:', response.data);

      if (!response.data || !response.data.session) {
        throw new Error('Invalid response from Knot API');
      }

      return response.data.session;
    } catch (error) {
      console.error('Error creating Knot session:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message || 'Failed to create Knot session');
    }
  }

  async openCardSwitcher(merchantId) {
    try {
      // Create a new session for the card switcher
      const sessionId = await this.createSession('card_switcher');
      console.log('Created session for card switcher:', sessionId);

      // Initialize KnotAPI if not already done
      const knotapi = this.knotapi || new KnotapiJS();

      // Find the merchant in our supported list
      const merchant = this.supportedMerchants.find(m => m.id === merchantId) || this.supportedMerchants[0];

      // Invoke the open method with parameters
      await knotapi.open({
        sessionId: sessionId,
        clientId: KNOT_ID,
        environment: "development",
        product: "card_switcher",
        merchantIds: [merchant.id],
        entryPoint: "onboarding",
        onSuccess: (result) => {
          console.log('Card switch successful:', result);
          return result;
        },
        onExit: () => {
          console.log('Card switcher closed');
        },
        onError: (error) => {
          console.error('Card switch error:', error);
          throw error;
        }
      });
    } catch (error) {
      console.error('Error opening card switcher:', error);
      throw error;
    }
  }

  async openTransactionLink(merchantId) {
    try {
      // Create a new session for the transaction link
      const sessionId = await this.createSession('transaction_link');
      console.log('Created session for transaction link:', sessionId);

      // Initialize KnotAPI if not already done
      const knotapi = this.knotapi || new KnotapiJS();

      // Find the merchant in our supported list
      const merchant = this.supportedMerchants.find(m => m.id === merchantId) || this.supportedMerchants[0];

      // Invoke the open method with parameters
      await knotapi.open({
        sessionId: sessionId,
        clientId: KNOT_ID,
        environment: "development",
        product: "transaction_link",
        merchantIds: [merchant.id],
        entryPoint: "onboarding",
        onSuccess: (result) => {
          console.log('Transaction link successful:', result);
          return result;
        },
        onExit: () => {
          console.log('Transaction link closed');
        },
        onError: (error) => {
          console.error('Transaction link error:', error);
          throw error;
        }
      });
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