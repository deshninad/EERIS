import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx';
import profileSvg from '../../assets/profile.svg';  // import your svg here
import './ESummaryPage.css';

const BASE_URL = 'http://localhost:5001';

export default function ESummaryPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  if (!auth?.email) return <Navigate to="/login" replace />;
  const { email, logout, avatarUrl } = auth;

  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});

  // Profile dropdown
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = e => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Fetch user requests
  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/get-expenses`);
        const myReqs = data
          .filter(r => r.email === email)
          .map(r => ({ ...r, amount: parseFloat(r.amount) || 0 }));
        setRequests(myReqs);
      } catch {
        setError('Failed to load your expense requests.');
      }
    })();
  }, [email]);

  // Delete
  const handleDelete = async id => {
    try {
      await axios.post(`${BASE_URL}/delete-expense`, { expenseId: id });
      setRequests(rs => rs.filter(r => r.id !== id));
    } catch {
      setError('Could not delete that request.');
    }
  };

  // Start editing
  const startEdit = r => {
    setEditingId(r.id);
    setDraft({ id: r.id, expenseType: r.expenseType, category: r.category, amount: r.amount });
  };
  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setDraft({});
  };
  // Save changes
  const saveEdit = async () => {
    try {
      const { id, expenseType, category, amount } = draft;
      await axios.post(`${BASE_URL}/update-expense`, { expenseId: id, field: 'expenseType', newValue: expenseType });
      await axios.post(`${BASE_URL}/update-expense`, { expenseId: id, field: 'category', newValue: category });
      await axios.post(`${BASE_URL}/update-expense`, { expenseId: id, field: 'amount', newValue: amount });
      setRequests(rs => rs.map(r => r.id === id ? { ...r, expenseType, category, amount: parseFloat(amount) } : r));
      cancelEdit();
    } catch {
      setError('Error saving changes.');
    }
  };

  // Sorting
  const requestSort = key => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // Filter & sort displayed
  const displayed = useMemo(() => {
    let arr = filterStatus ? requests.filter(r => r.status === filterStatus) : [...requests];
    if (sortConfig.key) {
      arr.sort((a, b) => {
        let va = a[sortConfig.key], vb = b[sortConfig.key];
        if (sortConfig.key === 'amount') return sortConfig.direction === 'asc' ? va - vb : vb - va;
        va = va.toString().toLowerCase(); vb = vb.toString().toLowerCase();
        if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1;
        if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return arr;
  }, [requests, filterStatus, sortConfig]);

  // Metrics
  const metrics = useMemo(() => ({
    Total: requests.length,
    Approved: requests.filter(r => r.status === 'Approved').length,
    Pending: requests.filter(r => r.status === 'Pending').length,
    Rejected: requests.filter(r => r.status === 'Rejected').length
  }), [requests]);

  const handleMetricClick = label => {
    setFilterStatus(label === 'Total' ? null : label);
    setSortConfig({ key: null, direction: 'asc' });
  };

  return (
    <div className="dashboard-container">
      <nav className="navbar">
        <h2 className="navbar-logo">EERIS</h2>
        <div className="nav-links">
          <button className="nav-btn" onClick={() => navigate('/upload')}>Upload</button>
          <div className="profile-dropdown" ref={profileRef}>
            <img
              src={avatarUrl || profileSvg}
              alt="Profile"
              className="profile-pic"
              onClick={() => setShowProfile(s => !s)}
            />
            {showProfile && (
              <ul className="profile-menu">
                <li className="profile-email">{email}</li>
                <li><button onClick={() => { logout(); navigate('/login'); }}>Sign Out</button></li>
              </ul>
            )}
          </div>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="metrics-row">
          {Object.entries(metrics).map(([label, count]) => (
            <div
              key={label}
              className={`metric-card ${label.toLowerCase()}`}
              onClick={() => handleMetricClick(label)}
              style={{ cursor: 'pointer' }}
            >
              <h4>{label}</h4>
              <p>{count}</p>
            </div>
          ))}
        </div>

        <div className="requests-card">
          <h3>My Expense Requests</h3>
          {error && <p className="error-message">{error}</p>}
          <table className="requests-table">
            <thead>
              <tr>
                {['id', 'expenseType', 'category', 'status', 'amount', 'name'].map(col => (
                  <th
                    key={col}
                    onClick={() => requestSort(col)}
                    style={{ cursor: col !== 'status' ? 'pointer' : 'default' }}
                  >
                    {col === 'expenseType' ? 'Type' : col.charAt(0).toUpperCase() + col.slice(1)}
                    {sortConfig.key === col && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                  </th>
                ))}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 ? (
                <tr><td colSpan="7">No requests found.</td></tr>
              ) : (
                displayed.map(req => {
                  const editing = editingId === req.id;
                  return (
                    <tr key={req.id}>
                      <td>{req.id}</td>
                      <td>
                        {editing ? (
                          <input
                            type="text"
                            value={draft.expenseType}
                            onChange={e => setDraft(d => ({ ...d, expenseType: e.target.value }))}
                          />
                        ) : (
                          req.expenseType
                        )}
                      </td>
                      <td>
                        {editing ? (
                          <input
                            type="text"
                            value={draft.category}
                            onChange={e => setDraft(d => ({ ...d, category: e.target.value }))}
                          />
                        ) : (
                          req.category
                        )}
                      </td>
                      <td>{req.status}</td>
                      <td>
                        {editing ? (
                          <input
                            type="number"
                            value={draft.amount}
                            onChange={e => setDraft(d => ({ ...d, amount: e.target.value }))}
                          />
                        ) : (
                          `$${req.amount.toFixed(2)}`
                        )}
                      </td>
                      <td>{req.name}</td>
                      <td>
                        {req.status === 'Pending' && (
                          editing ? (
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
  );
}
