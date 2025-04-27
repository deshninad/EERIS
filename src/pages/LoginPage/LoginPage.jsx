// src/pages/LoginPage/LoginPage.jsx
// Added console logs for debugging login flow

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
  const [activeSection, setActiveSection] = useState('login');

  // --- Hooks ---
  const navigate = useNavigate();
  const auth = useAuth();
  const login = auth ? auth.login : null; // Get login function from context

  // --- Handlers ---
  const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();
  const validateEmail = (email) => email.includes('@');

  const handleSendOtp = async () => {
    setError('');
    if (!email.endsWith("@usf.edu")) { setError("Please enter a valid USF email."); return; }
    setLoadingOtp(true);
    try {
      // --- DEBUG: Log role being checked ---
      console.log(`Checking user ${email} for role: ${role}`);
      const { data: users } = await axios.get(`${BASE_URL}/get-users`);
      const isEmployee = users.employees?.includes(email);
      const isAdmin = users.admins?.includes(email);

      // --- DEBUG: Log validation results ---
      console.log(`Is Employee: ${isEmployee}, Is Admin: ${isAdmin}`);

      // Role validation logic
      if (role === 'Employee' && !isEmployee) {
          console.log("Validation Failed: Role is Employee, but user not found in employees list.");
          setError('Access denied: Not registered as an employee.');
          setLoadingOtp(false);
          return;
      }
      // Allow Admins to log in even if they are also employees? Or require ONLY admin?
      // Current logic: If role is Admin, must be in admins list.
      if (role === 'Admin' && !isAdmin) {
          console.log("Validation Failed: Role is Admin, but user not found in admins list.");
          setError('Access denied: Not registered for admin access.');
          setLoadingOtp(false);
          return;
      }
      // --- End Role Validation ---

      const gen = generateOtp();
      setGeneratedOtp(gen);
      console.log("Generated OTP:", gen); // Keep this log

      const { data: otpRes } = await axios.post(`${BASE_URL}/send-OTP`, { email, otp: gen, role });

      if (otpRes && otpRes.success) {
        console.log("OTP Sent successfully via backend.");
        setError('');
        setOtpSent(true);
      } else {
        console.log("Backend failed to send OTP:", otpRes?.message);
        setError(otpRes?.message || 'Failed to send OTP.');
      }
    } catch (err) {
      console.error("Error sending OTP:", err);
      setError(err.response?.data?.message || 'Server error sending OTP.');
      setOtpSent(false);
    }
    finally {
      setLoadingOtp(false);
    }
  };

  const handleLogin = () => {
    // --- DEBUG: Log start of handleLogin ---
    console.log("handleLogin triggered.");

    if (!login) {
      console.error("handleLogin Error: auth.login function is not available.");
      setError("Authentication system not ready. Please refresh.");
      return;
    }
    if (!otp || !email) {
      console.log("handleLogin Error: Email or OTP field is empty.");
      setError("Please enter email and OTP.");
      return;
    }

    setLoadingSignIn(true);
    setError('');

    // --- DEBUG: Log values being compared ---
    console.log(`Comparing entered OTP: "${otp}" with generated OTP: "${generatedOtp}"`);

    if (otp === generatedOtp && otp !== '') {
      // --- DEBUG: Log successful OTP match ---
      console.log("OTP Match Successful!");
      try {
        // --- DEBUG: Log before calling auth.login ---
        console.log(`Calling auth.login with email: "${email}", role: "${role}"`);
        login(email, role, false); // Pass role, remember=false

        // Determine target path
        const targetPath = role === "Admin" ? "/admindashboard" : "/upload";
        // --- DEBUG: Log before navigating ---
        console.log(`Login successful. Navigating to: ${targetPath}`);

        navigate(targetPath, { replace: true });

      } catch (loginError) {
          // Catch potential errors from the login function itself
          console.error("Error occurred during auth.login call:", loginError);
          setError("An error occurred during login.");
          setLoadingSignIn(false); // Reset loading state on error
      }
      // Note: No finally block needed here for setLoadingSignIn(false) because navigation occurs

    } else {
      // --- DEBUG: Log failed OTP match ---
      console.log("OTP Match Failed.");
      setError('Invalid OTP entered.');
      setLoadingSignIn(false); // Reset loading state only if OTP is invalid
    }
  };

  const toggleRole = () => {
    setRole((prev) => (prev === "Admin" ? "Employee" : "Admin"));
    setError(''); setOtpSent(false); setOtp('');
  };

  // --- Helper to render content based on activeSection ---
  const renderInfoContent = (section) => {
      // ... (keep existing renderInfoContent function) ...
      switch(section) {
          case 'howToUse':
              return ( <div className="info-content-section"> <h3>How to Get Started</h3> <ul> <li>Select your role using the toggle button below the form.</li> <li>Enter your registered USF email address.</li> <li>Click “Send OTP” — check your inbox.</li> <li>Enter the 4‑digit code and hit “Login.”</li> </ul> <p> Need help? Contact <a href="mailto:support@example.com">support@example.com</a>. </p> </div> );
          case 'features':
              return ( <div className="info-content-section"> <h3>Features</h3> <div className="feature-item"> <h4>📊 Live Reports</h4> <p>Real‑time analytics.</p> </div> <div className="feature-item"> <h4>🔒 Secure Access</h4> <p>Two‑factor authentication.</p> </div> <div className="feature-item"> <h4>⚙️ Easy Administration</h4> <p>Manage users & requests.</p> </div> </div> );
          case 'support':
              return ( <div className="info-content-section"> <h3>Support & Contact</h3> <p>If you encounter any issues or require assistance, please reach out to our support team:</p> <p><strong>Email:</strong> <a href="mailto:support@example.com">support@example.com</a></p> <p><strong>Phone:</strong> (555) 123-4567 (Mon-Fri, 9am-5pm)</p> </div> );
          case 'terms':
              return ( <div className="info-content-section"> <h3>Terms & Privacy</h3> <p><a href="/terms" target="_blank" rel="noopener noreferrer">⚖️ Read our Terms of Service</a></p> <p><a href="/privacy" target="_blank" rel="noopener noreferrer">🔒 Read our Privacy Policy</a></p> <p>By using EERIS, you agree to abide by our terms and policies regarding data usage and security.</p> </div> );
          default: return null;
      }
  }

  // --- Render ---
  return (
    <div className="login-container"> {/* Main container */}
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="logo">EERIS</div>
        <nav className="sidebar-nav">
          <div className={`menu-item ${activeSection === 'login' ? 'selected' : ''}`} onClick={() => setActiveSection('login')}> 🔑 Login </div>
          <div className={`menu-item ${activeSection === 'howToUse' ? 'selected' : ''}`} onClick={() => setActiveSection('howToUse')}> 📖 How to Use </div>
          <div className={`menu-item ${activeSection === 'features' ? 'selected' : ''}`} onClick={() => setActiveSection('features')}> ✨ Features </div>
          <div className={`menu-item ${activeSection === 'support' ? 'selected' : ''}`} onClick={() => setActiveSection('support')}> 📞 Support & Contact </div>
          <div className={`menu-item ${activeSection === 'terms' ? 'selected' : ''}`} onClick={() => setActiveSection('terms')}> ⚖️ Terms & Privacy </div>
        </nav>
      </aside>

      {/* Form Section */}
      <main className="form-section">
        <div className="login-card">
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
