import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // ✅ added
import "./LoginPage.css";

const LoginPage = () => {
  const navigate = useNavigate(); // ✅ initialize
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState("Admin");

  const handleSendOTP = () => {
    if (!email.endsWith("@usf.edu")) {
      alert("Please enter a valid USF email.");
      return;
    }
    alert("OTP sent to your USF email!");
  };

  const handleLogin = () => {
    if (!otp || !email) {
      alert("Please enter both email and OTP.");
      return;
    }

    // ✅ Redirect based on role
    if (role === "Employee") {
      navigate("/upload");
    } else {
      navigate("/admindashboard");
    }
  };

  const toggleRole = () => {
    setRole((prev) => (prev === "Admin" ? "Employee" : "Admin"));
  };

  return (
    <div className="login-container">
      <div className="sidebar">
        <h1 className="logo">EERIS</h1>
        <div className="menu">
          <div className="menu-item">📁 Employee Dashboard</div>
          <div className="menu-item selected">👥 Admin Dashboard</div>
        </div>
      </div>

      <div className="form-section">
        <div className="login-card">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Enter OTP Code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="input-field"
          />
          <div className="button-group">
            <button className="btn login-btn" onClick={handleLogin}>
              ✔ Login
            </button>
            <button className="btn otp-btn" onClick={handleSendOTP}>
              Send OTP
            </button>
          </div>
          <button className="toggle-btn" onClick={toggleRole}>
            👤 Login as {role === "Admin" ? "employee" : "admin"} instead
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
