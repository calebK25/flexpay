import axios from 'axios';

const KNOT_API_URL = 'https://api.knotapi.com/v2';
const KNOT_CLIENT_ID = process.env.REACT_APP_KNOT_CLIENT_ID;
const KNOT_SECRET = process.env.REACT_APP_KNOT_SECRET;

const getKnotClient = () => {
  const auth = 'Basic ' + btoa(`${KNOT_CLIENT_ID}:${KNOT_SECRET}`);

  
  return {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Knot-Version': '2.0'
    }
  };
};

// Get linked cards
export const getLinkedCards = async () => {
  try {
    const response = await axios.get(`${KNOT_API_URL}/cards`, getKnotClient());
    return response.data;
  } catch (error) {
    console.error('Error getting linked cards:', error);
    throw error;
  }
};

// Get transactions with pagination, filtering, and sorting
export const getTransactions = async (options = {}) => {
  const {
    cursor = null,
    count = 100,
    filters = {},
    sort = { field: 'date', direction: 'desc' },
    includeOptions = {
      include_pending: true,
      include_failed: true,
      include_refunds: true,
      include_disputes: true,
      include_subscriptions: true
    }
  } = options;

  try {
    const response = await axios.post(
      `${KNOT_API_URL}/transactions/sync`,
      {
        cursor,
        count,
        options: includeOptions,
        filters: {
          date_range: filters.dateRange,
          amount_range: filters.amountRange,
          status: filters.status,
          merchant: filters.merchant,
          card_id: filters.cardId,
          subscription_id: filters.subscriptionId,
          dispute_status: filters.disputeStatus
        },
        sort: {
          field: sort.field,
          direction: sort.direction
        }
      },
      getKnotClient()
    );

    console.log('Transactions sync response:', response.data);

    if (!response.data.transactions) {
      console.error('No transactions in response:', response.data);
      return {
        transactions: [],
        hasMore: false,
        nextCursor: null,
        syncId: null
      };
    }

    return {
      transactions: response.data.transactions.map(transaction => ({
        id: transaction.id,
        date: transaction.datetime,
        amount: transaction.price.total,
        status: transaction.order_status,
        merchant: transaction.merchant?.name || 'Unknown Merchant',
        payment_methods: transaction.payment_methods,
        products: transaction.products,
        card_id: transaction.card_id,
        card_last_four: transaction.card_last_four,
        card_brand: transaction.card_brand,
        sync_id: response.data.sync_id,
        // Additional transaction details
        currency: transaction.price.currency,
        subtotal: transaction.price.subtotal,
        tax: transaction.price.tax,
        shipping: transaction.price.shipping,
        discount: transaction.price.discount,
        refunded_amount: transaction.refunded_amount,
        dispute_status: transaction.dispute_status,
        subscription_id: transaction.subscription_id,
        subscription_status: transaction.subscription_status,
        subscription_interval: transaction.subscription_interval,
        subscription_next_billing_date: transaction.subscription_next_billing_date,
        customer_email: transaction.customer_email,
        customer_name: transaction.customer_name,
        billing_address: transaction.billing_address,
        shipping_address: transaction.shipping_address,
        metadata: transaction.metadata,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      })),
      hasMore: response.data.has_more,
      nextCursor: response.data.next_cursor,
      syncId: response.data.sync_id
    };
  } catch (error) {
    console.error('Error syncing transactions:', error.response?.data || error.message);
    throw error;
  }
};

// Get all transactions with filtering and sorting
export const getAllTransactions = async (options = {}) => {
  const {
    maxTransactions = 1000,
    filters = {},
    sort = { field: 'date', direction: 'desc' }
  } = options;

  let allTransactions = [];
  let hasMore = true;
  let cursor = null;
  let totalFetched = 0;
  let lastSyncId = null;

  try {
    while (hasMore && totalFetched < maxTransactions) {
      const response = await getTransactions({
        cursor,
        filters,
        sort
      });
      
      allTransactions = [...allTransactions, ...response.transactions];
      hasMore = response.hasMore;
      cursor = response.nextCursor;
      lastSyncId = response.syncId;
      totalFetched += response.transactions.length;

      console.log(`Fetched ${totalFetched} transactions so far...`);
    }

    return {
      transactions: allTransactions,
      total: totalFetched,
      syncId: lastSyncId
    };
  } catch (error) {
    console.error('Error fetching all transactions:', error);
    throw error;
  }
};

// Perform incremental sync with filtering and sorting
export const syncNewTransactions = async (syncId, options = {}) => {
  const {
    filters = {},
    sort = { field: 'date', direction: 'desc' }
  } = options;

  try {
    const response = await axios.post(
      `${KNOT_API_URL}/transactions/sync`,
      {
        sync_id: syncId,
        count: 100,
        options: {
          include_pending: true,
          include_failed: true,
          include_refunds: true,
          include_disputes: true,
          include_subscriptions: true
        },
        filters: {
          date_range: filters.dateRange,
          amount_range: filters.amountRange,
          status: filters.status,
          merchant: filters.merchant,
          card_id: filters.cardId,
          subscription_id: filters.subscriptionId,
          dispute_status: filters.disputeStatus
        },
        sort: {
          field: sort.field,
          direction: sort.direction
        }
      },
      getKnotClient()
    );

    if (!response.data.transactions) {
      return {
        transactions: [],
        hasMore: false,
        nextCursor: null,
        syncId: response.data.sync_id
      };
    }

    return {
      transactions: response.data.transactions.map(transaction => ({
        id: transaction.id,
        date: transaction.datetime,
        amount: transaction.price.total,
        status: transaction.order_status,
        merchant: transaction.merchant?.name || 'Unknown Merchant',
        payment_methods: transaction.payment_methods,
        products: transaction.products,
        card_id: transaction.card_id,
        card_last_four: transaction.card_last_four,
        card_brand: transaction.card_brand,
        sync_id: response.data.sync_id,
        // Additional transaction details
        currency: transaction.price.currency,
        subtotal: transaction.price.subtotal,
        tax: transaction.price.tax,
        shipping: transaction.price.shipping,
        discount: transaction.price.discount,
        refunded_amount: transaction.refunded_amount,
        dispute_status: transaction.dispute_status,
        subscription_id: transaction.subscription_id,
        subscription_status: transaction.subscription_status,
        subscription_interval: transaction.subscription_interval,
        subscription_next_billing_date: transaction.subscription_next_billing_date,
        customer_email: transaction.customer_email,
        customer_name: transaction.customer_name,
        billing_address: transaction.billing_address,
        shipping_address: transaction.shipping_address,
        metadata: transaction.metadata,
        created_at: transaction.created_at,
        updated_at: transaction.updated_at
      })),
      hasMore: response.data.has_more,
      nextCursor: response.data.next_cursor,
      syncId: response.data.sync_id
    };
  } catch (error) {
    console.error('Error performing incremental sync:', error.response?.data || error.message);
    throw error;
  }
};

// Switch payment method for a transaction
export const switchCard = async (transactionId, newCardId) => {
  try {
    const response = await axios.post(
      `${KNOT_API_URL}/transactions/${transactionId}/switch`,
      { card_id: newCardId },
      getKnotClient()
    );
    return response.data;
  } catch (error) {
    console.error('Error switching card:', error);
    throw error;
  }
};

// Get available cards for a transaction
export const getAvailableCards = async (transactionId) => {
  try {
    console.log('Fetching available cards for transaction:', transactionId);
    const response = await axios.get(
      `${KNOT_API_URL}/transactions/${transactionId}/available-cards`,
      getKnotClient()
    );
    console.log('Available cards response:', response.data);
    return response.data.cards;
  } catch (error) {
    console.error('Error fetching available cards:', error.response?.data || error.message);
    throw error;
  }
};

// Link a new card
export const linkCard = async (cardDetails) => {
  try {
    const response = await axios.post(
      `${KNOT_API_URL}/cards`,
      cardDetails,
      getKnotClient()
    );
    return response.data;
  } catch (error) {
    console.error('Error linking card:', error);
    throw error;
  }
};

// Add response interceptor for better error handling
axios.interceptors.response.use(
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
