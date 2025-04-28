import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../../AuthProvider.jsx';
import axios from 'axios';
import profileSvg from '../../assets/profile.svg';
import './EUploadPage.css';

const EUploadPage = () => {
  const BASE_URL = 'http://localhost:5001';

  const nav = useNavigate();
  const auth = useAuth();
  const profileRef = useRef();

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [vendor, setVendor] = useState('');
  const [date, setDate] = useState('');
  const [total, setTotal] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [uploading, setUploading] = useState(false);

  const [showProfile, setShowProfile] = useState(false);

  // auth guard
  if (auth === undefined) return <div>Loading session...</div>;
  if (!auth || !auth.email) return <Navigate to="/login" replace />;

  const { logout, email } = auth;

  // close dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (showProfile && profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showProfile]);

  // cleanup preview URL
  useEffect(() => {
    return () => {
      previewUrl && URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // file → OCR + AI parse
  const handleFile = async e => {
    setMsg({ type: '', text: '' });
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));

    try {
      const fd = new FormData();
      fd.append('receipt', f);
      const { data } = await axios.post(
        'http://localhost:5001/upload-receipt',
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setVendor(data.vendor || '');
      setDate(data.date || '');
      setTotal(data.total || '');
    } catch (err) {
      console.error('Parsing failed:', err);
      setMsg({ type: 'error', text: 'Could not auto-parse. Fill manually.' });
    }
  };

  // final upload
  const doUpload = async () => {
    if (!file || !type) {
      return setMsg({ type: 'error', text: 'Please choose a file and expense type.' });
    }
    setUploading(true);
    setMsg({ type: '', text: '' });

    try {
    // 1) Upload receipt file + parse (you already do that in handleFile)
    // 2) Now persist the new expense
      const payload = {
        email:     auth.email,
        expenseType: type,
        category:  type,           // or whatever field you choose
        date,
        total,
        name:      auth.email.split('@')[0], // or pull from profile
        notes
      };

      const { data: created } = await axios.post(
        `${BASE_URL}/add-expense`,
        payload
      );
      setMsg({ type: 'success', text: 'Uploaded successfully!' });

      // Optionally redirect back to summary so it will re‐fetch
      nav('/dashboard', { replace: true });
      
      // reset form
      setFile(null);
      setPreviewUrl('');
      setVendor('');
      setDate('');
      setTotal('');
      setType('');
      setNotes('');
      document.getElementById('file-input').value = '';
    } catch {
      setMsg({ type: 'error', text: 'Upload failed.' });
    } finally {
      setUploading(false);
    }
  };

  const handleSignOut = () => {
    logout?.();
    nav('/login', { replace: true });
  };

  return (
    <div className="upload-page">
      <header className="upload-header">
        <div
          className="header-logo"
          onClick={() => nav('/dashboard')}
        >
          EERIS
        </div>
        <nav className="nav-links">
          <button
            className="nav-btn"
            onClick={() => nav('/dashboard')}
          >
            ← Return to Dashboard
          </button>

          <div
            className="profile-dropdown"
            ref={profileRef}
          >
            <img
              src={profileSvg}
              alt="Profile"
              className="profile-icon"
              onClick={() => setShowProfile(p => !p)}
            />
            {showProfile && (
              <ul className="profile-menu">
                <li className="profile-email">{email}</li>
                <li onClick={handleSignOut}>Sign Out</li>
              </ul>
            )}
          </div>
        </nav>
      </header>

      <main className="content-area">
        <div className="upload-card">
          <h2>Upload Expense Receipt</h2>
          <p className="sub">Please upload a receipt and fill the details.</p>

          {msg.text && (
            <div className={`alert ${msg.type === 'error' ? 'error' : 'success'}`}>
              {msg.text}
            </div>
          )}

          <label>Receipt Image (JPG, PNG)</label>
          <input
            id="file-input"
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleFile}
            disabled={uploading}
          />

          {previewUrl && (
            <img className="preview" src={previewUrl} alt="Receipt preview" />
          )}

          <label>Vendor</label>
          <input
            type="text"
            value={vendor}
            onChange={e => setVendor(e.target.value)}
            placeholder="Vendor Name"
            disabled={uploading}
          />

          <label>Date</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            disabled={uploading}
          />

          <label>Total Amount</label>
          <input
            type="number"
            step="0.01"
            value={total}
            onChange={e => setTotal(e.target.value)}
            placeholder="0.00"
            disabled={uploading}
          />

          <label>Expense Type</label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            disabled={uploading}
          >
            <option value="">Select Expense Type</option>
            <option>Travel</option>
            <option>Meals &amp; Entertainment</option>
            <option>Office Supplies</option>
            <option>Software/Subscriptions</option>
            <option>Utilities</option>
            <option>Other</option>
          </select>

          <label>Notes (optional)</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            disabled={uploading}
            placeholder="Any additional notes…"
          />

          <button
            className="btn-upload"
            onClick={doUpload}
            disabled={!file || !type || uploading}
          >
            {uploading ? 'Uploading…' : 'Upload Receipt'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default EUploadPage;
