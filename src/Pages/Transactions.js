import React, { useState, useEffect } from 'react';
import { getPlaidTransactions } from '../utils/knotUtils';
import PlaidLinkButton from '../components/PlaidLink';
import './Transactions.css';

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [isLinked, setIsLinked] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, [isLinked]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const transactionsData = await getPlaidTransactions();
      setTransactions(transactionsData);
    } catch (err) {
      setError('Failed to load transactions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePlaidSuccess = (data) => {
    console.log('Successfully linked account:', data);
    setIsLinked(true);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return <div className="loading">Loading transactions...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  // Filter and sort transactions
  let filteredTransactions = transactions;

  // Apply search filter
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filteredTransactions = filteredTransactions.filter(transaction =>
      transaction.name?.toLowerCase().includes(term) ||
      transaction.merchant?.toLowerCase().includes(term) ||
      transaction.category?.toLowerCase().includes(term)
    );
  }

  // Apply category filter
  if (filter !== 'all') {
    filteredTransactions = filteredTransactions.filter(transaction =>
      transaction.category?.toLowerCase() === filter.toLowerCase()
    );
  }

  // Sort transactions
  filteredTransactions.sort((a, b) => {
    let comparison = 0;

    if (sortBy === 'date') {
      comparison = new Date(a.date) - new Date(b.date);
    } else if (sortBy === 'amount') {
      comparison = a.amount - b.amount;
    } else if (sortBy === 'name') {
      comparison = (a.name || '').localeCompare(b.name || '');
    } else if (sortBy === 'merchant') {
      comparison = (a.merchant || '').localeCompare(b.merchant || '');
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Get all unique categories for the filter dropdown
  const categories = [...new Set(transactions.map(t => t.category).filter(Boolean))];

  const areSampleTransactions = transactions.some(t => t.id.startsWith('sample-txn'));

  return (
    <div className="transactions-page">
      <div className="transactions-header">
        <h1>Your Transactions</h1>
        <div className="transaction-actions">
          {areSampleTransactions && (
            <div className="plaid-link-container">
              <div className="sample-data-notice">
                <p>Viewing sample transaction data. Link your bank account to see real transactions.</p>
              </div>
              <PlaidLinkButton onSuccess={handlePlaidSuccess} />
            </div>
          )}
          {!areSampleTransactions && (
            <button className="refresh-button" onClick={loadTransactions}>
              Refresh Transactions
            </button>
          )}
        </div>
        <div className="transactions-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-dropdown">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="transactions-table">
        <div className="transactions-table-header">
          <div className="header-cell date" onClick={() => handleSort('date')}>
            Date {sortBy === 'date' && (sortDirection === 'asc' ? '▲' : '▼')}
          </div>
          <div className="header-cell name" onClick={() => handleSort('name')}>
            Description {sortBy === 'name' && (sortDirection === 'asc' ? '▲' : '▼')}
          </div>
          <div className="header-cell merchant" onClick={() => handleSort('merchant')}>
            Merchant {sortBy === 'merchant' && (sortDirection === 'asc' ? '▲' : '▼')}
          </div>
          <div className="header-cell category">
            Category
          </div>
          <div className="header-cell amount" onClick={() => handleSort('amount')}>
            Amount {sortBy === 'amount' && (sortDirection === 'asc' ? '▲' : '▼')}
          </div>
        </div>

        <div className="transactions-table-body">
          {filteredTransactions.length === 0 ? (
            <div className="no-transactions">No transactions found</div>
          ) : (
            filteredTransactions.map(transaction => (
              <div key={transaction.id} className="transaction-row">
                <div className="cell date">{formatDate(transaction.date)}</div>
                <div className="cell name">{transaction.name}</div>
                <div className="cell merchant">{transaction.merchant}</div>
                <div className="cell category">{transaction.category}</div>
                <div className={`cell amount ${transaction.amount < 0 ? 'negative' : ''}`}>
                  {formatCurrency(transaction.amount)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TransactionsPage;
