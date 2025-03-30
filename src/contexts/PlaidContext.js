import React, { createContext, useContext, useReducer } from 'react';

const PlaidContext = createContext(null);

const initialState = {
  linkToken: null,
  accessToken: null,
  loading: false,
  error: null
};

const plaidReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LINK_TOKEN':
      return { ...state, linkToken: action.payload };
    case 'SET_ACCESS_TOKEN':
      return { ...state, accessToken: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export const PlaidProvider = ({ children }) => {
  const [state, dispatch] = useReducer(plaidReducer, initialState);

  return (
    <PlaidContext.Provider value={{ state, dispatch }}>
      {children}
    </PlaidContext.Provider>
  );
};

export const usePlaid = () => {
  const context = useContext(PlaidContext);
  if (!context) {
    throw new Error('usePlaid must be used within a PlaidProvider');
  }
  return context;
}; 