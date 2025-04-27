// src/pages/eSummaryPage/eSummaryPage.jsx
// Displays details for a single expense

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../../AuthProvider.jsx';
import profileSvg from '../../assets/profile.svg';
// Assuming EUploadPage.css contains the necessary styles and is correctly located
import '../eUploadPage/EUploadPage.css';

const API_BASE = 'http://localhost:5001';

export default function ESummaryPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const profileRef = useRef(null);
  const { expenseId } = useParams(); // Get expense ID from URL parameter

  // === HOOK CALLS ===
  const [expense, setExpense] = useState(null); // State to hold fetched expense details
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState('');     // Error state
  const [showProfile, setShowProfile] = useState(false);

  // === AUTH CHECK ===
  if (auth === undefined || !auth.isAuthChecked) {
      return <div className="loading-indicator">Loading Session...</div>;
  }
  // Allow any authenticated user to view summary? Or add role check?
  if (!auth.isAuthenticated || !auth.email) {
      return <Navigate to="/login" replace />;
  }
  const { logout, email, avatarUrl } = auth;

  // === EFFECTS ===
  // Profile dropdown logic
  useEffect(() => {
    const onClick = e => { if (profileRef.current && !profileRef.current.contains(e.target)) { setShowProfile(false); } };
    if (showProfile) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showProfile]);

  // Fetch expense details effect
  useEffect(() => {
    // Only fetch if expenseId is present
    if (!expenseId) {
        setError("No expense ID specified in URL.");
        setLoading(false);
        return;
    }
    const fetchExpense = async () => {
        setLoading(true);
        setError('');
        setExpense(null); // Clear previous data
        try {
            const response = await fetch(`${API_BASE}/get-expense/${expenseId}`);
            if (!response.ok) {
                let errorMsg = `Server Error ${response.status}`;
                try { const errorJson = await response.json(); errorMsg = errorJson.message || errorMsg; } catch (_) {}
                throw new Error(errorMsg);
            }
            const data = await response.json();
            if (data.success && data.expense) {
                setExpense(data.expense);
            } else {
                throw new Error(data.message || 'Failed to retrieve valid expense details from API.');
            }
        } catch (err) {
            console.error("[SummaryPage] Fetch Expense Error:", err);
            setError(`Could not load expense details: ${err.message}`);
            setExpense(null);
        } finally {
            setLoading(false);
        }
    };
    fetchExpense();
  }, [expenseId]); // Re-fetch only if expenseId changes

  // === HELPERS ===
  const formatDate = useCallback((dateString) => {
      if (!dateString) return 'N/A';
      try {
          const date = new Date(dateString + 'T00:00:00');
          if (isNaN(date.getTime())) return dateString;
          return date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
      } catch (e) { return dateString; }
  }, []);

  const formatCurrency = useCallback((amount) => {
       const num = Number(amount);
       if (amount === null || amount === undefined || isNaN(num)) { return 'N/A'; }
       return `$${num.toFixed(2)}`;
   }, []);

  // === RENDER LOGIC ===
  const renderContent = () => {
      if (loading) {
          return <div className="spinner-container"><p className="message info-message">Loading expense details...</p><div className="spinner"></div></div>;
      }
      if (error) {
          return <p className="message error-message">{error}</p>;
      }
      if (!expense) {
          return <p className="message error-message">Expense data not found or unavailable.</p>;
      }
      // Render details if data is loaded successfully
      return (
        <>
          <div className="summary-grid">
             <div className="summary-item">
                <span className="summary-label">Vendor:</span>
                <span className="summary-value">{expense.vendor || 'N/A'}</span>
             </div>
             <div className="summary-item">
                <span className="summary-label">Date:</span>
                <span className="summary-value">{formatDate(expense.date)}</span>
             </div>
             <div className="summary-item">
                <span className="summary-label">Total:</span>
                <span className="summary-value">{formatCurrency(expense.total)}</span>
             </div>
             <div className="summary-item">
                <span className="summary-label">Expense Type:</span>
                <span className="summary-value">{expense.expenseType || 'N/A'}</span>
             </div>
             <div className="summary-item full-width">
                <span className="summary-label">Status:</span>
                <span className={`summary-value status-${expense.status?.toLowerCase().replace(/[\s]+/g, '-')}`}>{expense.status || 'N/A'}</span>
             </div>
             <div className="summary-item full-width">
                <span className="summary-label">Notes:</span>
                <span className="summary-value notes-value">{expense.notes || '(No notes provided)'}</span>
             </div>
             {expense.receiptUrl ? (
                <div className="summary-item full-width">
                   <span className="summary-label">Receipt:</span>
                   <a href={expense.receiptUrl.startsWith('/') ? `${API_BASE}${expense.receiptUrl}` : expense.receiptUrl}
                      target="_blank" rel="noopener noreferrer" className="summary-link">
                      View Receipt
                   </a>
                </div>
             ) : (
                <div className="summary-item full-width">
                    <span className="summary-label">Receipt:</span>
                    <span className="summary-value">(Receipt file not available)</span>
                </div>
             )}
          </div>
           <div className="form-group summary-actions">
              <button onClick={() => navigate(auth.role?.toLowerCase() === 'admin' ? '/admindashboard' : '/dashboard')} className="nav-btn">Back to Dashboard</button>
           </div>
        </>
      );
  }

  // === MAIN JSX ===
  return (
    <div className="eupload-page-container"> {/* Reuse container class */}
      {/* Navbar */}
      <nav className="navbar">
        <h2 className="navbar-logo">EERIS</h2>
        <div className="nav-links">
          <Link to={auth.role?.toLowerCase() === 'admin' ? '/admindashboard' : '/dashboard'} className="nav-btn">Dashboard</Link>
          <button onClick={()=>navigate('/upload')} className="nav-btn">Upload New</button>
          <div className="profile-dropdown" ref={profileRef}>
            <img src={avatarUrl || profileSvg} alt="Profile" className="profile-pic" onClick={() => setShowProfile(p => !p)} />
            {showProfile && (
              <ul className="profile-menu">
                <li className="profile-email">{email}</li>
                <li><button onClick={() => { logout(); navigate('/login'); }}>Sign Out</button></li>
              </ul>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <div className="eupload-content"> {/* Reuse content class */}
        <div className="eupload-card">   {/* Reuse card class */}
          <h2>Expense Summary</h2>
          {/* Render loading, error, or expense details */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
