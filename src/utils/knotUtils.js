import axios from 'axios';

const KNOT_API_KEY = process.env.REACT_APP_KNOT_API_KEY;
const KNOT_API_URL = 'https://api.knotapi.com/v1';

// Mock data for development
const mockData = {
  merchant: {
    id: 45,
    name: "Walmart"
  },
  transactions: [
    {
      id: "66e35383-990c-4934-a766-c600ee632d27",
      external_id: "2ca2fdd5-ec2c-47ef-813d-463ef3951b5f",
      datetime: "2024-11-10T00:00:00+00:00",
      url: "https://www.walmart.com/orders/123123123rand",
      order_status: "ORDERED",
      payment_methods: [
        {
          external_id: "323245",
          type: "CARD",
          brand: "EBT",
          last_four: "1111",
          name: null,
          transaction_amount: 32.23
        },
        {
          external_id: "592134",
          type: "CARD",
          brand: "AMEX",
          last_four: "1111",
          name: null,
          transaction_amount: 27.77
        }
      ],
      price: {
        sub_total: 60,
        adjustments: [],
        total: 60,
        currency: "USD"
      },
      products: [
        {
          external_id: "10315643",
          name: "Aleve Tablets with Easy Open Arthritis Cap, Naproxen Sodium, for Pain Relief, 200 Count",
          url: "https://www.walmart.com/ip/576115402",
          quantity: 1,
          eligibility: [],
          price: {
            sub_total: 30,
            total: 30,
            unit_price: 30
          }
        },
        {
          external_id: "880919144",
          name: "Freshness Guaranteed Hawaiian Dinner Rolls, 16 oz, 12 Count (Regular)",
          url: "https://www.walmart.com/ip/880919144",
          quantity: 1,
          eligibility: [],
          price: {
            sub_total: 30,
            total: 30,
            unit_price: 30
          }
        }
      ]
    },
    // ... other transactions from mock data
  ],
  next_cursor: "eyJpZCI6MTI3NjEsIl9wb2ludHNUb05leHRJdGVtcyI6dHJ1ZX0",
  limit: 5
};

// Initialize KnotAPI client
const knotClient = axios.create({
  baseURL: KNOT_API_URL,
  headers: {
    'Authorization': `Bearer ${KNOT_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

// Mock API functions for development
export const getLinkedCards = async (userId) => {
  // Extract unique payment methods from transactions
  const uniqueCards = new Map();
  mockData.transactions.forEach(transaction => {
    transaction.payment_methods.forEach(method => {
      if (!uniqueCards.has(method.external_id)) {
        uniqueCards.set(method.external_id, {
          id: method.external_id,
          brand: method.brand,
          last4: method.last_four,
          type: method.type,
          name: method.name || `${method.brand} Card`
        });
      }
    });
  });
  return Array.from(uniqueCards.values());
};

export const getTransactions = async (userId) => {
  return mockData.transactions.map(transaction => ({
    id: transaction.id,
    date: transaction.datetime,
    amount: transaction.price.total,
    status: transaction.order_status,
    merchant: mockData.merchant.name,
    payment_methods: transaction.payment_methods,
    products: transaction.products
  }));
};

export const getMerchantDetails = async (merchantId) => {
  return {
    id: mockData.merchant.id,
    name: mockData.merchant.name,
    transaction_count: mockData.transactions.length,
    total_spent: mockData.transactions.reduce((sum, t) => sum + t.price.total, 0),
    last_transaction: new Date(Math.max(...mockData.transactions.map(t => new Date(t.datetime)))),
    average_transaction: mockData.transactions.reduce((sum, t) => sum + t.price.total, 0) / mockData.transactions.length
  };
};

export const getUserMerchants = async (userId) => {
  const merchantDetails = await getMerchantDetails(mockData.merchant.id);
  return [merchantDetails];
};

export const switchPaymentMethod = async (userId, transactionId, newCardId) => {
  // Find the transaction and update its payment method
  const transaction = mockData.transactions.find(t => t.id === transactionId);
  if (!transaction) {
    throw new Error('Transaction not found');
  }

  // Find the new card details
  const newCard = (await getLinkedCards(userId)).find(card => card.id === newCardId);
  if (!newCard) {
    throw new Error('Card not found');
  }

  // Update the payment method
  transaction.payment_methods = [{
    external_id: newCard.id,
    type: newCard.type,
    brand: newCard.brand,
    last_four: newCard.last4,
    name: newCard.name,
    transaction_amount: transaction.price.total
  }];

  return transaction;
};

// Add new card function
export const linkCard = async (userId, cardData) => {
  // Generate a unique ID for the new card
  const newCardId = `card_${Date.now()}`;

  // Create new card object
  const newCard = {
    id: newCardId,
    brand: cardData.brand || 'UNKNOWN',
    last4: cardData.last4 || '****',
    type: cardData.type || 'CARD',
    name: cardData.name || `${cardData.brand || 'Card'} Card`,
    exp_month: cardData.exp_month,
    exp_year: cardData.exp_year
  };

  // Add the card to a mock transaction to simulate it being linked
  mockData.transactions.push({
    id: `txn_${Date.now()}`,
    external_id: `ext_${Date.now()}`,
    datetime: new Date().toISOString(),
    url: "https://www.walmart.com/orders/mock",
    order_status: "COMPLETED",
    payment_methods: [{
      external_id: newCardId,
      type: newCard.type,
      brand: newCard.brand,
      last_four: newCard.last4,
      name: newCard.name,
      transaction_amount: 0
    }],
    price: {
      sub_total: 0,
      adjustments: [],
      total: 0,
      currency: "USD"
    },
    products: []
  });

  return newCard;
};

// Function to fetch transactions from Plaid API
export const getPlaidTransactions = async () => {
  try {
    const response = await axios.get('/api/transactions');

    // Check if transactions exist in the response
    if (!response.data || !response.data.transactions || !Array.isArray(response.data.transactions)) {
      console.warn('No transactions data found in the response');
      return [];
    }

    return response.data.transactions.map(transaction => ({
      id: transaction.transaction_id || transaction.id || `txn_${Math.random().toString(36).substr(2, 9)}`,
      date: transaction.date,
      amount: transaction.amount,
      name: transaction.name || 'Unknown Transaction',
      merchant: transaction.merchant_name || 'Unknown',
      category: transaction.category && transaction.category.length > 0 ? transaction.category[0] : 'Uncategorized',
      account_id: transaction.account_id,
      payment_channel: transaction.payment_channel || 'other',
      pending: transaction.pending || false,
      raw: transaction // Keep the raw transaction data for reference
    }));
  } catch (error) {
    console.error('Error fetching Plaid transactions:', error);
    // Return empty array instead of throwing to prevent page from breaking
    return [];
  }
};

// Add response interceptor for better error handling
knotClient.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      console.error('KnotAPI Error:', {
        status: error.response.status,
        data: error.response.data,
        message: error.response.data.message || 'An error occurred'
      });
      throw new Error(error.response.data.message || 'An error occurred');
    } else if (error.request) {
      console.error('No response received from KnotAPI');
      throw new Error('No response received from server');
    } else {
      console.error('Error setting up KnotAPI request:', error.message);
      throw new Error('Failed to set up request');
    }
  }
);
