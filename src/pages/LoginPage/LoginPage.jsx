// src/pages/LoginPage/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx'; // Verify path
import './LoginPage.css'; // Verify path

// Verify backend URL
const BASE_URL = 'http://localhost:5001';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingSignIn, setLoadingSignIn] = useState(false);
  const [role, setRole] = useState('employee');
  const [remember, setRemember] = useState(false);

  const navigate = useNavigate();
  // Ensure useAuth() is called within the Provider context
  const auth = useAuth();
  // Check if auth is available before destructuring
  const login = auth ? auth.login : () => { console.error("Login function called before AuthProvider is ready or available"); };


  const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();
  const validateEmail = (email) => email.includes('@'); // Simple validation

  const handleSendOtp = async () => {
    setError(''); // Clear previous errors
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    // Optional: Add specific domain check if needed
    // if (!email.endsWith('@usf.edu')) { setError('Email must end in @usf.edu'); return; }

    setLoadingOtp(true);

    try {
      // --- Step 1: Get user roles ---
      const userCheckResponse = await axios.get(`${BASE_URL}/get-users`);
      const users = userCheckResponse.data;

      if (!users || !users.employees || !users.admins) {
          throw new Error("Invalid user data format received from server.");
      }

      const isEmployee = users.employees.includes(email);
      const isAdmin = users.admins.includes(email);

      // --- Step 2: Validate role based on fetched data ---
      if (role === 'employee' && !isEmployee) {
        setError('Access denied: Not registered as an employee.');
        setLoadingOtp(false); return;
      }
      if (role === 'admin' && !isAdmin) {
         setError('Access denied: Not registered for admin access.');
         setLoadingOtp(false); return;
      }

      // --- Step 3: Generate and Send OTP ---
      const gen = generateOtp();
      setGeneratedOtp(gen); // Store generated OTP for verification
      // console.log("Generated OTP (for testing):", gen); // Keep for testing if needed

      const otpPayload = { email, otp: gen, role };
      const otpResponse = await axios.post(`${BASE_URL}/send-OTP`, otpPayload);
      const otpRes = otpResponse.data; // Get data from response

      // --- Step 4: Process Response ---
      if (otpRes && otpRes.success === true) { // Check specifically for success: true
        // alert('OTP sent to your email!'); // Replace alert with better UX if possible
        setMessage({ type: 'success', text: 'OTP sent successfully to your email.' }); // Example using message state
        setOtpSent(true); // <<< THIS IS THE GOAL
      } else {
        setError(otpRes?.message || 'Failed to send OTP. Backend did not confirm success.');
      }
    } catch (err) {
      console.error("Error in handleSendOtp:", err);
      const errorMsg = err.response?.data?.message || err.message || 'A server error occurred while sending OTP.';
      setError(errorMsg);
      setOtpSent(false); // Ensure otpSent is false on error
    } finally {
      setLoadingOtp(false);
    }
  };

  // Handler to verify OTP and sign in
  const handleSignIn = () => {
    if (!login) { setError("Authentication system not ready. Please refresh."); return; }
    setLoadingSignIn(true); setError('');

    // Basic check
    if (otp === generatedOtp && otp !== '') {
      login(email, role, remember); // Call login from AuthProvider
      navigate(role === 'admin' ? '/adminDashboard' : '/upload', { replace: true });
    } else {
      setError('Invalid OTP entered.');
      setLoadingSignIn(false); // Stop loading only if sign-in fails
    }
  };

  // Message state hook (add this with other useState calls)
  const [message, setMessage] = useState({ type: '', text: '' });

  return (
    <div className="login-page">
      {/* LEFT PANEL */}
      <div className="login-panel">
        <div className="login-card">
          {/* <div className="accent-stripe" /> */} {/* Removed stripe */}
          <h2 className="login-title">WELCOME TO EERIS</h2>

           {/* Display Messages */}
           {message.text && ( <p className={`message ${message.type === 'error' ? 'error-message' : 'success-message'}`}> {message.text} </p> )}
           {/* Display Errors (use separate state or combine with message) */}
           {error && <p className="error-message">{error}</p>}

          {/* Role Select */}
          <div className="input-group role-group">
            <label htmlFor="role-select">I am a</label>
            <select id="role-select" name="role" className="role-select" value={role} onChange={e => setRole(e.target.value)} disabled={otpSent || loadingOtp || loadingSignIn} >
              <option value="employee">Employee</option> <option value="admin">Admin</option>
            </select>
          </div>

          {/* Email Input */}
          <div className="input-group">
            <input id="email-input" name="email" type="email" className="input-field" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} disabled={otpSent || loadingOtp || loadingSignIn} autoComplete="email" />
          </div>

          {/* Extra Options */}
          <div className="extra-options">
            <label> <input id="remember-checkbox" name="remember" type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} disabled={loadingOtp || loadingSignIn} /> Remember this device </label>
            {otpSent && !loadingSignIn && ( <button className="resend-btn" onClick={handleSendOtp} disabled={loadingOtp}> {loadingOtp ? 'Sending...' : 'Resend OTP'} </button> )}
          </div>

          {/* Send OTP Button */}
          {!otpSent && (
              <div className="input-group">
                <button className="send-otp-button" onClick={handleSendOtp} disabled={loadingOtp || !validateEmail(email)} > {loadingOtp ? 'Sending...' : 'Send OTP'} </button>
              </div>
          )}

          {/* OTP Input & Sign In Button */}
          {otpSent && (
            <>
              <div className="input-group">
                <input id="otp-input" name="otp" type="text" inputMode="numeric" pattern="\d{4}" maxLength="4" className="input-field" placeholder="Enter 4-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} disabled={loadingSignIn} autoComplete="one-time-code" />
              </div>
              <div className="input-group">
                <button className="sign-in-button" onClick={handleSignIn} disabled={loadingSignIn || otp.length !== 4} > {loadingSignIn ? 'Signing in...' : 'Sign In'} </button>
              </div>
            </>
          )}

        </div>
      </div>

      {/* RIGHT PANEL (Info/Links) */}
      <div className="info-panel">
        <div className="info-cards">
          {/* Steps Card */}
          <div className="info-card steps-card"> <h3>How to Get Started</h3> <ul> <li>Select your role (Employee or Admin).</li> <li>Enter your registered email address.</li> <li>Click “Send OTP” — check your inbox.</li> <li>Enter the 4‑digit code and hit “Sign In.”</li> </ul> <p> Need help? Contact <a href="mailto:support@example.com">support@example.com</a>. </p> </div>
          {/* Features Card */}
          <div className="info-card features-card"> <h3>Features</h3> <div className="feature-list"> <div className="feature-item"> <h4>📊 Live Reports</h4> <p>Real‑time analytics on expenses & usage.</p> </div> <div className="feature-item"> <h4>🔒 Secure Access</h4> <p>Two‑factor authentication for every login.</p> </div> <div className="feature-item"> <h4>⚙️ Easy Administration</h4> <p>Admins can manage users & requests easily.</p> </div> </div> </div>
          {/* Links Card */}
          <div className="info-card links-card"> <h3>Quick Links</h3> <ul className="support-links"> <li><a href="/faq">📖 FAQ</a></li> <li><a href="/terms">⚖️ Terms of Service</a></li> <li><a href="/privacy">🔒 Privacy Policy</a></li> </ul> </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
