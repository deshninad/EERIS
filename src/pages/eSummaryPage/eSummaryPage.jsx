// src/pages/ESummaryPage/ESummaryPage.jsx

// === FIX: Add useCallback to the import ===
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
// =========================================
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx';
import profileSvg from '../../assets/profile.svg';
import './ESummaryPage.css';

// ... rest of the ESummaryPage component code from the previous version ...
// (Ensure the rest of the component logic, including the metrics row rendering, is present)

const BASE_URL = 'http://localhost:5001';

const tableColumns = [
    { key: 'id', label: 'ID' }, { key: 'expenseType', label: 'Type' },
    { key: 'category', label: 'Category' }, { key: 'status', label: 'Status' },
    { key: 'amount', label: 'Amount' }, { key: 'name', label: 'Name' },
    { key: 'actions', label: 'Actions'}
];

export default function ESummaryPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [showProfile, setShowProfile] = useState(false);

  if (auth === undefined) return <div>Loading Session...</div>;
  if (!auth?.email) return <Navigate to="/login" replace />;
  const { email, logout, avatarUrl } = auth;

  const fetchUserExpenses = useCallback(async () => {
    if (!email) return; setIsLoading(true); setError('');
    try { const { data } = await axios.get(`${BASE_URL}/get-expenses`); const allRequests = Array.isArray(data) ? data : []; const myReqs = allRequests.filter(r => r.email === email).map(r => ({ ...r, amount: parseFloat(r.amount) || 0 })); setRequests(myReqs); }
    catch (err) { console.error("Failed to load user expense requests:", err); setError('Failed to load your expense requests.'); setRequests([]); } finally { setIsLoading(false); }
  }, [email]);

  const handleDelete = useCallback(async (id) => { if (!window.confirm("Delete this request?")) return; setError(''); const originalRequests = [...requests]; setRequests(rs => rs.filter(r => r.id !== id)); try { await axios.post(`${BASE_URL}/delete-expense`, { expenseId: id }); } catch (err) { console.error("Could not delete request:", err); setError('Could not delete request.'); setRequests(originalRequests); } }, [requests]);
  const startEdit = useCallback((request) => { setEditingId(request.id); setDraft({ ...request }); }, []);
  const cancelEdit = useCallback(() => { setEditingId(null); setDraft({}); }, []);
  const saveEdit = useCallback(async () => { setError(''); const { id, expenseType, category, amount } = draft; const parsedAmount = parseFloat(amount); if (!expenseType?.trim() || !category?.trim() || isNaN(parsedAmount) || parsedAmount < 0) { setError('Please ensure Type, Category, and a valid Amount (>= 0) are entered.'); return; } const originalRequests = JSON.parse(JSON.stringify(requests)); setRequests(rs => rs.map(r => r.id === id ? { ...r, expenseType, category, amount: parsedAmount } : r)); setEditingId(null); try { await axios.post(`${BASE_URL}/update-expense`, { expenseId: id, field: 'expenseType', newValue: expenseType }); await axios.post(`${BASE_URL}/update-expense`, { expenseId: id, field: 'category', newValue: category }); await axios.post(`${BASE_URL}/update-expense`, { expenseId: id, field: 'amount', newValue: parsedAmount }); } catch (err) { console.error("Error saving changes:", err); setError('Error saving changes. Reverting.'); setRequests(originalRequests); } }, [draft, requests]);
  const handleDraftChange = useCallback((e) => { const { name, value } = e.target; setDraft(d => ({ ...d, [name]: value })); }, []);
  const requestSort = useCallback((key) => { if (key === 'actions') return; let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') { direction = 'desc'; } setSortConfig({ key, direction }); }, [sortConfig]);
  const metrics = useMemo(() => { const counts = { Total: requests.length, Approved: 0, Pending: 0, Rejected: 0 }; requests.forEach(req => { if (req.status === 'Approved') counts.Approved++; else if (req.status === 'Pending') counts.Pending++; else if (req.status === 'Rejected') counts.Rejected++; }); return counts; }, [requests]);
  const handleMetricClick = useCallback((statusLabel) => { const newStatusFilter = statusLabel === 'Total' ? '' : statusLabel; setFilterStatus(newStatusFilter); setSortConfig({ key: null, direction: 'asc' }); }, []);
  const displayed = useMemo(() => { let arr = filterStatus ? requests.filter(r => r.status === filterStatus) : [...requests]; if (sortConfig.key) { arr.sort((a, b) => { let va = a[sortConfig.key]; let vb = b[sortConfig.key]; va = va ?? (sortConfig.key === 'amount' ? 0 : ''); vb = vb ?? (sortConfig.key === 'amount' ? 0 : ''); if (sortConfig.key === 'amount') { return sortConfig.direction === 'asc' ? va - vb : vb - va; } else { va = String(va).toLowerCase(); vb = String(vb).toLowerCase(); if (va < vb) return sortConfig.direction === 'asc' ? -1 : 1; if (va > vb) return sortConfig.direction === 'asc' ? 1 : -1; return 0; } }); } return arr; }, [requests, filterStatus, sortConfig]);

  useEffect(() => { fetchUserExpenses(); }, [fetchUserExpenses]);
  useEffect(() => { const handleClickOutside = (event) => { if (profileRef.current && !profileRef.current.contains(event.target)) { setShowProfile(false); } }; if (showProfile) { document.addEventListener('mousedown', handleClickOutside); } return () => { document.removeEventListener('mousedown', handleClickOutside); }; }, [showProfile]);

  return (
    <div className="esummary-page-container">
      <nav className="navbar"> <h2 className="navbar-logo">EERIS</h2> <div className="nav-links"> <button className="nav-btn" onClick={() => navigate('/upload')}>Upload New</button> <div className="profile-dropdown" ref={profileRef}> <img src={avatarUrl || profileSvg} alt="Profile" className="profile-pic" onClick={() => setShowProfile(s => !s)} /> {showProfile && ( <ul className="profile-menu"> <li className="profile-email">{email}</li> <li><button onClick={() => { if(logout) logout(); navigate('/login', { replace: true }); }}>Sign Out</button></li> </ul> )} </div> </div> </nav>
      <div className="esummary-content">
        <div className="metrics-row">{Object.entries(metrics).map(([label, count]) => (<div key={label} className={`metric-card metric-${label.toLowerCase()} ${filterStatus === label ? 'active-filter' : ''}`} onClick={() => handleMetricClick(label)} role="button" tabIndex={0} onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleMetricClick(label)}><h4>{label}</h4><p>{count}</p></div> ))}</div>
        <div className="requests-card">
          <h3>My Expense Requests {filterStatus ? `(${filterStatus})` : ''}</h3>
          {error && <p className="error-message">{error}</p>}
          {isLoading && !requests.length && <p>Loading requests...</p>}
          <div className="table-wrapper"><table className="requests-table">
              <thead><tr>{tableColumns.map(col => (<th key={col.key} onClick={() => requestSort(col.key)} style={{ cursor: col.key === 'actions' || col.key === 'status' ? 'default' : 'pointer' }}>{col.label}{sortConfig.key === col.key && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}</th>))}</tr></thead>
              <tbody>
                {displayed.length === 0 && !isLoading ? (<tr><td colSpan={tableColumns.length}>No requests found matching criteria.</td></tr>) : (
                  displayed.map(req => { const isEditing = editingId === req.id; return (
                      <tr key={req.id}>
                        <td>{req.id}</td>
                        <td>{isEditing ? (<input type="text" name="expenseType" value={draft.expenseType ?? ''} onChange={handleDraftChange} autoFocus/>) : ( req.expenseType )}</td>
                        <td>{isEditing ? (<input type="text" name="category" value={draft.category ?? ''} onChange={handleDraftChange} />) : ( req.category )}</td>
                        <td data-status={req.status}><span className="status-badge">{req.status}</span></td>
                        <td style={{ textAlign: 'right' }}>{isEditing ? (<input type="number" name="amount" value={draft.amount ?? ''} onChange={handleDraftChange} step="0.01" min="0" style={{width: '80px', textAlign: 'right'}}/>) : ( `$${req.amount.toFixed(2)}` )}</td>
                        <td>{req.name ?? 'N/A'}</td>
                        <td className="actions-cell">
                          {req.status === 'Pending' ? (
                            isEditing ? (
                              <>
                                <span className="action-btn save"   onClick={saveEdit}>Save</span>
                                <span className="action-btn cancel" onClick={cancelEdit}>Cancel</span>
                              </>
                            ) : (
                              <>
                                <span className="action-btn edit"   onClick={() => startEdit(req)}>Edit</span>
                                <span className="action-btn delete" onClick={() => handleDelete(req.id)}>Delete</span>
                              </>
                            )
                          ) : (
                            <span className="placeholder">—</span>
                          )}
                        </td>
                      </tr> ); }) )}
              </tbody>
          </table></div>
        </div>
      </div>
    </div> );
}

