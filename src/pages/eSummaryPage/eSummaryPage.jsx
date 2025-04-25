import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx'; // Verify path
import profileSvg from '../../assets/profile.svg';  // Verify path
import './ESummaryPage.css';

const BASE_URL = 'http://localhost:5001'; // Verify backend URL

export default function ESummaryPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  // --- State ---
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState(null); // null = all
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [editingId, setEditingId] = useState(null); // ID of row being edited
  const [draft, setDraft] = useState({}); // Data for the row being edited
  const [showProfile, setShowProfile] = useState(false); // Profile dropdown visibility
  const profileRef = useRef(null); // Ref for profile dropdown

  // --- Auth Check & Redirect ---
  // Redirect immediately if auth info is not available
  if (!auth?.email) {
      return <Navigate to="/login" replace />;
  }
  const { email, logout, avatarUrl } = auth; // Destructure after check

  // --- Effects ---

  // Close profile dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    // Only add listener if dropdown is open
    if (showProfile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    // Cleanup listener on unmount or when dropdown closes
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfile]); // Re-run when showProfile changes

  // Fetch user requests
  useEffect(() => {
    if (!email) return; // Don't fetch if email isn't available

    let isMounted = true; // Prevent state updates on unmounted component
    setError(''); // Clear previous errors

    axios.get(`${BASE_URL}/get-expenses`)
      .then(response => {
        if (isMounted) {
          const allData = Array.isArray(response.data) ? response.data : [];
          const userRequests = allData
            .filter(r => r.email === email)
            .map(r => ({ ...r, amount: parseFloat(r.amount) || 0 })); // Ensure amount is number
          setRequests(userRequests);
        }
      })
      .catch(err => {
        console.error("Error fetching expenses:", err);
        if (isMounted) {
          setError('Failed to load expense requests.');
        }
      });

    // Cleanup function
    return () => { isMounted = false; };
  }, [email]); // Re-fetch if email changes

  // --- Event Handlers ---

  const handleDelete = async (id) => {
    setError(''); // Clear error before trying
    try {
      await axios.post(`${BASE_URL}/delete-expense`, { expenseId: id });
      setRequests(currentRequests => currentRequests.filter(r => r.id !== id)); // Update state
    } catch (err) {
      console.error("Delete failed:", err);
      setError('Could not delete the request.');
    }
  };

  const startEdit = (request) => {
    setEditingId(request.id);
    // Pre-fill draft with current values
    setDraft({ ...request });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft({}); // Clear draft
  };

  const saveEdit = async () => {
    setError('');
    const { id, expenseType, category, amount } = draft;
    const parsedAmount = parseFloat(amount);

    // Basic validation
    if (!expenseType?.trim() || !category?.trim() || isNaN(parsedAmount) || parsedAmount < 0) {
      setError('Please ensure Type, Category, and a valid Amount (>= 0) are entered.');
      return;
    }

    try {
      // Perform individual updates (adjust if your backend handles bulk updates)
      await axios.post(`${BASE_URL}/update-expense`, { expenseId: id, field: 'expenseType', newValue: expenseType });
      await axios.post(`${BASE_URL}/update-expense`, { expenseId: id, field: 'category', newValue: category });
      await axios.post(`${BASE_URL}/update-expense`, { expenseId: id, field: 'amount', newValue: parsedAmount });

      // Update local state
      setRequests(currentRequests =>
        currentRequests.map(r =>
          r.id === id ? { ...r, expenseType, category, amount: parsedAmount } : r
        )
      );
      cancelEdit(); // Exit editing mode
    } catch (err) {
      console.error("Save failed:", err);
      setError('Error saving changes.');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDraft(prevDraft => ({ ...prevDraft, [name]: value }));
  };

  const requestSort = (key) => {
    if (key === 'actions') return; // Can't sort by actions
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleMetricClick = (label) => {
    setFilterStatus(label === 'Total' ? null : label);
    setSortConfig({ key: null, direction: 'asc' }); // Reset sort on filter change
  };

  // --- Memoized Calculations ---

  const displayed = useMemo(() => {
    let filtered = filterStatus ? requests.filter(r => r.status === filterStatus) : [...requests];
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        // Handle null/undefined and type differences
        valA = valA ?? (sortConfig.key === 'amount' ? 0 : '');
        valB = valB ?? (sortConfig.key === 'amount' ? 0 : '');

        if (sortConfig.key === 'amount') {
          return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
        } else {
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
          if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
    }
    return filtered;
  }, [requests, filterStatus, sortConfig]);

  const metrics = useMemo(() => ({
    Total: requests.length,
    Approved: requests.filter(r => r.status === 'Approved').length,
    Pending: requests.filter(r => r.status === 'Pending').length,
    Rejected: requests.filter(r => r.status === 'Rejected').length
  }), [requests]);

  // Define columns for mapping
  const columns = ['id', 'expenseType', 'category', 'status', 'amount', 'name', 'actions'];
  const columnLabels = { id: 'ID', expenseType: 'Type', category: 'Category', status: 'Status', amount: 'Amount', name: 'Name', actions: 'Actions' };

  // --- Render ---
  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="navbar">
        <h2 className="navbar-logo">EERIS</h2>
        {/* User's original structure for right-side elements */}
        <div className="nav-links">
          <button className="nav-btn" onClick={() => navigate('/upload')}>Upload</button>
          <div className="profile-dropdown" ref={profileRef}>
            <img
              src={avatarUrl || profileSvg}
              alt="Profile"
              className="profile-pic"
              onClick={() => setShowProfile(s => !s)} // Toggle dropdown
            />
            {showProfile && (
              <ul className="profile-menu">
                <li className="profile-email">{email}</li>
                <li><button onClick={() => { logout(); navigate('/login', { replace: true }); }}>Sign Out</button></li>
              </ul>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Metrics */}
        <div className="metrics-row">
          {Object.entries(metrics).map(([label, count]) => (
            <div
              key={label}
              className="metric-card"
              onClick={() => handleMetricClick(label)}
              style={{ cursor: 'pointer' }}
              role="button" tabIndex={0} // Accessibility
              onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleMetricClick(label)}
            >
              <h4>{label}</h4>
              <p>{count}</p>
            </div>
          ))}
        </div>

        {/* Requests Table */}
        <div className="requests-card">
          <h3>My Expense Requests {filterStatus ? `(${filterStatus})` : ''}</h3>
          {error && <p className="error-message">{error}</p>}
          <div style={{ overflowX: 'auto' }}> {/* Scroll container for table */}
            <table className="requests-table">
              <thead>
                <tr>
                  {columns.map(colKey => (
                    <th
                      key={colKey}
                      onClick={() => requestSort(colKey)}
                      style={{ cursor: colKey !== 'actions' ? 'pointer' : 'default' }}
                    >
                      {columnLabels[colKey]}
                      {/* Sort indicator */}
                      {sortConfig.key === colKey && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr><td colSpan={columns.length}>No requests found.</td></tr>
                ) : (
                  displayed.map(req => {
                    const isEditing = editingId === req.id;
                    return (
                      <tr key={req.id}>
                        <td>{req.id}</td>
                        <td>
                          {isEditing ? <input type="text" name="expenseType" value={draft.expenseType ?? ''} onChange={handleInputChange} /> : req.expenseType}
                        </td>
                        <td>
                          {isEditing ? <input type="text" name="category" value={draft.category ?? ''} onChange={handleInputChange} /> : req.category}
                        </td>

                        {/* === Status Cell with Badge === */}
                        <td data-status={req.status}>
                          <span className="status-badge">{req.status}</span>
                        </td>
                        {/* ============================== */}

                        <td>
                          {isEditing ? <input type="number" name="amount" value={draft.amount ?? ''} onChange={handleInputChange} step="0.01" min="0" /> : `$${req.amount.toFixed(2)}`}
                        </td>
                        <td>{req.name ?? 'N/A'}</td>
                        <td>
                          {/* Show actions only if Pending */}
                          {req.status === 'Pending' ? (
                            isEditing ? (
                              <>
                                <button className="save-btn" onClick={saveEdit}>Save</button>
                                <button className="cancel-btn" onClick={cancelEdit}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button className="edit-btn" onClick={() => startEdit(req)}>Edit</button>
                                <button className="delete-btn" onClick={() => handleDelete(req.id)}>Delete</button>
                              </>
                            )
                          ) : (
                            <span>-</span> // Placeholder for non-pending rows
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}