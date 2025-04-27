// src/pages/AdminDashboard/AdminDashboard.jsx
// Fixed TypeError for dashboardMetrics and Whitespace warning in table
// Added more robust checks before accessing array properties

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx';
import AnalyticsPane from '../components/AnalyticsPane.jsx';
import ManageUsersPane from '../components/ManageUsersPane.jsx';
import profileSvg from '../../assets/profile.svg';
import './AdminDashboard.css';

const BASE_URL = 'http://localhost:5001';

const expenseTableColumns = [
  { key: 'id', label: 'ID' }, { key: 'email', label: 'Email' },
  { key: 'expenseType', label: 'Type' }, { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status' }, { key: 'total', label: 'Amount' },
  { key: 'vendor', label: 'Vendor/Name' },
  { key: 'actions', label: 'Actions' },
];

const AdminDashboard = () => {
  // === HOOKS ===
  const auth = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  // --- State ---
  const [view, setView] = useState('dashboard');
  const [expenses, setExpenses] = useState([]); // Initialize as empty array
  const [userList, setUserList] = useState([]); // Initialize as empty array
  const [isLoading, setIsLoading] = useState(true); // Start loading true
  const [error, setError] = useState('');
  const [userMessage, setUserMessage] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterExpenseType, setFilterExpenseType] = useState('');
  const [filterUserRole, setFilterUserRole] = useState('');
  const [filterDashboardStatus, setFilterDashboardStatus] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showClarifyModal, setShowClarifyModal] = useState(false);
  const [clarifyExpenseId, setClarifyExpenseId] = useState(null);
  const [clarifyExpenseDetails, setClarifyExpenseDetails] = useState({});
  const [clarificationNote, setClarificationNote] = useState('');
  const [clarifyLoading, setClarifyLoading] = useState(false);
  const [clarifyError, setClarifyError] = useState('');
  const [actionMessage, setActionMessage] = useState({ type: '', text: '', id: null });

  // === CALLBACKS & VALUES ===

  const fetchExpenses = useCallback(async () => {
    setError('');
    // No need to set loading true here if it's set in useEffect
    try {
        const { data } = await axios.get(`${BASE_URL}/get-expenses`);
        // Ensure data is always an array, even if API returns null/undefined
        setExpenses(Array.isArray(data) ? data.map(e => ({ ...e, total: parseFloat(e.total) || 0 })) : []);
    } catch (err) {
        console.error("Error fetching expenses:", err);
        setError('Failed to load expenses.');
        setExpenses([]); // Set to empty array on error
    } finally {
        setIsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    // No need to set loading true here if it's set in useEffect
    setError('');
    try {
        const { data } = await axios.get(`${BASE_URL}/get-users`);
        const employees = (data?.employees || []).map(email => ({ email, role: 'employee' }));
        const admins = (data?.admins || []).map(email => ({ email, role: 'admin' }));
        const userMap = new Map();
        employees.forEach(user => userMap.set(user.email, user));
        admins.forEach(user => userMap.set(user.email, user));
        // Ensure userList is always an array
        setUserList(Array.from(userMap.values()));
    } catch (err) {
        console.error('Failed to load users:', err);
        setError('Failed to load users.');
        setUserList([]); // Set to empty array on error
    } finally {
        setIsLoading(false);
    }
  }, []);

  // --- Other Callbacks (handleUpdateExpense, etc.) ---
  // Ensure these also handle potential edge cases if needed
  const handleUpdateExpense = useCallback(async (id, field, value) => { /* ... */ }, [expenses]);
  const handleDeleteExpense = useCallback(async (id) => { /* ... */ }, [expenses]);
  const requestSort = useCallback((key) => { /* ... */ }, [sortConfig]);
  const handleChangeUserRole = useCallback(async (email, newRole) => { /* ... */ }, [fetchUsers]);
  const handleRemoveUser = useCallback(async (email) => { /* ... */ }, [fetchUsers]);
  const handleAddUser = useCallback(async () => { /* ... */ }, [newUserEmail, newUserRole, fetchUsers]);
  const handleSignOut = useCallback(() => { /* ... */ }, [auth, navigate]);
  const handleMetricClick = useCallback((statusLabel) => { /* ... */ }, []);
  const formatDate = useCallback((dateString) => { /* ... */ }, []);
  const formatCurrency = useCallback((amount) => { /* ... */ }, []);
  const openClarificationModal = useCallback((expense) => { /* ... */ }, [formatDate, formatCurrency]);
  const closeClarificationModal = useCallback(() => { /* ... */ }, []);
  const submitClarificationRequest = useCallback(async () => { /* ... */ }, [clarifyExpenseId, clarificationNote, closeClarificationModal]);


  // --- Memoized Derived State ---
  const dashboardMetrics = useMemo(() => {
    if (!Array.isArray(expenses)) { // Check if expenses is an array
        return { Total: 0, Approved: 0, Pending: 0, Rejected: 0, 'Clarification Requested': 0 };
    }
    const counts = { Total: expenses.length, Approved: 0, Pending: 0, Rejected: 0, 'Clarification Requested': 0 };
    expenses.forEach(exp => {
        const status = exp.status || 'Pending';
        counts[status] = (counts[status] || 0) + 1;
    });
    return counts;
  }, [expenses]);

  const categories = useMemo(() => Array.isArray(expenses) ? [...new Set(expenses.map(e => e.category).filter(Boolean))].sort() : [], [expenses]); // Add check
  const expenseTypes = useMemo(() => Array.isArray(expenses) ? [...new Set(expenses.map(e => e.expenseType).filter(Boolean))].sort() : [], [expenses]); // Add check
  const displayedExpenses = useMemo(() => {
      if (!Array.isArray(expenses)) return []; // Return empty if expenses not array
      let filtered = expenses.filter(e =>
            (!searchEmail || e.email.toLowerCase().includes(searchEmail.toLowerCase())) &&
            (!filterCategory || e.category === filterCategory) &&
            (!filterExpenseType || e.expenseType === filterExpenseType) &&
            (!filterDashboardStatus || e.status === filterDashboardStatus)
        );
        if (sortConfig.key && view === 'dashboard') {
            // ... (sorting logic remains the same) ...
        }
        return filtered;
   }, [expenses, searchEmail, filterCategory, filterExpenseType, filterDashboardStatus, sortConfig, view]);


  // === EFFECTS ===
  useEffect(() => {
    setIsLoading(true); // Set loading true when view changes
    setError(''); setUserMessage(''); setSearchEmail(''); setFilterCategory('');
    setFilterExpenseType(''); setFilterUserRole(''); setFilterDashboardStatus('');
    setSortConfig({ key: null, direction: 'asc' });

    if (view === 'dashboard') { fetchExpenses(); }
    else if (view === 'users') { fetchUsers(); }
    else if (view === 'analytics') {
        // Only fetch if expenses aren't already loaded
        if (!expenses || expenses.length === 0) { fetchExpenses(); }
        else { setIsLoading(false); } // Already have data
    }
    else { setIsLoading(false); } // Unknown view
  }, [view, fetchExpenses, fetchUsers]); // Removed expenses.length dependency here

  useEffect(() => { /* ... click outside handler ... */ }, [showProfile]);


  // === AUTH CHECK ===
  if (auth === undefined) { return <div>Loading Authentication...</div>; }
  if (!auth.isAuthChecked) { return <div>Loading Session...</div>; }
  if (!auth.isAuthenticated) { return <Navigate to="/login" replace />; }
  if (!auth.role || auth.role.toLowerCase() !== 'admin') { return <Navigate to="/login" replace />; }
  const { logout, email, avatarUrl } = auth;


  // === RENDER LOGIC HELPER ===
  const renderMainContent = () => {
    // Show loading spinner centrally if loading
    if (isLoading) return <div className="spinner-container"><div className="spinner">Loading...</div></div>;

    // --- FIX: More robust error/empty state check ---
    // Check for error first
    if (error) {
         // Decide whether to show error even if there's some old data, or only if data is empty
         // This version shows error if fetch failed, regardless of old data
         return <div className="message error-message" style={{ margin: '2rem auto', textAlign: 'center' }}>{error}</div>;
    }
    // If no error and not loading, check if data for the current view is missing/empty
    if (view === 'dashboard' && !Array.isArray(expenses)) {
        // This case shouldn't happen with proper initialization and fetch handling, but as a fallback:
        return <div className="message info-message">Expense data is unavailable.</div>;
    }
     if (view === 'users' && !Array.isArray(userList)) {
        return <div className="message info-message">User data is unavailable.</div>;
    }
    // --- End Fix ---


    switch (view) {
      case 'dashboard':
        // We know expenses is an array here due to checks above
        return (
          <div className="dashboard-view-content">
            <div className="metrics-row">
              {/* dashboardMetrics should be safe to map now */}
              {dashboardMetrics && Object.entries(dashboardMetrics).map(([label, count]) => (
                <div key={label} className={`metric-card metric-${label.toLowerCase().replace(/[\s]+/g, '-')} ${filterDashboardStatus === label ? 'active-filter' : ''}`} onClick={() => handleMetricClick(label)} role="button" tabIndex={0} onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleMetricClick(label)}>
                  <h4>{label}</h4>
                  <p>{count}</p>
                </div>
              ))}
            </div>
            <h2>Expense Requests {filterDashboardStatus ? `(${filterDashboardStatus})` : ''}</h2>
            {/* Display non-blocking errors (e.g., update error) */}
            {/* {error && <div className="message error-message">{error}</div>} */}
            <div className="filters">{/* ... filters ... */}</div>
            <div className="table-wrapper"><table className="dynamic-table">
                <thead><tr>{expenseTableColumns.map(col => (<th key={col.key} onClick={() => requestSort(col.key)} style={{ cursor: ['actions', 'status'].includes(col.key) ? 'default' : 'pointer' }}>{col.label}{sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}</th>))}</tr></thead>
                <tbody>
                  {/* displayedExpenses should be safe to check length */}
                  {displayedExpenses.length === 0
                    ? (<tr><td colSpan={expenseTableColumns.length}>No matching expense requests found.</td></tr>)
                    : (displayedExpenses.map(exp => (
                      // Ensure no whitespace between <tr> and <td>
                      <tr key={exp.id}><td>{exp.id}</td><td>{exp.email}</td><td>{exp.expenseType ?? 'N/A'}</td><td>{exp.category ?? 'N/A'}</td><td><select className={`status-select status-${exp.status?.toLowerCase().replace(/[\s]+/g, '-') ?? 'pending'}`} value={exp.status || 'Pending'} onChange={(e) => handleUpdateExpense(exp.id, 'status', e.target.value)}><option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option><option value="Clarification Requested">Clarification Requested</option></select>{actionMessage.id === exp.id && (<p className={`action-feedback ${actionMessage.type}-message`}>{actionMessage.text}</p>)}</td><td style={{ textAlign: 'right' }}>{formatCurrency(exp.total)}</td><td>{exp.vendor ?? exp.name ?? 'N/A'}</td><td className="actions">{exp.status !== 'Clarification Requested' && (<button onClick={() => openClarificationModal(exp)} className="action-btn clarify-btn" title="Request Clarification">?</button>)}<button className="action-btn delete-btn" onClick={() => handleDeleteExpense(exp.id)}>Delete</button></td></tr>
                    )))
                  }
                </tbody>
            </table></div>
          </div> );
      case 'users':
        // We know userList is an array here
        return ( <ManageUsersPane userList={userList} /* ... other props ... */ /> );
      case 'analytics':
        // We know expenses is an array here
        return <AnalyticsPane expenses={expenses} isLoading={isLoading} error={error} />;
      default: return <h2>Invalid view selected.</h2>;
    }
   };

  // === FINAL RETURN STRUCTURE ===
  return (
    <div className="login-container admin-dashboard-layout">
      <aside className="sidebar">{/* ... sidebar JSX ... */}</aside>
      <main className="form-section admin-main-content">
         <header className="admin-header">
             <div style={{ flexGrow: 1 }}></div>
             <div className="profile-dropdown" ref={profileRef} >
                 <img src={avatarUrl || profileSvg} alt="Profile" className="profile-pic" onClick={() => setShowProfile(p => !p)} />
                 {showProfile && (
                     <ul className="profile-menu">
                         <li className="profile-email">{email}</li>
                         <li><button onClick={handleSignOut}>Sign Out</button></li>
                     </ul>
                 )}
             </div>
         </header>
        {/* Render main content */}
        {renderMainContent()}
      </main>

      {/* Clarification Modal */}
      {showClarifyModal && (
        <div className="modal-backdrop">
            <div className="modal-content">
                <h2>Request Clarification</h2>
                <p>Expense ID: <strong>{clarifyExpenseDetails.id}</strong></p>
                <p>Employee: <strong>{clarifyExpenseDetails.employee}</strong></p>
                <p>Details: {clarifyExpenseDetails.vendor} ({clarifyExpenseDetails.date}) - {clarifyExpenseDetails.total}</p>
                <div className="form-group">
                    <label htmlFor="clarificationNote">Add Note (Optional):</label>
                    <textarea id="clarificationNote" className="modal-textarea" rows="4" value={clarificationNote} onChange={(e) => setClarificationNote(e.target.value)} placeholder="E.g., 'Please provide details...'" disabled={clarifyLoading}/>
                </div>
                {clarifyError && <p className="message error-message">{clarifyError}</p>}
                <div className="modal-actions">
                    <button className="btn modal-btn-primary" onClick={submitClarificationRequest} disabled={clarifyLoading}> {clarifyLoading ? 'Sending...' : 'Send Request'} </button>
                    <button className="btn modal-btn-secondary" onClick={closeClarificationModal} disabled={clarifyLoading}> Cancel </button>
                </div>
            </div>
        </div>
      )}
      {/* End Clarification Modal */}
    </div>
  );
};

export default AdminDashboard;
