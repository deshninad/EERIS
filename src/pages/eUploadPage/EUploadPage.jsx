import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./eUploadPage.css";

const EUploadPage = () => {
  const navigate = useNavigate();
  const [expenseType, setExpenseType] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dateUploaded, setDateUploaded] = useState("");
  const [receiptAmount] = useState("Autopopulated amount");
  const [vendorName] = useState("Autopopulated vendor name");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // ✅ Dynamic progress bar logic
  useEffect(() => {
    let p = 0;
    if (expenseType) p += 33;
    if (notes.trim()) p += 33;
    if (selectedFile) p += 34;
    setProgress(p);
  }, [expenseType, notes, selectedFile]);

  const handleFileSelect = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".jpg,.jpeg";

    fileInput.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        setIsLoading(true);
        setTimeout(() => {
          setSelectedFile(file);
          setPreviewUrl(URL.createObjectURL(file));
          setDateUploaded(new Date().toISOString().split("T")[0]);
          setIsLoading(false);
        }, 1500);
      }
    };
    fileInput.click();
  };

  const generateRandomReceiptId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  };

  const handleSave = () => {
    const receiptId = generateRandomReceiptId();
    navigate("/receipt-confirmation", {
      state: { receiptId },
    });
  };

  return (
    <div className="upload-container">
      <div className="sidebar">
        <h1 className="logo">EERIS</h1>
        <div className="menu">
          <div className="menu-item selected">📁 Employee Dashboard</div>
          <div className="menu-item">👥 Admin Dashboard</div>
        </div>
      </div>

      <div className="upload-form-wide">
        <h2 className="form-title">Enter Details of Receipt to be reported below</h2>

        {/* ✅ Progress Bar */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
        </div>

        {isLoading ? (
          <div className="loader-wrapper">
            <div className="spinner"></div>
            <p>Processing receipt...</p>
          </div>
        ) : !selectedFile ? (
          <div className="form-controls">
            <select
              className="dropdown common-input"
              value={expenseType}
              onChange={(e) => setExpenseType(e.target.value)}
            >
              <option value="">Type of expense</option>
              <option>Office Supplies</option>
              <option>Groceries</option>
              <option>Meals</option>
              <option>Utilities</option>
              <option>Travel</option>
            </select>

            <input
              type="text"
              placeholder="Other Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="notes-input common-input"
            />

            <button className="import-btn" onClick={handleFileSelect}>
              Import Receipt
            </button>
          </div>
        ) : (
          <div className="details-grid">
            <div className="left-form">
              <div className="field">
                <label>Date uploaded</label>
                <input type="text" value={dateUploaded} disabled />
              </div>
              <div className="field">
                <label>Receipt amount</label>
                <input type="text" value={receiptAmount} disabled />
              </div>
              <div className="field">
                <label>Vendor Name</label>
                <input type="text" value={vendorName} disabled />
              </div>
              <div className="field">
                <label>Other Notes</label>
                <input
                  type="text"
                  placeholder="User input notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="buttons">
                <button className="btn cancel" onClick={() => window.location.reload()}>
                  ✖ Cancel
                </button>
                <button className="btn save" onClick={handleSave}>
                  💾 Save
                </button>
              </div>
            </div>

            <div className="receipt-preview">
              <label>Receipt uploaded</label>
              {previewUrl && <img src={previewUrl} alt="Uploaded Receipt" />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EUploadPage;
