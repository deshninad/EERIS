// src/pages/LoginPage/LoginPage.jsx
// Sidebar links now toggle content displayed in the main card area.

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx'; // Verify path
import './LoginPage.css'; // Import the login page CSS

// Verify backend URL
const BASE_URL = 'http://localhost:5001';

const LoginPage = () => {
  // --- State ---
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [role, setRole] = useState("Admin"); // Default role
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingSignIn, setLoadingSignIn] = useState(false);
  const [activeSection, setActiveSection] = useState('login'); // <<< NEW STATE: 'login', 'howToUse', 'features', 'support', 'terms'

  // --- Hooks ---
  const navigate = useNavigate();
  const auth = useAuth();
  const login = auth ? auth.login : null;

  // --- Handlers ---
  const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();
  const validateEmail = (email) => email.includes('@');

  const handleSendOtp = async () => {
    setError('');
    if (!email.endsWith("@usf.edu")) { setError("Please enter a valid USF email."); return; }
    setLoadingOtp(true);
    try {
      const { data: users } = await axios.get(`${BASE_URL}/get-users`);
      const isEmployee = users.employees?.includes(email);
      const isAdmin = users.admins?.includes(email);
      if (role === 'Employee' && !isEmployee) { setError('Access denied: Not registered as an employee.'); setLoadingOtp(false); return; }
      if (role === 'Admin' && !isAdmin && !isEmployee) { setError('Access denied: Not registered for admin access.'); setLoadingOtp(false); return; }

      const gen = generateOtp(); setGeneratedOtp(gen); console.log("Generated OTP:", gen);
      const { data: otpRes } = await axios.post(`${BASE_URL}/send-OTP`, { email, otp: gen, role: role.toLowerCase() });
      if (otpRes && otpRes.success) { setError(''); setOtpSent(true); /* alert('OTP sent!'); */ } // Removed alert
      else { setError(otpRes?.message || 'Failed to send OTP.'); }
    } catch (err) { console.error("Error sending OTP:", err); setError(err.response?.data?.message || 'Server error sending OTP.'); setOtpSent(false); }
    finally { setLoadingOtp(false); }
  };

  const handleLogin = () => {
    if (!login) { setError("Auth system not ready."); return; }
    if (!otp || !email) { setError("Please enter email and OTP."); return; }
    setLoadingSignIn(true); setError('');
    if (otp === generatedOtp && otp !== '') {
      login(email, role.toLowerCase(), false); // Pass role, remember=false
      navigate(role === "Admin" ? "/adminDashboard" : "/upload", { replace: true });
    } else { setError('Invalid OTP entered.'); setLoadingSignIn(false); }
  };

  const toggleRole = () => {
    setRole((prev) => (prev === "Admin" ? "Employee" : "Admin"));
    setError(''); setOtpSent(false); setOtp('');
  };

  // --- Helper to render content based on activeSection ---
  const renderInfoContent = (section) => {
      switch(section) {
          case 'howToUse':
              return (
                  <div className="info-content-section">
                      <h3>How to Get Started</h3>
                      <ul>
                          <li>Select your role using the toggle button below the form.</li>
                          <li>Enter your registered USF email address.</li>
                          <li>Click “Send OTP” — check your inbox.</li>
                          <li>Enter the 4‑digit code and hit “Login.”</li>
                      </ul>
                      <p> Need help? Contact <a href="mailto:support@example.com">support@example.com</a>. </p>
                  </div>
              );
          case 'features':
              return (
                  <div className="info-content-section">
                      <h3>Features</h3>
                      <div className="feature-item"> <h4>📊 Live Reports</h4> <p>Real‑time analytics.</p> </div>
                      <div className="feature-item"> <h4>🔒 Secure Access</h4> <p>Two‑factor authentication.</p> </div>
                      <div className="feature-item"> <h4>⚙️ Easy Administration</h4> <p>Manage users & requests.</p> </div>
                  </div>
              );
          case 'support':
              return (
                  <div className="info-content-section">
                      <h3>Support & Contact</h3>
                      <p>If you encounter any issues or require assistance, please reach out to our support team:</p>
                      <p><strong>Email:</strong> <a href="mailto:support@example.com">support@example.com</a></p>
                      <p><strong>Phone:</strong> (555) 123-4567 (Mon-Fri, 9am-5pm)</p>
                      {/* Add more support details if needed */}
                  </div>
              );
          case 'terms':
              return (
                  <div className="info-content-section">
                      <h3>Terms & Privacy</h3>
                       {/* Link to actual policy pages */}
                      <p><a href="/terms" target="_blank" rel="noopener noreferrer">⚖️ Read our Terms of Service</a></p>
                      <p><a href="/privacy" target="_blank" rel="noopener noreferrer">🔒 Read our Privacy Policy</a></p>
                      <p>By using EERIS, you agree to abide by our terms and policies regarding data usage and security.</p>
                  </div>
              );
          default:
              return null; // Should not happen if 'login' is handled separately
      }
  }

  // --- Render ---
  return (
    <div className="login-container"> {/* Main container with gradient */}

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">EERIS</div>
        <nav className="sidebar-nav">
          {/* Update onClick to set activeSection state */}
          <div className={`menu-item ${activeSection === 'login' ? 'selected' : ''}`} onClick={() => setActiveSection('login')}>
            🔑 Login
          </div>
          <div className={`menu-item ${activeSection === 'howToUse' ? 'selected' : ''}`} onClick={() => setActiveSection('howToUse')}>
            📖 How to Use
          </div>
          <div className={`menu-item ${activeSection === 'features' ? 'selected' : ''}`} onClick={() => setActiveSection('features')}>
             ✨ Features
          </div>
          <div className={`menu-item ${activeSection === 'support' ? 'selected' : ''}`} onClick={() => setActiveSection('support')}>
             📞 Support & Contact
          </div>
          <div className={`menu-item ${activeSection === 'terms' ? 'selected' : ''}`} onClick={() => setActiveSection('terms')}>
             ⚖️ Terms & Privacy
          </div>
        </nav>
      </aside>

      {/* Form Section */}
      <main className="form-section">
        <div className="login-card">
          {/* Conditionally render Login Form or Info Content */}
          {activeSection === 'login' ? (
            // Login Form Content
            <>
              <h2>{otpSent ? 'Enter OTP Code' : `${role} Login`}</h2>
              {error && <p className="error-message">{error}</p>}

              {!otpSent ? (
                <>
                  <input id="email" name="email" type="email" className="input-field" placeholder="Enter USF Email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={loadingOtp} autoComplete="email" />
                  <div className="button-group">
                    <button className="btn otp-btn" onClick={handleSendOtp} disabled={loadingOtp || !validateEmail(email)} > {loadingOtp ? 'Sending...' : 'Send OTP'} </button>
                  </div>
                </>
              ) : (
                <>
                  <p style={{fontSize: '0.9rem', color: '#4a5568', marginBottom: '1rem'}}> An OTP has been sent to {email}. </p>
                  <input id="otp" name="otp" type="text" inputMode="numeric" pattern="\d{4}" maxLength="4" className="input-field" placeholder="Enter 4-digit OTP" value={otp} onChange={(e) => setOtp(e.target.value)} disabled={loadingSignIn} autoComplete="one-time-code" />
                   <div className="button-group">
                    <button className="btn login-btn" onClick={handleLogin} disabled={loadingSignIn || otp.length !== 4} > {loadingSignIn ? 'Logging In...' : '✔ Login'} </button>
                   </div>
                   <button className="resend-btn" style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.9rem' }} onClick={() => setOtpSent(false)} disabled={loadingSignIn || loadingOtp} > Back to Email </button>
                </>
              )}

              <button className="toggle-btn" onClick={toggleRole} disabled={loadingOtp || loadingSignIn}>
                👤 Login as {role === "Admin" ? "Employee" : "Admin"} instead
              </button>
            </>
          ) : (
            // Informational Content
            renderInfoContent(activeSection)
          )}
        </div>
      </main>
    </div>
  );
};

export default LoginPage;