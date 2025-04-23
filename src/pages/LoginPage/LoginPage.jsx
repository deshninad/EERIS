import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

const EERISLogin = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [role, setRole] = useState("Admin");

  const navigate = useNavigate();

  const handleSendOTP = () => {
    if (!email.endsWith("@usf.edu")) {
      alert("Please enter a valid USF email.");
      return;
    }
    console.log(`Sending OTP to ${email} as ${role}`);
    alert("OTP sent to your USF email!");
  };

  const handleLogin = () => {
    if (!otp || !email) {
      alert("Please enter both email and OTP.");
      return;
    }
    console.log(`Logging in ${role} with email ${email} and OTP ${otp}`);
    alert(`Logged in as ${role}`);

    // Role-based redirect
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
      {/* Sidebar */}
      <div className="sidebar">
        <h1>EERIS</h1>
        <div className="menu">
          <div className={`menu-item ${role === "Employee" ? "selected" : ""}`}>🗂 Employee Dashboard</div>
          <div className={`menu-item ${role === "Admin" ? "selected" : ""}`}>👥 Admin Dashboard</div>
        </div>
      </div>

      {/* Form Section */}
      <div className="form-section">
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

        <button className="btn toggle-btn" onClick={toggleRole}>
          👤 Login as {role === "Admin" ? "employee" : "admin"} instead
        </button>
      </div>
    </div>
  );
};

export default EERISLogin;
