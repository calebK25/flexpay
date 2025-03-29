import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Shop from './components/Shop';
import CompleteProfile from './components/CompleteProfile';
import FinancialInfo from './components/FinancialInfo';
import TransactionsPage from './Pages/Transactions';
import './App.css';

// Replace with your actual Google Client ID
const GOOGLE_CLIENT_ID = "412756180625-qnvpftjpspr7bls5umi2vr6shme6e6k0.apps.googleusercontent.com";

const App = () => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Router>
        <div className="app">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/financial-info" element={<FinancialInfo />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
    </GoogleOAuthProvider>
  );
};

export default App;
