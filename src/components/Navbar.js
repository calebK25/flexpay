import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          FlexPay
        </Link>
        
        <div className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          <Link to="/products" className="navbar-item">Products</Link>
          <Link to="/solutions" className="navbar-item">Solutions</Link>
          <Link to="/developers" className="navbar-item">Developers</Link>
          <Link to="/company" className="navbar-item">Company</Link>
          <Link to="/pricing" className="navbar-item">Pricing</Link>
        </div>

        <div className="navbar-buttons">
          <Link to="/sign-in" className="navbar-signin">Sign in</Link>
          <Link to="/start" className="navbar-start">
            <span>Start now</span>
          </Link>
        </div>

        <button className="navbar-toggle" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
