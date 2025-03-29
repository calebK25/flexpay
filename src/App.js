import React, { useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/solutions" element={<Solutions />} />
            <Route path="/developers" element={<Developers />} />
            <Route path="/company" element={<Company />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/start" element={<Start />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

const Home = () => {
  const gradientRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!gradientRef.current) return;
      
      const { left, top, width, height } = gradientRef.current.getBoundingClientRect();
      const x = (e.clientX - left) / width;
      const y = (e.clientY - top) / height;
      
      gradientRef.current.style.setProperty('--x', `${x * 100}%`);
      gradientRef.current.style.setProperty('--y', `${y * 100}%`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="home">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Payments infrastructure
            <br />
            for the internet
          </h1>
          <p className="hero-subtitle">
            Millions of companies of all sizes use FlexPay to accept payments and
            manage their businesses online.
          </p>
          <div className="hero-buttons">
            <button className="start-button">Start now</button>
            <button className="contact-button">Contact sales</button>
          </div>
        </div>
        <div className="hero-visual" ref={gradientRef}>
          <div className="gradient-overlay"></div>
          <div className="cards-container">
            <div className="card card-1"></div>
            <div className="card card-2"></div>
            <div className="card card-3"></div>
          </div>
        </div>
      </div>
      
      <div className="features-section">
        <div className="feature">
          <div className="feature-icon">💳</div>
          <h3>Accept payments</h3>
          <p>Accept payments from customers anywhere in the world</p>
        </div>
        <div className="feature">
          <div className="feature-icon">🔄</div>
          <h3>Automate billing</h3>
          <p>Automate recurring billing and subscription management</p>
        </div>
        <div className="feature">
          <div className="feature-icon">📊</div>
          <h3>Analytics</h3>
          <p>Get detailed insights into your business performance</p>
        </div>
      </div>
    </div>
  );
};

const Products = () => <div className="page">Products Page</div>;
const Solutions = () => <div className="page">Solutions Page</div>;
const Developers = () => <div className="page">Developers Page</div>;
const Company = () => <div className="page">Company Page</div>;
const Pricing = () => <div className="page">Pricing Page</div>;
const SignIn = () => <div className="page">Sign In Page</div>;
const Start = () => <div className="page">Start Page</div>;

export default App;


