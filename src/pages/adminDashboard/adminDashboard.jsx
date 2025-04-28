// src/pages/AdminDashboard/AdminDashboard.jsx
// Updated to add "Request Clarification" status, PDF Export, Performance Pane, Policies Pane
// FIX: Reordered displayedExpenses (useMemo) and handleExportPDF (useCallback) to fix initialization error

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx';
import AnalyticsPane from '../components/AnalyticsPane.jsx';
import ManageUsersPane from '../components/ManageUsersPane.jsx';
import PerformancePane from '../components/PerformancePane.jsx';
import PoliciesPane from '../components/PoliciesPane.jsx'; // Import the Policies pane
import './AdminDashboard.css';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';


const BASE_URL = 'http://localhost:5001'; // Ensure this matches your backend

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
  // === HOOKS ===
  const auth = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef(null); // For potential profile dropdown (currently unused)
  const [view, setView] = useState('dashboard'); // Default view
  const [expenses, setExpenses] = useState([]);
  const [userList, setUserList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userMessage, setUserMessage] = useState(''); // For user feedback in ManageUsersPane
  const [searchEmail, setSearchEmail] = useState(''); // Filter state for dashboard/users
  const [filterCategory, setFilterCategory] = useState(''); // Filter state for dashboard
  const [filterExpenseType, setFilterExpenseType] = useState(''); // Filter state for dashboard
  const [filterUserRole, setFilterUserRole] = useState(''); // Filter state for users
  const [filterDashboardStatus, setFilterDashboardStatus] = useState(''); // Filter state for dashboard status
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [newUserEmail, setNewUserEmail] = useState(''); // State for adding new user
  const [newUserRole, setNewUserRole] = useState(''); // State for adding new user
  const [isAddingUser, setIsAddingUser] = useState(false); // Loading state for adding user
  const [showProfile, setShowProfile] = useState(false); // State for profile dropdown (currently unused)

  // === DATA FETCHING CALLBACKS ===
  const fetchExpenses = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { data } = await axios.get(`${BASE_URL}/get-expenses`);
      setExpenses(Array.isArray(data)
        ? data.map(e => ({ ...e, amount: parseFloat(e.amount) || 0 }))
        : []
      );
    } catch (err) {
      console.error('Error fetching expenses:', err);
      setError('Failed to load expenses.');
      setExpenses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true); setError('');
    try {
      const { data } = await axios.get(`${BASE_URL}/get-users`);
      const employees = data.employees || [];
      const admins    = data.admins    || [];
      const adminSet = new Set(admins);
      const allEmails = Array.from(new Set([...employees, ...admins]));
      const users = allEmails.map(email => ({
        email,
        role: adminSet.has(email) ? 'admin' : 'employee'
      }));
      setUserList(users);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users.');
      setUserList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // === EXPENSE MANAGEMENT CALLBACKS ===
  const handleUpdateExpense = useCallback(
    async (id, field, value, comment = '') => {
      setError('');
      const originalExpenses = JSON.parse(JSON.stringify(expenses)); // Deep copy
      const parsedValue = field === 'amount' ? (parseFloat(value) || 0) : value;

      // Optimistically update UI
      setExpenses(prevExpenses => prevExpenses.map(e =>
        e.id === id ? { ...e, [field]: parsedValue } : e
      ));

      try {
        await axios.post(`${BASE_URL}/update-expense`, {
          expenseId: id,
          field,
          newValue: parsedValue,
          comment, // Send comment to backend
        });
        // Success: Keep optimistic update
      } catch (err) {
        console.error(`Error updating ${field}:`, err);
        setError(`Error updating ${field}. Reverting.`);
        setExpenses(originalExpenses); // Revert on error
      }
    },
    [expenses] // Dependency includes expenses to ensure originalExpenses is current
  );

  const handleDeleteExpense = useCallback(async (id) => {
    if (!window.confirm(`Are you sure you want to delete expense request #${id}? This action cannot be undone.`)) {
      return;
    }
    setError('');
    const originalExpenses = [...expenses]; // Shallow copy for reverting

    // Optimistically update UI
    setExpenses(prevExpenses => prevExpenses.filter(e => e.id !== id));

    try {
      await axios.post(`${BASE_URL}/delete-expense`, { expenseId: id });
      // Success: Keep optimistic update
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Error deleting expense. Please try again.');
      setExpenses(originalExpenses); // Revert on error
    }
  }, [expenses]); // Dependency includes expenses

  // === USER MANAGEMENT CALLBACKS ===
  const handleAddUser = useCallback(async () => {
    setUserMessage(''); // Clear previous messages
    setError('');
    const emailTrim = newUserEmail.trim().toLowerCase();
    if (!emailTrim.includes('@') || !newUserRole) {
      setUserMessage('Error: Invalid email or role selected.');
      return;
    }
    setIsAddingUser(true);
    try {
      const res = await axios.post(`${BASE_URL}/add-user`, {
        email: emailTrim,
        role: newUserRole
      });
      if (res.data.success) {
        setUserMessage(`Success: User ${emailTrim} added as ${newUserRole}.`);
        setNewUserEmail(''); // Clear form
        setNewUserRole('');
        await fetchUsers(); // Refresh user list
      } else {
        setUserMessage(`Error: ${res.data.message || 'Could not add user.'}`);
      }
    } catch (err) {
      // Handle specific backend errors if available, otherwise show generic message
      setUserMessage(`Error: ${err.response?.data?.message || 'An unexpected error occurred while adding the user.'}`);
      console.error("Add user error:", err);
    } finally {
      setIsAddingUser(false);
    }
  }, [newUserEmail, newUserRole, fetchUsers]); // Dependencies

  const handleRemoveUser = useCallback(async (email) => {
    setUserMessage(''); // Clear previous messages
    setError('');
    if (!window.confirm(`Are you sure you want to remove user ${email}? This will revoke their access.`)) {
      return;
    }
    try {
      await axios.post(`${BASE_URL}/delete-user`, { email });
      await fetchUsers(); // Refresh user list
      setUserMessage(`Success: User ${email} removed.`);
    } catch (err) {
      setError(`Failed to remove user ${email}. Please try again.`);
      console.error("Remove user error:", err);
    }
  }, [fetchUsers]); // Dependency

  const handleChangeUserRole = useCallback(async (email, newRole) => {
    setUserMessage(''); // Clear previous messages
    setError('');
    // Add confirmation? Optional, maybe less needed than delete.
    // if (!window.confirm(`Change role for ${email} to ${newRole}?`)) return;
    try {
      await axios.post(`${BASE_URL}/update-user`, { email, newRole });
      await fetchUsers(); // Refresh user list
      setUserMessage(`Success: Updated role for ${email} to ${newRole}.`);
    } catch (err) {
      setError(`Failed to update role for ${email}. Please try again.`);
      console.error("Update role error:", err);
    }
  }, [fetchUsers]); // Dependency

  // === UI HELPER CALLBACKS ===
  const requestSort = useCallback((key) => {
    // Prevent sorting by columns that don't make sense (like actions)
    if (key === 'actions') return;

    let direction = 'asc';
    // If clicking the same key, reverse direction
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]); // Dependency

  const handleSignOut = useCallback(() => {
    if (auth && typeof auth.logout === 'function') {
      auth.logout();
    }
    // Use replace to prevent going back to the dashboard after logout
    navigate('/login', { replace: true });
  }, [auth, navigate]); // Dependencies

  const handleMetricClick = useCallback((statusLabel) => {
    const newStatusFilter = statusLabel === 'Total' ? '' : statusLabel;
    setFilterDashboardStatus(newStatusFilter);
    // Reset other filters when clicking a metric card for a clearer view
    setSearchEmail('');
    setFilterCategory('');
    setFilterExpenseType('');
    setSortConfig({ key: null, direction: 'asc' }); // Reset sort
  }, []); // No dependencies needed


  // === MEMOIZED VALUES ===
  const dashboardMetrics = useMemo(() => {
    // Include 'Request Clarification' in metrics
    const counts = { Total: expenses.length, Approved: 0, Pending: 0, Rejected: 0, 'Request Clarification': 0 };
    expenses.forEach(exp => {
      if (exp.status === 'Approved') counts.Approved++;
      else if (exp.status === 'Pending') counts.Pending++;
      else if (exp.status === 'Rejected') counts.Rejected++;
      else if (exp.status === 'Request Clarification') counts['Request Clarification']++;
    });
    return counts;
  }, [expenses]); // Dependency: recalculate if expenses change

  const categories = useMemo(() => [...new Set(expenses.map(e => e.category).filter(Boolean))].sort(), [expenses]);
  const expenseTypes = useMemo(() => [...new Set(expenses.map(e => e.expenseType).filter(Boolean))].sort(), [expenses]);

  // *** displayedExpenses (useMemo) MUST be declared before hooks that depend on it (like handleExportPDF) ***
  const displayedExpenses = useMemo(() => {
    let filtered = expenses.filter(e =>
      (!searchEmail || (e.email && e.email.toLowerCase().includes(searchEmail.toLowerCase()))) &&
      (!filterCategory || e.category === filterCategory) &&
      (!filterExpenseType || e.expenseType === filterExpenseType) &&
      (!filterDashboardStatus || e.status === filterDashboardStatus)
    );

    if (sortConfig.key && view === 'dashboard') {
      const { key, direction } = sortConfig;
      filtered.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        // Handle null/undefined for comparison, especially for amount
        valA = valA ?? (key === 'amount' ? 0 : '');
        valB = valB ?? (key === 'amount' ? 0 : '');

        if (key === 'amount') {
          // Numeric comparison for amount
          return direction === 'asc' ? valA - valB : valB - valA;
        } else {
          // String comparison for other fields
          valA = String(valA).toLowerCase();
          valB = String(valB).toLowerCase();
          if (valA < valB) return direction === 'asc' ? -1 : 1;
          if (valA > valB) return direction === 'asc' ? 1 : -1;
          return 0;
        }
      });
    }
    return filtered;
  }, [expenses, searchEmail, filterCategory, filterExpenseType, filterDashboardStatus, sortConfig, view]); // Dependencies


  // === EXPORT PDF HANDLER (Declared AFTER displayedExpenses) ===
  const handleExportPDF = useCallback(() => {
    if (displayedExpenses.length === 0) {
        alert("No expenses to export!");
        return;
    }
    console.log(`Exporting ${displayedExpenses.length} expenses to PDF...`);
    const doc = new jsPDF();

    // Define columns for the PDF table (exclude 'Actions')
    const pdfColumns = expenseTableColumns
      .filter(col => col.key !== 'actions')
      .map(col => col.label);

    // Prepare rows for the PDF table
    const pdfRows = displayedExpenses.map(exp => // Now displayedExpenses is defined
      expenseTableColumns
        .filter(col => col.key !== 'actions')
        .map(col => {
          const value = exp[col.key];
          // Format specific columns if needed (e.g., amount)
          if (col.key === 'amount') {
            return `$${(typeof value === 'number' ? value : 0).toFixed(2)}`;
          }
          // Handle null/undefined values gracefully
          return String(value ?? 'N/A');
        })
    );

    doc.text('Expense Requests Report', 14, 15); // Title for the PDF
    autoTable(doc, {
      head: [pdfColumns], // Header row
      body: pdfRows,      // Data rows
      startY: 20,         // Position where the table starts
      theme: 'striped',   // Style theme ('striped', 'grid', 'plain')
      headStyles: { fillColor: [0, 86, 179] }, // Example: Blue header
      // Add more styling options as needed
    });

    doc.save('expense-requests-report.pdf'); // File name for download
  }, [displayedExpenses]); // Dependency array includes displayedExpenses


  // === EFFECTS ===
  // Fetch data based on the current view
  useEffect(() => {
    // Reset filters and messages when view changes
    setError('');
    setUserMessage('');
    setSearchEmail('');
    setFilterCategory('');
    setFilterExpenseType('');
    setFilterUserRole('');
    setFilterDashboardStatus('');
    setSortConfig({ key: null, direction: 'asc' });

    if (view === 'dashboard') {
      fetchExpenses();
    } else if (view === 'users') {
      fetchUsers();
    } else if (view === 'analytics') {
        // Fetch expenses if needed for analytics, could reuse dashboard fetch
        if(expenses.length === 0) fetchExpenses();
    } else if (view === 'performance') {
        // Performance pane might fetch its own data or need other setup
    } else if (view === 'policies') {
        // Policies pane is static, no data fetching needed
    }
  }, [view, fetchExpenses, fetchUsers, expenses.length]); // Add expenses.length to dependencies for analytics fetch logic

  // Effect for handling clicks outside profile dropdown (if used)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };

    if (showProfile) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfile]);

  // === RENDER LOGIC ===
  const renderMainContent = () => {
    // Initial loading state check
    if (isLoading && ((view === 'dashboard' && expenses.length === 0) || (view === 'users' && userList.length === 0))) {
      return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>;
    }

    // Error check (show error prominently if main data fails to load)
    if (error && ((view === 'dashboard' && !expenses.length) || (view === 'users' && !userList.length))) {
      return <div className="error" style={{ margin: '2rem auto', textAlign: 'center' }}>{error}</div>;
    }

    // Switch between different panes based on the 'view' state
    switch(view) {
      case 'dashboard':
        return (
          <>
            {/* Metrics Row */}
            <div className="metrics-row">
              {Object.entries(dashboardMetrics).map(([label, count]) => (
                <div key={label}
                  className={`metric-card metric-${label.toLowerCase().replace(/ /g, '-')} ${filterDashboardStatus === label ? 'active-filter' : ''}`}
                  onClick={() => handleMetricClick(label)}
                  role="button" tabIndex={0}
                  onKeyPress={e => (e.key === 'Enter' || e.key === ' ') && handleMetricClick(label)}>
                  <h4>{label}</h4><p>{count}</p>
                </div>
              ))}
            </div>

            {/* Dashboard Table Section */}
            <h2>Expense Requests {filterDashboardStatus ? `(${filterDashboardStatus})` : ''}</h2>
            {error && <div className="error">{error}</div>} {/* Show non-critical errors here */}

            {/* Filters Bar */}
            <div className="filters">
              <input id="expense-search-email" name="expenseSearchEmail" type="text" placeholder="Search by email..." value={searchEmail} onChange={e => setSearchEmail(e.target.value)} />
              <select id="expense-filter-category" name="expenseFilterCategory" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                 <option value="">All Categories</option> {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select id="expense-filter-type" name="expenseFilterType" value={filterExpenseType} onChange={e => setFilterExpenseType(e.target.value)}>
                 <option value="">All Expense Types</option> {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <button onClick={() => { setSearchEmail(''); setFilterCategory(''); setFilterExpenseType(''); setFilterDashboardStatus(''); setSortConfig({ key: null, direction: 'asc' });}} style={{ marginLeft: 'auto' }} disabled={!searchEmail && !filterCategory && !filterExpenseType && !filterDashboardStatus}>Clear Filters</button>
              <button onClick={handleExportPDF} style={{ marginLeft: '1rem', background: 'var(--accent-primary, #0056b3)', color: '#fff', border: 'none', padding: '0.4rem 0.8rem', borderRadius: 'var(--border-radius, 4px)', cursor:'pointer', fontSize:'0.8rem' }} disabled={displayedExpenses.length === 0}>
                  Export PDF
              </button>
            </div>

            {/* Expense Table */}
            <div className="table-wrapper">
              <table className="dynamic-table">
                <thead>
                  <tr>
                    {expenseTableColumns.map(col => (
                      <th key={col.key} onClick={() => requestSort(col.key)} style={{ cursor: col.key === 'actions' || col.key === 'status' ? 'default' : 'pointer' }}>
                        {col.label}
                        {sortConfig.key === col.key ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading && displayedExpenses.length === 0 ? ( // Show loading within table if filtering/sorting
                     <tr><td colSpan={expenseTableColumns.length} style={{textAlign: 'center'}}>Loading Expenses...</td></tr>
                  ) : displayedExpenses.length === 0 ? (
                    <tr><td colSpan={expenseTableColumns.length} style={{textAlign: 'center'}}>No matching expense requests found.</td></tr>
                  ) : (
                    displayedExpenses.map(exp => (
                      <tr key={exp.id}>
                        <td>{exp.id}</td>
                        <td>{exp.email}</td>
                        <td>{exp.expenseType}</td>
                        <td>{exp.category}</td>
                        <td>
                          {/* Status Update Dropdown */}
                          <select
                            className={`status-select ${exp.status?.toLowerCase().replace(/ /g, '-') || 'pending'}`}
                            value={exp.status || 'Pending'}
                            onChange={async e => {
                              const newStatus = e.target.value;
                              const confirmMsg = `You’re about to change the status of request #${exp.id} to "${newStatus}". Continue?`;
                              let comment = '';

                              // Only ask for comment if status is 'Rejected' or 'Request Clarification' (or customize as needed)
                              if (newStatus === 'Rejected' || newStatus === 'Request Clarification') {
                                comment = window.prompt(`Please provide a comment for changing status to "${newStatus}":`) || '';
                                if (newStatus === 'Rejected' && !comment) {
                                   alert("A comment is required when rejecting an expense.");
                                   return; // Prevent update without comment if required
                                }
                                if (newStatus === 'Request Clarification' && !comment) {
                                    alert("A comment specifying the required clarification is mandatory.");
                                    return; // Prevent update without comment if required
                                }
                              } else {
                                // Optional confirmation for other statuses
                                if (!window.confirm(confirmMsg)) return;
                              }

                              await handleUpdateExpense(exp.id, 'status', newStatus, comment);
                            }}>
                            <option value="Pending">Pending</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                            <option value="Request Clarification">Request Clarification</option>
                          </select>
                        </td>
                        <td style={{ textAlign: 'right' }}>{`$${exp.amount.toFixed(2)}`}</td>
                        <td>{exp.name || 'N/A'}</td>
                        <td className="actions">
                          <button className="delete-btn" onClick={() => handleDeleteExpense(exp.id)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        );
      case 'users':
        return (
          <ManageUsersPane
            userList={userList || []}
            filterRole={filterUserRole}
            setFilterRole={setFilterUserRole}
            isLoading={isLoading}
            error={error} // Pass specific errors if needed
            userMessage={userMessage} // Pass success/error messages
            newUserEmail={newUserEmail}
            setNewUserEmail={setNewUserEmail}
            newUserRole={newUserRole}
            setNewUserRole={setNewUserRole}
            isAddingUser={isAddingUser}
            sortConfig={sortConfig}
            searchEmail={searchEmail}
            setSearchEmail={setSearchEmail} // Pass setter for search within the pane
            fetchUsers={fetchUsers} // Allow pane to refresh data
            setError={setError} // Allow pane to set errors (optional)
            setUserMessage={setUserMessage} // Allow pane to set messages
            requestSort={requestSort}
            handleAddUser={handleAddUser}
            handleRemoveUser={handleRemoveUser}
            handleChangeUserRole={handleChangeUserRole}
          />
        );
      case 'analytics':
        // Pass necessary data and loading/error states to AnalyticsPane
        return <AnalyticsPane expenses={expenses} isLoading={isLoading && expenses.length === 0} error={error}/>;
      case 'performance':
         // Pass necessary data and loading/error states to PerformancePane
        return <PerformancePane isLoading={isLoading} error={error} />;
      case 'policies':
         // Policies pane is static, doesn't need props usually
        return <PoliciesPane />;
      default:
        // Fallback for unknown view state
        return <h2>Invalid view selected. Please navigate using the sidebar.</h2>;
    }
  };

  // === AUTHENTICATION CHECK ===
  // Show loading while auth state is resolving
  if (auth === undefined) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Loading Authentication...</div>;
  }
  // Redirect to login if user is not authenticated
  if (!auth.email) {
    return <Navigate to="/login" replace />;
  }
  // Optional: Add check for admin role if needed
  // if (!auth.isAdmin) { // Assuming isAdmin flag exists in auth context
  //   return <Navigate to="/unauthorized" replace />;
  // }

  // === FINAL RETURN STRUCTURE ===
  return (
    <div className="admin-dashboard">
      {/* Sidebar Navigation */}
      <aside className="nav-pane">
        <div className="nav-pane-content">
          <h3>Admin</h3>
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={view === 'users' ? 'active' : ''} onClick={() => setView('users')}>Manage Users</button>
          <button className={view === 'analytics' ? 'active' : ''} onClick={() => setView('analytics')}>Analytics</button>
          <button className={view === 'performance' ? 'active' : ''} onClick={() => setView('performance')}> Performance</button>
          <button className={view === 'policies' ? 'active' : ''} onClick={() => setView('policies')}>Policies</button> {/* Added Policies Button */}
          {/* Sign Out Button at the bottom */}
          <button className="sign-out" onClick={handleSignOut}>Sign Out</button>
        </div>
      </aside>
      {/* Main Content Area */}
      <main className="table-pane">
        {renderMainContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;