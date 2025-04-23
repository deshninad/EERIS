import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx';
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail]           = useState('');
  const [otp, setOtp]               = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSent, setOtpSent]       = useState(false);
  const [error, setError]           = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingSignIn, setLoadingSignIn] = useState(false);
  const [role, setRole]             = useState('employee');
  const [remember, setRemember]     = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const generateOtp = () =>
    Math.floor(1000 + Math.random() * 9000).toString();

  const validateEmail = (email) => email.endsWith('@usf.edu');

  const handleSendOtp = async () => {
    if (!validateEmail(email)) {
      setError('Email must end in @usf.edu');
      return;
    }
    setLoadingOtp(true);
    setError('');
    try {
      const { data: users } = await axios.get(
        'http://localhost:5001/get-users'
      );
      const isEmployee = users.employees.includes(email);
      const isAdmin    = users.admins.includes(email);

      if (role === 'employee' && !isEmployee) {
        setError('Access denied: Not a registered employee.');
        setLoadingOtp(false);
        return;
      }
      if (role === 'admin' && !isAdmin && !isEmployee) {
        setError('Access denied: Not an authorised admin.');
        setLoadingOtp(false);
        return;
      }

      const gen = generateOtp();
      setGeneratedOtp(gen);
      const { data: otpRes } = await axios.post(
        'http://localhost:5001/send-OTP',
        { email, otp: gen, role }
      );
      if (otpRes.success) {
        alert('OTP sent to your email!');
        setOtpSent(true);
      } else {
        setError('Failed to send OTP. Try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Server error. Please try later.');
    } finally {
      setLoadingOtp(false);
    }
  };

  const handleSignIn = () => {
    setLoadingSignIn(true);
    if (otp === generatedOtp) {
      login(email, role, remember);
      navigate(role === 'admin' ? '/adminDashboard' : '/upload');
    } else {
      setError('Invalid OTP.');
    }
    setLoadingSignIn(false);
  };

  return (
    <div className="login-page">
      {/* LEFT PANEL */}
      <div className="login-panel">
        <div className="login-card">
          <div className="accent-stripe" />
          <h2 className="login-title">WELCOME TO EERIS</h2>

          <div className="input-group role-group">
            <label htmlFor="role">I am a</label>
            <select
              id="role"
              className="role-select"
              value={role}
              onChange={e => setRole(e.target.value)}
              disabled={otpSent}
            >
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <div className="input-group">
            <input
              type="email"
              className="input-field"
              placeholder="USF Email **ONLY**"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={otpSent || loadingOtp || loadingSignIn}
            />
          </div>

          <div className="extra-options">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={e => setRemember(e.target.checked)}
              /> Remember this device
            </label>
            {otpSent && !loadingSignIn && (
              <button className="resend-btn" onClick={handleSendOtp}>
                Resend OTP
              </button>
            )}
          </div>

          <div className="input-group">
            <button
              className="send-otp-button"
              onClick={handleSendOtp}
              disabled={loadingOtp || otpSent}
            >
              {loadingOtp ? 'Loading...' : 'Send OTP'}
            </button>
          </div>

          {otpSent && (
            <>
              <div className="input-group">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  disabled={loadingSignIn}
                />
              </div>
              <div className="input-group">
                <button
                  className="sign-in-button"
                  onClick={handleSignIn}
                  disabled={loadingSignIn}
                >
                  {loadingSignIn ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </>
          )}

          {error && <p className="error-message">{error}</p>}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="info-panel">
        <div className="info-cards">
          {/* 1) STEPS */}
          <div className="info-card steps-card">
            <h3>How to Get Started</h3>
            <ul>
              <li>Select your role (Employee or Admin).</li>
              <li>Enter your USF email address.</li>
              <li>Click “Send OTP” — check your inbox.</li>
              <li>Enter the 4‑digit code and hit “Sign In.”</li>
            </ul>
            <p>
              Need help? Contact {' '}
              <a href="mailto:EERISsupport@usf.edu">
                EERISsupport@usf.edu 
              </a>
              {' '}for help.
            </p>
          </div>

          {/* 2) FEATURES */}
          <div className="info-card features-card">
            <h3>Features</h3>
            <div className="feature-list">
              <div className="feature-item">
                <h4>📊 Live Reports</h4>
                <p>Real‑time analytics on expenses & usage.</p>
              </div>
              <div className="feature-item">
                <h4>🔒 Secure Access</h4>
                <p>Two‑factor authentication for every login.</p>
              </div>
              <div className="feature-item">
                <h4>⚙️ Easy Administration</h4>
                <p>Admins can upload & review in one click.</p>
              </div>
            </div>
          </div>

          {/* 3) LINKS */}
          <div className="info-card links-card">
            <h3>Quick Links</h3>
            <ul className="support-links">
              <li><a href="/faq">📖 FAQ</a></li>
              <li><a href="/terms">⚖️ Terms of Service</a></li>
              <li><a href="/privacy">🔒 Privacy Policy</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
