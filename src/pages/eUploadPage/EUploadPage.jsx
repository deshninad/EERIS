// src/pages/eUploadPage/EUploadPage.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./eUploadPage.css";

const EUploadPage = () => {
  const navigate = useNavigate();

  // — your existing state hooks —
  const [expenseType, setExpenseType] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dateUploaded, setDateUploaded] = useState("");
  // make these editable
  const [receiptAmount, setReceiptAmount] = useState("");
  const [vendorName, setVendorName]     = useState("");
  const [isLoading, setIsLoading]       = useState(false);
  const [progress, setProgress]         = useState(0);

  // — progress bar logic stays the same —
  useEffect(() => {
    let p = 0;
    if (expenseType) p += 33;
    if (notes.trim()) p += 33;
    if (selectedFile) p += 34;
    setProgress(p);
  }, [expenseType, notes, selectedFile]);

  // — the “Import Receipt” button handler —
  const handleFileSelect = () => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".jpg,.jpeg,.png,.pdf";

    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsLoading(true);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));

      // build form‐data & send to your OCR+LLM endpoint
      const formData = new FormData();
      formData.append("receipt", file);

      try {
        const { data } = await axios.post(
          "http://localhost:5009/api/ocr",
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        // auto‐fill fields (fallback to today or blank)
        setDateUploaded(data.date || new Date().toISOString().split("T")[0]);
        setReceiptAmount(
          typeof data.amount === "number"
            ? (data.amount / 100).toFixed(2)
            : data.amount || ""
        );
        setVendorName(data.vendor || "");
      } catch (err) {
        console.error("OCR error:", err);
        alert("Could not parse receipt — please update the fields manually.");
        setDateUploaded(new Date().toISOString().split("T")[0]);
      } finally {
        setIsLoading(false);
      }
    };

    fileInput.click();
  };

  // — your existing save logic —
  const generateRandomReceiptId = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
  };

  const handleSave = () => {
    const receiptId = generateRandomReceiptId();
    navigate("/receipt-confirmation", { state: { receiptId } });
  };

  return (
    <div className="upload-container">
      <div className="sidebar">
        <h1 className="logo">EERIS</h1>
        <div className="menu">
          <div className="menu-item selected">📁 Upload receipt</div>
          <div className="menu-item">👥 Admin Dashboard</div>
        </div>
      </div>

      {/* Use upload-form-wide here instead of main-content */}
      <div className="upload-form-wide">
        <h2>Enter Details of Receipt to be reported below</h2>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {isLoading ? (
          <div className="loader-wrapper">
            <div className="spinner"></div>
            <p>Processing receipt...</p>
          </div>
        ) : !selectedFile ? (
          /* === BEFORE IMPORT === */
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
          /* === AFTER IMPORT === */
          <div className="details-grid">
            <div className="left-form">
              <div className="field">
                <label>Date uploaded</label>
                <input
                  type="date"
                  value={dateUploaded}
                  onChange={(e) => setDateUploaded(e.target.value)}
                  className="common-input"
                />
              </div>

              <div className="field">
                <label>Receipt amount</label>
                <input
                  type="number"
                  step="0.01"
                  value={receiptAmount}
                  onChange={(e) => setReceiptAmount(e.target.value)}
                  className="common-input"
                />
              </div>

              <div className="field">
                <label>Vendor Name</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  className="common-input"
                />
              </div>

              <div className="field">
                <label>Other Notes</label>
                <input
                  type="text"
                  placeholder="User input notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="common-input"
                />
              </div>

              <div className="buttons">
                <button
                  className="btn cancel"
                  onClick={() => window.location.reload()}
                >
                  ✖ Cancel
                </button>
                <button className="btn save" onClick={handleSave}>
                  💾 Save
                </button>
              </div>
            </div>

            <div className="receipt-preview">
              <label>Receipt uploaded</label>
              <img src={previewUrl} alt="Uploaded Receipt" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EUploadPage;
