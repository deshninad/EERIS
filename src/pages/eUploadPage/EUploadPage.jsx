// src/pages/EUploadPage/EUploadPage.jsx
// Final version with Dashboard button and Profile Dropdown

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from '../../AuthProvider.jsx'; // Verify path
import profileSvg from '../../assets/profile.svg'; // Import default profile picture - Verify path
import './EUploadPage.css'; // Ensure CSS path is correct

const EUploadPage = () => {
  // === HOOKS ===
  const navigate = useNavigate();
  const auth = useAuth(); // Get auth context
  const profileRef = useRef(null); // Ref for profile dropdown

  // State
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [expenseType, setExpenseType] = useState("");
  const [notes, setNotes] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showProfile, setShowProfile] = useState(false);

  // === AUTH CHECK ===
  // Check auth status AFTER hooks have run
  if (auth === undefined) {
      return <div>Loading Session...</div>; // Or null
  }
  if (!auth || !auth.email) {
      // Not authenticated, redirect to login
      return <Navigate to="/login" replace />;
  }
  // Destructure needed properties AFTER checking auth
  const { logout, email, avatarUrl } = auth;

  // === EFFECTS ===
  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    if (showProfile) { document.addEventListener('mousedown', handleClickOutside); }
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [showProfile]);

  // Cleanup object URL for image preview
  useEffect(() => {
      // This effect runs when previewUrl changes.
      // If previewUrl is cleared (e.g., new file selected or upload complete),
      // the previous object URL is revoked.
      let currentUrl = previewUrl; // Capture current URL
      return () => {
          if (currentUrl) {
              URL.revokeObjectURL(currentUrl);
              console.log("Revoked Object URL:", currentUrl); // For debugging
          }
      };
  }, [previewUrl]);


  // === HANDLERS ===
  const handleFileChange = (event) => {
    setMessage({ type: '', text: '' }); // Clear message
    const file = event.target.files ? event.target.files[0] : null;

    if (file) {
      // Validation
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (!allowedTypes.includes(file.type)) { /* ... show error, reset ... */ setMessage({ type: 'error', text: 'Invalid file type (JPG, PNG, PDF only).' }); setSelectedFile(null); setPreviewUrl(""); event.target.value = null; return; }
      if (file.size > maxSize) { /* ... show error, reset ... */ setMessage({ type: 'error', text: 'File too large (Max 5MB).' }); setSelectedFile(null); setPreviewUrl(""); event.target.value = null; return; }

      // Set file and preview
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl); // This triggers the useEffect cleanup for the *previous* URL
      } else {
        setPreviewUrl(""); // Clear preview for non-images
      }
    } else {
      setSelectedFile(null); setPreviewUrl("");
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !expenseType) { setMessage({ type: 'error', text: 'Please select a file and expense type.' }); return; }
    setUploading(true); setMessage({ type: '', text: '' });
    console.log("Simulating Upload...");

    // --- Replace with actual API call using FormData ---
    const formData = new FormData();
    formData.append('receiptFile', selectedFile);
    formData.append('expenseType', expenseType);
    formData.append('notes', notes);
    formData.append('email', email); // Include user email

    // Example using fetch:
    // try {
    //   const response = await fetch('/api/your-upload-endpoint', { // Replace with your endpoint
    //     method: 'POST',
    //     body: formData,
    //     // Add headers if needed (e.g., Authorization: `Bearer ${token}`)
    //   });
    //   if (!response.ok) {
    //     const errorData = await response.json().catch(() => ({})); // Try to parse error
    //     throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    //   }
    //   const result = await response.json(); // Assuming backend returns JSON
    //   setMessage({ type: 'success', text: result.message || 'File uploaded successfully!' });
    //   // Reset form
    //   setSelectedFile(null); setPreviewUrl(""); setExpenseType(""); setNotes("");
    //   const fileInput = document.getElementById('file-upload-input'); if (fileInput) fileInput.value = null;
    // } catch (uploadError) {
    //   console.error("Upload failed:", uploadError);
    //   setMessage({ type: 'error', text: uploadError.message || 'Upload failed. Please try again.' });
    // } finally {
    //   setUploading(false);
    // }
    // --- End Real App Example ---

    // Simulated success
    await new Promise(resolve => setTimeout(resolve, 1500));
    setMessage({ type: 'success', text: 'File uploaded successfully! (Simulated)' });
    setSelectedFile(null); setPreviewUrl(""); setExpenseType(""); setNotes("");
    const fileInput = document.getElementById('file-upload-input'); if (fileInput) fileInput.value = null;
    setUploading(false);
  };

  const handleSignOut = () => {
      if (logout) logout();
      navigate('/login', { replace: true });
  }

  // --- RENDER ---
  return (
    <div className="eupload-page-container">
      {/* Consistent Navbar */}
      <nav className="navbar">
        <h2 className="navbar-logo">EERIS</h2>
        <div className="nav-links">
          {/* Dashboard Button */}
          <button className="nav-btn" onClick={() => navigate("/dashboard")}> {/* Adjust route if needed */}
            Dashboard
          </button>
          {/* Profile Dropdown */}
          <div className="profile-dropdown" ref={profileRef}>
              <img
                  src={auth.avatarUrl || profileSvg} // Use avatar from auth or default SVG
                  alt="Profile"
                  className="profile-pic"
                  onClick={() => setShowProfile(prev => !prev)} // Toggle dropdown
              />
              {showProfile && (
                  <ul className="profile-menu">
                      <li className="profile-email">{auth.email}</li>
                      <li><button onClick={handleSignOut}>Sign Out</button></li>
                  </ul>
              )}
          </div>
        </div>
      </nav>

      {/* Main Upload Content Area */}
      <div className="eupload-content">
        <div className="eupload-card">
          <h2>Upload Expense Receipt</h2>
          <p className="eupload-subtitle">Please provide the receipt file and expense details.</p>

          {/* Display Messages */}
          {message.text && ( <p className={`message ${message.type === 'error' ? 'error-message' : 'success-message'}`}> {message.text} </p> )}

          {/* Form Fields */}
          <div className="form-group">
            <label htmlFor="file-upload-input">Receipt File (JPG, PNG, PDF - Max 5MB)</label>
            <input id="file-upload-input" name="receiptFile" type="file" onChange={handleFileChange} accept=".jpeg, .jpg, .png, .pdf" disabled={uploading} />
          </div>

          {/* File Preview Area */}
          {previewUrl && ( <div className="file-preview-container"> <p>Image Preview:</p> <img src={previewUrl} alt="Receipt Preview" className="file-preview" /> </div> )}
          {selectedFile && !previewUrl && selectedFile.type === 'application/pdf' && ( <div className="file-preview-container"> <p>Selected PDF: {selectedFile.name}</p> </div> )}

          <div className="form-group">
            <label htmlFor="expense-type-select">Expense Type</label>
            <select id="expense-type-select" name="expenseType" value={expenseType} onChange={(e) => setExpenseType(e.target.value)} disabled={uploading} required >
              <option value="" disabled>Select Expense Type...</option>
              <option value="Travel">Travel</option> <option value="Meals">Meals & Entertainment</option> <option value="Office Supplies">Office Supplies</option> <option value="Software">Software/Subscriptions</option> <option value="Utilities">Utilities</option> <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes-textarea">Notes (Optional)</label>
            <textarea id="notes-textarea" name="notes" placeholder="Enter any additional notes about this expense..." value={notes} onChange={(e) => setNotes(e.target.value)} rows="4" disabled={uploading} ></textarea>
          </div>

          {/* Upload Button */}
          <div className="form-group">
            <button className="upload-button" onClick={handleUpload} disabled={!selectedFile || !expenseType || uploading} > {uploading ? 'Uploading...' : 'Upload Receipt'} </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EUploadPage;
