import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./ReceiptConfirmation.css";
import Confetti from "react-confetti";
import { useEffect, useState } from "react";

const ReceiptConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const receiptId = location.state?.receiptId || "XXXX0000";

  return (
    <div className="upload-container">
      <div className="sidebar">
        <h1 className="logo">EERIS</h1>
        <div className="menu">
          <div className="menu-item selected">🗂 Employee Dashboard</div>
          <div className="menu-item">👥 Admin Dashboard</div>
        </div>
      </div>

      <div className="confirmation-container">
        <h2>Your receipt has been received</h2>
        <p>
          Receipt ID – <span className="receipt-id">{receiptId}</span>
        </p>

        <div className="confirmation-buttons">
          <button onClick={() => navigate("/upload")} className="btn grey">⬆ Upload New Receipt</button>
          <button onClick={() => alert("Feature coming soon!")} className="btn green">✔ Track Status</button>
          <button onClick={() => navigate("/login")} className="btn dark">👤 Logout</button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptConfirmation;
