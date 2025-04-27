// src/pages/EUploadPage/EUploadPage.jsx
// Restored friend's UI structure, integrated OCR and correct dashboard redirect.

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from '../../AuthProvider.jsx';
import profileSvg from '../../assets/profile.svg';
import './EUploadPage.css'; // Use the CSS provided by the user

const API_BASE = 'http://localhost:5001';

const EUploadPage = () => {
  // === HOOKS ===
  const navigate = useNavigate();
  const auth = useAuth();
  const profileRef = useRef(null);
  const fileInputRef = useRef(null); // Ref for file input

  // --- State based on friend's code ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false); // Used for Save operation
  const [parsing, setParsing] = useState(false); // Added for OCR parsing state
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showProfile, setShowProfile] = useState(false);
  // --- Added state for OCR results ---
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState('');
  const [total, setTotal] = useState('');

  // === AUTH CHECK ===
  if (auth === undefined || !auth.isAuthChecked) {
      return <div className="loading-indicator">Loading Session...</div>;
  }
  if (!auth || !auth.email) {
      return <Navigate to="/login" replace />;
  }
  const { logout, email, avatarUrl } = auth;

  // === EFFECTS ===
  useEffect(() => {
    const handleClickOutside = (event) => { if (profileRef.current && !profileRef.current.contains(event.target)) { setShowProfile(false); } };
    if (showProfile) { document.addEventListener('mousedown', handleClickOutside); }
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [showProfile]);

  useEffect(() => {
    let currentUrl = previewUrl;
    return () => { if (currentUrl) { URL.revokeObjectURL(currentUrl); } };
  }, [previewUrl]);


  // === HANDLERS ===
  // Modified handleFileChange to include OCR
  const handleFileChange = async (event) => {
    setMessage({ type: '', text: '' });
    const file = event.target.files ? event.target.files[0] : null;
    setSelectedFile(file); // Use selectedFile state

    // Reset OCR fields
    setVendor(''); setDate(''); setTotal('');

    if (file) {
      // Validation
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024;
      if (!allowedTypes.includes(file.type)) { setMessage({ type: 'error', text: 'Invalid file type (JPG, PNG, PDF only).' }); setSelectedFile(null); setPreviewUrl(""); event.target.value = null; return; }
      if (file.size > maxSize) { setMessage({ type: 'error', text: 'File too large (Max 5MB).' }); setSelectedFile(null); setPreviewUrl(""); event.target.value = null; return; }

      // Set preview
      if (file.type.startsWith("image/")) { setPreviewUrl(URL.createObjectURL(file)); }
      else { setPreviewUrl(""); }

      // --- Trigger OCR Parsing ---
      setParsing(true);
      const formData = new FormData();
      formData.append('receiptFile', file);
      try {
          const res = await fetch(`${API_BASE}/parse-receipt`, { method: 'POST', body: formData });
          if (!res.ok) {
              let errorMsg = `Server Error ${res.status}`;
              try { const errorJson = await res.json(); errorMsg = errorJson.message || errorMsg; } catch (_) {}
              throw new Error(errorMsg);
          }
          const json = await res.json();
          if (json.success && json.parsed) {
              setVendor(json.parsed.vendor || '');
              setDate(json.parsed.date || '');
              setTotal(json.parsed.total || '');
              setMessage({ type: 'success', text: 'Receipt parsed—please review/complete fields below.' }); // Use success type
          } else { throw new Error(json.message || 'Parsing failed. Please enter details manually.'); }
      } catch (err) {
          console.error("Parsing Error:", err);
          setMessage({ type: 'error', text: `Could not parse receipt: ${err.message}. Please enter details manually.` });
      } finally {
          setParsing(false);
      }
      // --- END OCR Parsing ---

    } else {
      setSelectedFile(null); setPreviewUrl("");
      setVendor(''); setDate(''); setTotal('');
    }
  };

  // Modified handleUpload (renamed from handleSave) to include OCR fields and redirect to dashboard
  const handleUpload = async () => { // Renamed back to handleUpload
    // Validation now includes vendor, date, total
    if (!selectedFile) { setMessage({ type: 'error', text: 'Please select a file.' }); return; }
    if (!expenseType) { setMessage({ type: 'error', text: 'Please select an expense type.' }); return; }
    // These fields are now required because the form shows them after file selection
    if (!vendor) { setMessage({ type: 'error', text: 'Vendor name is required.' }); return; }
    if (!date) { setMessage({ type: 'error', text: 'Date is required.' }); return; }
    if (total === '' || isNaN(parseFloat(total)) || parseFloat(total) <= 0) { setMessage({ type: 'error', text: 'Valid positive total required.' }); return; }

    setUploading(true); // Use uploading state for saving
    setMessage({ type: '', text: '' });
    console.log("[handleUpload] Initiated.");

    const formData = new FormData();
    formData.append('receiptFile', selectedFile);
    formData.append('expenseType', expenseType);
    formData.append('notes', notes);
    formData.append('email', email);
    // Add OCR/manual fields
    formData.append('vendor', vendor);
    formData.append('date', date);
    formData.append('total', total);
    console.log("[handleUpload] FormData prepared.");

    try {
      console.log("[handleUpload] Calling /submit-expense API...");
      const response = await fetch(`${API_BASE}/submit-expense`, { method: 'POST', body: formData });
      console.log(`[handleUpload] API Response Status: ${response.status}`);
      if (!response.ok) {
          let errorMsg = `Server Error ${response.status}`;
          try { const errorJson = await response.json(); errorMsg = errorJson.message || errorMsg; } catch (_) {}
          throw new Error(errorMsg);
      }
      const result = await response.json();
      console.log("[handleUpload] API Response JSON:", result);
      if (!result.success) { // Don't need expense ID for dashboard redirect
          throw new Error(result.message || 'Failed to save expense.');
      }

      setMessage({ type: 'success', text: 'Uploaded successfully! Redirecting...' });

      // --- Redirect to dashboard based on role ---
      const targetDashboard = auth.role?.toLowerCase() === 'admin' ? '/admindashboard' : '/dashboard';
      console.log(`[handleUpload] Expense saved. Preparing to navigate to: ${targetDashboard}`);

      // Reset form state before navigating
      setSelectedFile(null); setPreviewUrl(""); setExpenseType(""); setNotes("");
      setVendor(''); setDate(''); setTotal('');
      if (fileInputRef.current) fileInputRef.current.value = null; // Clear file input

      setTimeout(() => {
          console.log(`[handleUpload] Executing navigation to: ${targetDashboard}`);
          navigate(targetDashboard);
      }, 1500);
      // --- END Redirect ---

    } catch (uploadError) {
      console.error("[handleUpload] Upload failed:", uploadError);
      setMessage({ type: 'error', text: uploadError.message || 'Upload failed. Please try again.' });
      setUploading(false); // Stop loading indicator on error
    }
  };

  const handleSignOut = () => {
      if (logout) logout();
      navigate('/login', { replace: true });
  }

  const isProcessing = parsing || uploading; // Combined loading state
  // Updated disabled logic for Upload button
  const isUploadDisabled = isProcessing || !selectedFile || !expenseType || !vendor || !date || total === '' || isNaN(parseFloat(total)) || parseFloat(total) <= 0;


  // --- RENDER ---
  return (
    // Use structure from friend's code
    <div className="eupload-page-container">
      <nav className="navbar">
        <h2 className="navbar-logo">EERIS</h2>
        <div className="nav-links">
          <button className="nav-btn" onClick={() => navigate(auth.role?.toLowerCase() === 'admin' ? '/admindashboard' : '/dashboard')}>
            Dashboard
          </button>
          <div className="profile-dropdown" ref={profileRef}>
              <img src={avatarUrl || profileSvg} alt="Profile" className="profile-pic" onClick={() => setShowProfile(prev => !prev)} />
              {showProfile && (
                  <ul className="profile-menu">
                      <li className="profile-email">{email}</li>
                      <li><button onClick={handleSignOut}>Sign Out</button></li>
                  </ul>
              )}
          </div>
        </div>
      </nav>

      <div className="eupload-content">
        <div className="eupload-card">
          <h2>Upload Expense Receipt</h2>
          {/* Use subtitle from friend's code if desired */}
          {/* <p className="eupload-subtitle">Please provide the receipt file and expense details.</p> */}

          {message.text && ( <p className={`message ${message.type}-message`}> {message.text} </p> )}

          {/* File Input */}
          <div className="form-group">
            <label htmlFor="file-upload-input">Receipt File (JPG, PNG, PDF - Max 5MB)</label>
            <input id="file-upload-input" name="receiptFile" type="file" onChange={handleFileChange} accept=".jpeg, .jpg, .png, .pdf" disabled={isProcessing} ref={fileInputRef}/>
            {parsing && <span className="spinner" style={{ marginLeft: '10px' }}>Parsing...</span>}
          </div>

          {/* File Preview */}
          {selectedFile && (
            <div className="file-preview-container">
                {previewUrl ? (
                    <img src={previewUrl} alt="Receipt Preview" className="file-preview" />
                ) : (
                    <p>Selected File: {selectedFile.name}</p> // Show filename for PDF
                )}
            </div>
           )}

          {/* Parsed Grid for Vendor/Date/Total */}
          {/* Render these fields after file selection, populated by OCR or manually */}
          {selectedFile && (
            <div className="parsed-grid">
              <div className="form-group">
                <label htmlFor="vendor-input">Vendor</label>
                <input id="vendor-input" type="text" value={vendor} onChange={e => setVendor(e.target.value)} disabled={isProcessing} required />
              </div>
              <div className="form-group">
                <label htmlFor="date-input">Date</label>
                <input id="date-input" type="date" value={date} onChange={e => setDate(e.target.value)} disabled={isProcessing} required />
              </div>
              <div className="form-group">
                <label htmlFor="total-input">Total</label>
                <input id="total-input" type="number" step="0.01" min="0.01" value={total} onChange={e => setTotal(e.target.value)} disabled={isProcessing} required />
              </div>
            </div>
          )}

          {/* Expense Type (Render after file selection) */}
          {selectedFile && (
            <div className="form-group">
              <label htmlFor="expense-type-select">Expense Type</label>
              <select id="expense-type-select" name="expenseType" value={expenseType} onChange={(e) => setExpenseType(e.target.value)} disabled={isProcessing} required >
                <option value="" disabled>Select Expense Type...</option>
                <option value="Travel">Travel</option>
                <option value="Meals">Meals & Entertainment</option>
                <option value="Office Supplies">Office Supplies</option>
                <option value="Software">Software/Subscriptions</option>
                <option value="Utilities">Utilities</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {/* Notes (Render after file selection) */}
          {selectedFile && (
            <div className="form-group">
              <label htmlFor="notes-textarea">Notes (Optional)</label>
              <textarea id="notes-textarea" name="notes" placeholder="Enter any additional notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows="4" disabled={isProcessing} ></textarea>
            </div>
          )}

          {/* Upload Button (Render after file selection) */}
          {selectedFile && (
            <div className="form-group">
              {/* Use upload-button class */}
              <button className="upload-button" onClick={handleUpload} disabled={isUploadDisabled} >
                  {uploading ? 'Uploading...' : (parsing ? 'Parsing...' : 'Upload Receipt')} {/* Use handleUpload */}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EUploadPage;
