// src/pages/AdminDashboard/AdminDashboard.jsx
// Final version incorporating hook fixes, status dropdown, metrics, and layout adjustments.

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx'; // Verify path
import AnalyticsPane from '../components/AnalyticsPane.jsx'; // Verify path
import ManageUsersPane from '../components/ManageUsersPane.jsx'; // Verify path
import './AdminDashboard.css'; // Ensure CSS is loaded

// Verify backend URL
const BASE_URL = 'http://localhost:5001';

// Define column configuration outside component for stability
const expenseTableColumns = [
  { key: 'id', label: 'ID' },
  { key: 'email', label: 'Email' },
  { key: 'expenseType', label: 'Type' },
  { key: 'category', label: 'Category' },
  { key: 'status', label: 'Status' },
  { key: 'amount', label: 'Amount' },
  { key: 'name', label: 'Name' },
  { key: 'actions', label: 'Actions' },
];

const AdminDashboard = () => {
  // === 1. HOOKS FIRST (Unconditionally) ===
  const auth = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef(null);

  // State hooks
  const [view, setView] = useState('dashboard');
  const [expenses, setExpenses] = useState([]);
  const [userList, setUserList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userMessage, setUserMessage] = useState(''); // For user management status

  // Filter/Sort State
  const [searchEmail, setSearchEmail] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterExpenseType, setFilterExpenseType] = useState('');
  const [filterUserRole, setFilterUserRole] = useState(''); // Separate state for user role filter
  const [filterDashboardStatus, setFilterDashboardStatus] = useState(''); // State for dashboard status filter (from metrics)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Add User Form State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Profile Dropdown State (if needed)
  const [showProfile, setShowProfile] = useState(false);

  // === 2. CALLBACKS & MEMOS ===
  const fetchExpenses = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { data } = await axios.get(`${BASE_URL}/get-expenses`);
      setExpenses(Array.isArray(data) ? data.map(e => ({ ...e, amount: parseFloat(e.amount) || 0 })) : []);
    } catch (err) { console.error("Error fetching expenses:", err); setError('Failed to load expenses.'); setExpenses([]); }
    finally { setIsLoading(false); }
  }, []); // Assuming BASE_URL is constant

  const fetchUsers = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { data } = await axios.get(`${BASE_URL}/get-users`);
      const employees = (data.employees || []).map(email => ({ email, role: 'employee' }));
      const admins = (data.admins || []).map(email => ({ email, role: 'admin' }));
      // De-duplicate using Map, prioritizing admin role
      const userMap = new Map();
      employees.forEach(user => userMap.set(user.email, user));
      admins.forEach(user => userMap.set(user.email, user));
      setUserList(Array.from(userMap.values()));
    } catch (err) { console.error('Failed to load users:', err); setError('Failed to load users.'); setUserList([]); }
    finally { setIsLoading(false); }
  }, []); // Assuming BASE_URL is constant

  const handleUpdateExpense = useCallback(async (id, field, value) => {
    setError(''); const originalExpenses = JSON.parse(JSON.stringify(expenses)); const expenseIndex = expenses.findIndex(e => e.id === id); if (expenseIndex === -1) return;
    const newValue = field === 'amount' ? (parseFloat(value) || 0) : value;
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, [field]: newValue } : e)); // Optimistic update
    try { await axios.post(`${BASE_URL}/update-expense`, { expenseId: id, field, newValue }); }
    catch (err) { console.error(`Error updating ${field}:`, err); setError(`Error updating ${field}. Reverting.`); setExpenses(originalExpenses); } // Revert
  }, [expenses]);

  const handleDeleteExpense = useCallback(async (id) => {
      if (!window.confirm("Delete this expense?")) return; setError(''); const originalExpenses = [...expenses];
      setExpenses(prev => prev.filter(e => e.id !== id)); // Optimistic update
      try { await axios.post(`${BASE_URL}/delete-expense`, { expenseId: id }); }
      catch (err) { console.error('Error deleting expense:', err); setError('Error deleting expense.'); setExpenses(originalExpenses); } // Revert
  }, [expenses]);

  const requestSort = useCallback((key) => {
      if (key === 'actions') return; let direction = 'asc'; if (sortConfig.key === key && sortConfig.direction === 'asc') { direction = 'desc'; } setSortConfig({ key, direction });
  }, [sortConfig]);

  // User Management Handlers...
  const handleChangeUserRole = useCallback(async (email, newRole) => { setUserMessage(''); setError(''); try { await axios.post(`${BASE_URL}/update-user`, { email, newRole }); await fetchUsers(); setUserMessage(`Updated role for ${email}.`); } catch (err) { console.error("Update role error:", err); setError(`Failed to update role for ${email}.`); } }, [fetchUsers]);
  const handleRemoveUser = useCallback(async (email) => { setUserMessage(''); setError(''); if (window.confirm(`Remove user ${email}?`)) { try { await axios.post(`${BASE_URL}/delete-user`, { email }); await fetchUsers(); setUserMessage(`Removed user ${email}.`); } catch (err) { console.error("Remove user error:", err); setError(`Failed to remove user ${email}.`); } } }, [fetchUsers]);
  const handleAddUser = useCallback(async () => { setUserMessage(''); setError(''); const emailTrim = newUserEmail.trim().toLowerCase(); if (!emailTrim.includes('@') || !newUserRole) { setUserMessage('Error: Invalid email or role.'); return; } setIsAddingUser(true); try { const res = await axios.post(`${BASE_URL}/add-user`, { email: emailTrim, role: newUserRole }); if (res.data.success) { setUserMessage(`Success: ${emailTrim} added.`); setNewUserEmail(''); setNewUserRole(''); await fetchUsers(); } else { setUserMessage(`Error: ${res.data.message || 'Could not add user.'}`); } } catch (err) { setUserMessage(`Error: ${err.response?.data?.message || 'An unexpected error occurred.'}`); } finally { setIsAddingUser(false); } }, [newUserEmail, newUserRole, fetchUsers]);
  const handleSignOut = useCallback(() => { if (auth && typeof auth.logout === 'function') { auth.logout(); } navigate('/login', { replace: true }); }, [auth, navigate]); // Use auth directly

  // Dashboard Metrics Calculation
  const dashboardMetrics = useMemo(() => {
    const counts = { Total: expenses.length, Approved: 0, Pending: 0, Rejected: 0 };
    expenses.forEach(exp => {
        if (exp.status === 'Approved') counts.Approved++;
        else if (exp.status === 'Pending') counts.Pending++;
        else if (exp.status === 'Rejected') counts.Rejected++;
    });
    return counts;
  }, [expenses]);

  // Click handler for metric cards
  const handleMetricClick = useCallback((statusLabel) => {
      const newStatusFilter = statusLabel === 'Total' ? '' : statusLabel;
      setFilterDashboardStatus(newStatusFilter);
      // Reset other filters when clicking a metric card
      setSearchEmail(''); setFilterCategory(''); setFilterExpenseType('');
      setSortConfig({ key: null, direction: 'asc' });
  }, []); // No external dependencies needed

  // Memoized derived state for display
  const categories = useMemo(() => [...new Set(expenses.map(e => e.category))].sort(), [expenses]);
  const expenseTypes = useMemo(() => [...new Set(expenses.map(e => e.expenseType))].sort(), [expenses]);

  const displayedExpenses = useMemo(() => {
    let filtered = expenses.filter(e =>
      (!searchEmail || e.email.toLowerCase().includes(searchEmail.toLowerCase())) &&
      (!filterCategory || e.category === filterCategory) &&
      (!filterExpenseType || e.expenseType === filterExpenseType) &&
      (!filterDashboardStatus || e.status === filterDashboardStatus) // Filter by dashboard status
    );
    // Apply sorting if key is set
    if (sortConfig.key && view === 'dashboard') {
        const { key, direction } = sortConfig;
        filtered.sort((a, b) => { /* ...sorting logic... */
            let valA = a[key]; let valB = b[key]; valA = valA ?? (key === 'amount' ? 0 : ''); valB = valB ?? (key === 'amount' ? 0 : '');
            if (key === 'amount') { return direction === 'asc' ? valA - valB : valB - valA; }
            else { valA = String(valA).toLowerCase(); valB = String(valB).toLowerCase(); if (valA < valB) return direction === 'asc' ? -1 : 1; if (valA > valB) return direction === 'asc' ? 1 : -1; return 0; }
        });
    }
    return filtered;
  }, [expenses, searchEmail, filterCategory, filterExpenseType, filterDashboardStatus, sortConfig, view]); // Added filterDashboardStatus


  // === 3. EFFECTS ===
  useEffect(() => {
    // Reset filters and fetch data when view changes
    setError(''); setUserMessage(''); setSearchEmail(''); setFilterCategory(''); setFilterExpenseType(''); setFilterUserRole(''); setFilterDashboardStatus('');
    setSortConfig({ key: null, direction: 'asc' });
    if (view === 'dashboard') { fetchExpenses(); }
    else if (view === 'users') { fetchUsers(); }
  }, [view, fetchExpenses, fetchUsers]); // Correct dependencies

  useEffect(() => { /* ... click outside handler for profile dropdown ... */
      const handleClickOutside = (event) => { if (profileRef.current && !profileRef.current.contains(event.target)) { setShowProfile(false); } };
      if (showProfile) { document.addEventListener('mousedown', handleClickOutside); }
      return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, [showProfile]);


  // === 4. RENDER LOGIC HELPER ===
  const renderMainContent = () => {
    if (isLoading) return <div>Loading...</div>;
    // Display error prominently if main data fetch failed for the view
    if (error && ((view === 'dashboard' && !expenses.length) || (view === 'users' && !userList.length))) {
        return <div className="error" style={{ margin: '2rem auto', textAlign: 'center' }}>{error}</div>;
    }

    switch (view) {
      case 'dashboard':
        return (
          <>
            {/* Metrics Row */}
            <div className="metrics-row">
              {Object.entries(dashboardMetrics).map(([label, count]) => (
                <div
                    key={label}
                    // Add dynamic class for styling based on label
                    className={`metric-card metric-${label.toLowerCase()} ${filterDashboardStatus === label ? 'active-filter' : ''}`}
                    onClick={() => handleMetricClick(label)}
                    role="button" tabIndex={0}
                    onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && handleMetricClick(label)}
                >
                  <h4>{label}</h4><p>{count}</p>
                </div> ))}
            </div>
            {/* Dashboard Table */}
            <h2>Expense Requests {filterDashboardStatus ? `(${filterDashboardStatus})` : ''}</h2>
            {error && <div className="error">{error}</div>} {/* Show non-blocking update errors */}
            <div className="filters">
                <input id="expense-search-email" name="expenseSearchEmail" type="text" placeholder="Search by email..." value={searchEmail} onChange={e => setSearchEmail(e.target.value)} />
                <select id="expense-filter-category" name="expenseFilterCategory" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}> <option value="">All Categories</option> {categories.map(c => <option key={c} value={c}>{c}</option>)} </select>
                <select id="expense-filter-type" name="expenseFilterType" value={filterExpenseType} onChange={e => setFilterExpenseType(e.target.value)}> <option value="">All Expense Types</option> {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)} </select>
                <button onClick={() => { setSearchEmail(''); setFilterCategory(''); setFilterExpenseType(''); setFilterDashboardStatus('');}} style={{ marginLeft: 'auto' }} disabled={!searchEmail && !filterCategory && !filterExpenseType && !filterDashboardStatus}>Clear All Filters</button>
            </div>
            <div className="table-wrapper">
              <table className="dynamic-table">
                <thead><tr>{expenseTableColumns.map(col => (<th key={col.key} onClick={() => requestSort(col.key)} style={{ cursor: col.key === 'actions' || col.key === 'status' ? 'default' : 'pointer' }}>{col.label}{sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}</th>))}</tr></thead>
                <tbody>
                  {displayedExpenses.length === 0 ? (<tr><td colSpan={expenseTableColumns.length}>No matching expense requests found.</td></tr>) : (
                    displayedExpenses.map(exp => (
                      <tr key={exp.id}>
                        <td>{exp.id}</td><td>{exp.email}</td><td>{exp.expenseType}</td><td>{exp.category}</td>
                        {/* Status Select Dropdown */}
                        <td><select className={`status-select ${exp.status?.toLowerCase() ?? 'pending'}`} value={exp.status || 'Pending'} onChange={(e) => handleUpdateExpense(exp.id, 'status', e.target.value)}><option value="Pending">Pending</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option></select></td>
                        <td style={{ textAlign: 'right' }}>{`$${exp.amount.toFixed(2)}`}</td><td>{exp.name ?? 'N/A'}</td>
                        <td className="actions"><button className="delete-btn" onClick={() => handleDeleteExpense(exp.id)}>Delete</button></td>
                      </tr> )) )}
                </tbody>
              </table>
            </div>
          </> );
      case 'users':
        return ( <ManageUsersPane
            // Pass necessary state and functions down
            userList={userList || []} filterRole={filterUserRole} setFilterRole={setFilterUserRole}
            isLoading={isLoading} error={error} userMessage={userMessage}
            newUserEmail={newUserEmail} newUserRole={newUserRole} isAddingUser={isAddingUser}
            sortConfig={sortConfig} searchEmail={searchEmail}
            // Pass handlers
            fetchUsers={fetchUsers} setError={setError} setUserMessage={setUserMessage}
            setNewUserEmail={setNewUserEmail} setNewUserRole={setNewUserRole}
            requestSort={requestSort} handleAddUser={handleAddUser} handleRemoveUser={handleRemoveUser}
            handleChangeUserRole={handleChangeUserRole} setSearchEmail={setSearchEmail}
            /> );
      case 'analytics':
        // Pass necessary props
        return <AnalyticsPane expenses={expenses} isLoading={isLoading} error={error} />;
      default: return <h2>Invalid view selected.</h2>;
    }
   };

  // === 5. FINAL RETURN STRUCTURE (Handles Auth Check Internally) ===
  // This structure avoids the hook error.
  if (auth === undefined) {
      // Auth context is likely still loading from AuthProvider
      return <div>Loading Authentication...</div>; // Or return null or a loading spinner
  }

  // If AuthProvider has loaded but user is not authenticated, redirect
  if (!auth.email) {
      return <Navigate to="/login" replace />;
  }

  // If we reach here, all hooks have run AND user is authenticated
  return (
    <div className="admin-dashboard">
      <aside className="nav-pane">
        <div className="nav-pane-content">
          <h3>Admin</h3>
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={view === 'users' ? 'active' : ''} onClick={() => setView('users')}>Manage Users</button>
          <button className={view === 'analytics' ? 'active' : ''} onClick={() => setView('analytics')}>Analytics</button>
          {/* Profile UI can be added here if needed */}
          <button className="sign-out" onClick={handleSignOut}>Sign Out</button>
        </div>
      </aside>
      <main className="table-pane">
        {/* Render the content determined by the helper function */}
        {renderMainContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
