import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx'; // Correct import path
import './LoginPage.css';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [loadingOtp, setLoadingOtp] = useState(false);
  const [loadingSignIn, setLoadingSignIn] = useState(false);
  const [role, setRole] = useState('employee'); // Default to employee
  const navigate = useNavigate();
  const { login } = useAuth();

  const generateOtp = () => Math.floor(1000 + Math.random() * 9000).toString();

  const validateEmail = (email) => email.endsWith('@usf.edu');

  const handleSendOtp = async () => {
    if (!validateEmail(email)) {
      setError('Email must end in @usf.edu');
      return;
    }
  
    setLoadingOtp(true);
    setError('');
  
    try {
      const response = await axios.get('http://localhost:5000/get-users');
      console.log('Users data received:', response.data); // Debugging log
  
      const users = response.data;
      const isEmployee = users.employees.includes(email);
      const isAdmin = users.admins.includes(email);
  
      // Debugging logs
      console.log(`Checking email: ${email}`);
      console.log(`Role selected: ${role}`);
      console.log(`Is Employee: ${isEmployee}, Is Admin: ${isAdmin}`);
  
      if (role === 'employee' && !isEmployee) {
        setError('Access denied: You are not registered as an employee.');
        setLoadingOtp(false);
        return;
      }
  
      if (role === 'admin' && !isAdmin && !isEmployee) {
        setError('Access denied: You are not registered as an admin.');
        setLoadingOtp(false);
        return;
      }
  
      const generated = generateOtp();
      setGeneratedOtp(generated);
  
      const otpResponse = await axios.post('http://localhost:5000/send-OTP', { email, otp: generated, role });
  
      if (otpResponse.data.success) {
        alert('OTP sent to your email!');
        setOtpSent(true);
      } else {
        setError('Failed to send OTP. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleSendOtp:', error); // Log exact error
      setError('Error verifying email. Please try again later.');
    } finally {
      setLoadingOtp(false);
    }
  };
  
  const handleSignIn = () => {
    setLoadingSignIn(true);

    if (otp === generatedOtp) {
      alert('Signed in successfully!');
      login(email, role);
      if(role=="admin"){
        navigate('/adminDashboard')
      }
      else{
      navigate('/upload');
      }
    } else {
      setError('Invalid OTP. Please try again.');
    }

    setLoadingSignIn(false);
  };

  return (
    <div className="login-container">
      <h2 className="login-title">WELCOME TO EERIS</h2>

      <div className="input-group">
        <select className="role-select" value={role} onChange={(e) => setRole(e.target.value)} disabled={otpSent}>
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
          onChange={(e) => setEmail(e.target.value)}
          disabled={otpSent || loadingOtp || loadingSignIn}
        />
      </div>

      <div className="input-group">
        <button className="send-otp-button" onClick={handleSendOtp} disabled={loadingOtp || otpSent}>
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
              onChange={(e) => setOtp(e.target.value)}
              disabled={loadingSignIn}
            />
          </div>
          <button className="sign-in-button" onClick={handleSignIn} disabled={loadingSignIn}>
            {loadingSignIn ? 'Signing in...' : 'Sign In'}
          </button>
        </>
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default LoginPage;
