import axios from 'axios';

const PLAID_API_URL = 'https://sandbox.plaid.com';

// Generate random transactions
export const generateRandomTransactions = () => {
  const merchants = [
    { name: 'Walmart', category: 'shopping' },
    { name: 'Amazon', category: 'shopping' },
    { name: 'Target', category: 'shopping' },
    { name: 'Costco', category: 'shopping' },
    { name: 'Netflix', category: 'entertainment' },
    { name: 'Spotify', category: 'entertainment' },
    { name: 'Uber', category: 'transportation' },
    { name: 'DoorDash', category: 'food' },
    { name: 'Starbucks', category: 'food' },
    { name: 'McDonald\'s', category: 'food' }
  ];

  const transactions = [];
  const now = new Date();
  
  // Generate 20 random transactions
  for (let i = 0; i < 20; i++) {
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const amount = (Math.random() * 200 + 10).toFixed(2);
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // Random date within last 30 days
    
    transactions.push({
      transaction_id: `txn_${Math.random().toString(36).substr(2, 9)}`,
      account_id: `acc_${Math.random().toString(36).substr(2, 9)}`,
      amount: parseFloat(amount),
      date: date.toISOString().split('T')[0],
      name: merchant.name,
      merchant_name: merchant.name,
      category: [merchant.category],
      payment_channel: 'online',
      pending: Math.random() > 0.8, // 20% chance of being pending
      account_owner: null,
      iso_currency_code: 'USD',
      unofficial_currency_code: null,
      payment_methods: [
        {
          external_id: `card_${Math.random().toString(36).substr(2, 9)}`,
          type: 'CARD',
          brand: ['VISA', 'MASTERCARD', 'AMEX'][Math.floor(Math.random() * 3)],
          last_four: Math.floor(Math.random() * 9000 + 1000).toString(),
          name: null,
          transaction_amount: parseFloat(amount)
        }
      ]
    });
  }

  return transactions;
};

// Get transactions (using mock data for now)
export const getPlaidTransactions = async () => {
  try {
    // For development, return mock transactions
    const transactions = generateRandomTransactions();
    
    return transactions.map(transaction => ({
      id: transaction.transaction_id,
      date: transaction.date,
      amount: transaction.amount,
      name: transaction.name,
      merchant: transaction.merchant_name,
      category: transaction.category[0],
      account_id: transaction.account_id,
      payment_channel: transaction.payment_channel,
      pending: transaction.pending,
      payment_methods: transaction.payment_methods
    }));
  } catch (error) {
    console.error('Error fetching Plaid transactions:', error);
    return [];
  }
};

// Get account balance
export const getAccountBalance = async (accountId) => {
  try {
    // Mock balance for development
    return {
      current: 5000,
      available: 4500,
      limit: 10000
    };
  } catch (error) {
    console.error('Error fetching account balance:', error);
    return null;
  }
};

// Get account details
export const getAccountDetails = async (accountId) => {
  try {
    // Mock account details for development
    return {
      name: 'Checking Account',
      type: 'depository',
      subtype: 'checking',
      mask: '1234'
    };
  } catch (error) {
    console.error('Error fetching account details:', error);
    return null;
  }
}; 