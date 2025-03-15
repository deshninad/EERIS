import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthContext.jsx'; // Correct import path
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');  // Store OTP entered by user
  const [generatedOtp, setGeneratedOtp] = useState('');  // Store generated OTP
  const [otpSent, setOtpSent] = useState(false);  // Show OTP input fields when OTP is sent
  const [error, setError] = useState('');  // Error message
  const [loadingOtp, setLoadingOtp] = useState(false);  // Loading state for sending OTP
  const [loadingSignIn, setLoadingSignIn] = useState(false);  // Loading state for signing in
  const navigate = useNavigate();  // Hook for navigation

  const { login } = useAuth();  // Get login function from AuthContext

  // Function to generate a 4-digit OTP using JavaScript's Math.random()
  const generateOtp = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();  // Generates a 4-digit OTP
  };

  // Email validation function to check if it ends with @usf.edu
  const validateEmail = (email) => {
    return email.endsWith('@usf.edu');
  };

  const handleSendOtp = async () => {
    // Check if email is valid
    if (!validateEmail(email)) {
      setError('Email must end in @usf.edu');  // Show error if email is invalid
      return;
    }

    const generated = generateOtp();  // Generate OTP
    setGeneratedOtp(generated);  // Store the generated OTP locally
    setLoadingOtp(true);  // Start loading

    try {
      // Send email and generated OTP to backend for sending the email
      const response = await axios.post('http://localhost:5000/send-OTP', { email, otp: generated });

      if (response.data.success) {
        alert('OTP sent to your email!');
        setOtpSent(true);  // Show OTP input fields
        setError('');  // Clear any previous error
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      setError('Error sending OTP. Please check your email format or try again later.');
    } finally {
      setLoadingOtp(false);  // Stop loading
    }
  };

  const handleSignIn = () => {
    setLoadingSignIn(true);  // Start loading

    // Compare user input OTP with the generated OTP
    if (otp === generatedOtp) {
      alert('Signed in successfully!');
      login(email);  // Update AuthContext with the user's email to log them in
      navigate('/selection');  // Navigate to the next page
      setError('');  // Clear any previous error
    } else {
      setError('Invalid OTP. Please try again.');
    }

    setLoadingSignIn(false);  // Stop loading
  };

  // Clears error when focusing back on input fields
  const clearError = () => setError('');

  return (
    <div className="login-container">
      <h2 className="login-title">WELCOME TO EERIS</h2>

      <div className="input-group">
        <input
          type="email"
          className="input-field"
          placeholder="USF Email **ONLY**"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={clearError}  // Clear error on focus
          disabled={otpSent || loadingOtp || loadingSignIn}  // Disable input after OTP is sent
        />
        <div className="tooltip-container">
          <button className="info-button">i</button>
          <div className="tooltip-text">Must end in @usf.edu</div>
        </div>
      </div>

      <div className="input-group">
        <button className="send-otp-button" onClick={handleSendOtp} disabled={loadingOtp || otpSent}>
          {loadingOtp ? (
            <span className="loading-spinner">Loading...</span>  // Display loading spinner
          ) : (
            'Send OTP'
          )}
        </button>
      </div>

      {/* Conditionally render OTP input and Sign In button */}
      {otpSent && (
        <>
          <div className="input-group">
            <input
              type="text"
              className="input-field"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              onFocus={clearError}  // Clear error on focus
              disabled={loadingSignIn}  // Disable input while signing in
            />
          </div>
          <button className="sign-in-button" onClick={handleSignIn} disabled={loadingSignIn}>
            {loadingSignIn ? (
              <span className="loading-spinner">Signing in...</span>  // Display loading spinner
            ) : (
              'Sign In'
            )}
          </button>
        </>
      )}

      {/* Display error message if there's an error */}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default LoginPage;
