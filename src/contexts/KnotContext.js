import React, { createContext, useContext, useReducer } from 'react';

const KnotContext = createContext(null);

const initialState = {
  cards: [],
  loading: false,
  error: null
};

const knotReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CARDS':
      return { ...state, cards: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
};

export const KnotProvider = ({ children }) => {
  const [state, dispatch] = useReducer(knotReducer, initialState);

  return (
    <KnotContext.Provider value={{ state, dispatch }}>
      {children}
    </KnotContext.Provider>
  );
};

export const useKnot = () => {
  const context = useContext(KnotContext);
  if (!context) {
    throw new Error('useKnot must be used within a KnotProvider');
  }
  return context;
}; 