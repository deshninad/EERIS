// src/pages/AdminDashboard/AdminDashboard.jsx
// Updated to add "Request Clarification" status with comment prompt

import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx';
import AnalyticsPane   from '../components/AnalyticsPane.jsx';
import ManageUsersPane from '../components/ManageUsersPane.jsx';
import './AdminDashboard.css';

const BASE_URL = 'http://localhost:5001';

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
  const auth = useAuth();
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const [view, setView] = useState('dashboard');
  const [expenses, setExpenses] = useState([]);
  const [userList, setUserList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
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

      // mark true admins in a Set
      const adminSet = new Set(admins);
      // union of both arrays, no duplicates
      const allEmails = Array.from(new Set([...employees, ...admins]));
      // assign role based on presence in adminSet
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


  // Updated: include comment parameter
  const handleUpdateExpense = useCallback(
    async (id, field, value, comment = '') => {
      setError('');
      const original = JSON.parse(JSON.stringify(expenses));
      const parsed = field === 'amount' ? parseFloat(value) || 0 : value;
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, [field]: parsed } : e));
      try {
        await axios.post(`${BASE_URL}/update-expense`, {
          expenseId: id,
          field,
          newValue: parsed,
          comment,
        });
      } catch (err) {
        console.error('Error updating status:', err);
        setError('Error updating status. Reverting.');
        setExpenses(original);
      }
    },
    [expenses]
  );

  const handleDeleteExpense = useCallback(async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    setError('');
    const original = [...expenses];
    setExpenses(prev => prev.filter(e => e.id !== id));
    try {
      await axios.post(`${BASE_URL}/delete-expense`, { expenseId: id });
    } catch (err) {
      console.error('Error deleting expense:', err);
      setError('Error deleting expense.');
      setExpenses(original);
    }
  }, [expenses]);

  const requestSort = useCallback((key) => {
    if (key === 'actions') return;
    let dir = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') dir = 'desc';
    setSortConfig({ key, direction: dir });
  }, [sortConfig]);

  // Other user handlers unchanged...

  const dashboardMetrics = useMemo(() => {
    const counts = { Total: expenses.length, Approved: 0, Pending: 0, Rejected: 0, 'Request Clarification': 0 };
    expenses.forEach(e => {
      if (e.status === 'Approved') counts.Approved++;
      else if (e.status === 'Pending') counts.Pending++;
      else if (e.status === 'Rejected') counts.Rejected++;
      else if (e.status === 'Request Clarification') counts['Request Clarification']++;
    });
    return counts;
  }, [expenses]);

  const handleMetricClick = useCallback((label) => {
    const status = label === 'Total' ? '' : label;
    setFilterDashboardStatus(status);
    setSearchEmail(''); setFilterCategory(''); setFilterExpenseType('');
    setSortConfig({ key: null, direction: 'asc' });
  }, []);

  const categories = useMemo(() => [...new Set(expenses.map(e => e.category))].sort(), [expenses]);
  const expenseTypes = useMemo(() => [...new Set(expenses.map(e => e.expenseType))].sort(), [expenses]);

  const displayedExpenses = useMemo(() => {
    let filtered = expenses.filter(e =>
      (!searchEmail || e.email.toLowerCase().includes(searchEmail.toLowerCase())) &&
      (!filterCategory || e.category === filterCategory) &&
      (!filterExpenseType || e.expenseType === filterExpenseType) &&
      (!filterDashboardStatus || e.status === filterDashboardStatus)
    );
    if (sortConfig.key && view === 'dashboard') {
      const { key, direction } = sortConfig;
      filtered.sort((a, b) => {
        let va = a[key] ?? (key === 'amount' ? 0 : '');
        let vb = b[key] ?? (key === 'amount' ? 0 : '');
        if (key === 'amount') return direction === 'asc' ? va - vb : vb - va;
        va = String(va).toLowerCase(); vb = String(vb).toLowerCase();
        if (va < vb) return direction === 'asc' ? -1 : 1;
        if (va > vb) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }, [expenses, searchEmail, filterCategory, filterExpenseType, filterDashboardStatus, sortConfig, view]);

  useEffect(() => {
    setError(''); setUserMessage(''); setSearchEmail('');
    setFilterCategory(''); setFilterExpenseType(''); setFilterUserRole(''); setFilterDashboardStatus('');
    setSortConfig({ key: null, direction: 'asc' });
    if (view === 'dashboard') fetchExpenses();
    else if (view === 'users') fetchUsers();
  }, [view, fetchExpenses, fetchUsers]);

  useEffect(() => {
    const outside = event => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfile(false);
      }
    };
    if (showProfile) document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [showProfile]);

    // === USER MANAGEMENT HANDLERS ===
    const handleAddUser = useCallback(async () => {
      setUserMessage('');
      setError('');
      const emailTrim = newUserEmail.trim().toLowerCase();
      if (!emailTrim.includes('@') || !newUserRole) {
        setUserMessage('Error: Invalid email or role.');
        return;
      }
      setIsAddingUser(true);
      try {
        const res = await axios.post(`${BASE_URL}/add-user`, {
          email: emailTrim,
          role: newUserRole
        });
        if (res.data.success) {
          setUserMessage(`Success: ${emailTrim} added.`);
          setNewUserEmail('');
          setNewUserRole('');
          await fetchUsers();
        } else {
          setUserMessage(`Error: ${res.data.message || 'Could not add user.'}`);
        }
      } catch (err) {
        setUserMessage(`Error: ${err.response?.data?.message || 'An unexpected error occurred.'}`);
      } finally {
        setIsAddingUser(false);
      }
    }, [newUserEmail, newUserRole, fetchUsers]);
  
    const handleRemoveUser = useCallback(async (email) => {
      setUserMessage('');
      setError('');
      if (!window.confirm(`Remove user ${email}?`)) return;
      try {
        await axios.post(`${BASE_URL}/delete-user`, { email });
        await fetchUsers();
        setUserMessage(`Removed user ${email}.`);
      } catch (err) {
        setError(`Failed to remove user ${email}.`);
      }
    }, [fetchUsers]);
  
    const handleChangeUserRole = useCallback(async (email, newRole) => {
      setUserMessage('');
      setError('');
      try {
        await axios.post(`${BASE_URL}/update-user`, { email, newRole });
        await fetchUsers();
        setUserMessage(`Updated role for ${email}.`);
      } catch (err) {
        setError(`Failed to update role for ${email}.`);
      }
    }, [fetchUsers]);
  
      // … after your other useState/useCallback hooks …
  const handleSignOut = useCallback(() => {
    if (auth && typeof auth.logout === 'function') {
      auth.logout();
    }
    navigate('/login', { replace: true });
  }, [auth, navigate]);

  const renderMainContent = () => {
    if (isLoading) return <div>Loading...</div>;
    if (error && ((view==='dashboard' && !expenses.length) || (view==='users' && !userList.length))) {
      return <div className="error" style={{margin:'2rem auto', textAlign:'center'}}>{error}</div>;
    }

    

    switch(view) {
      case 'dashboard':
        return (
          <>
            <div className="metrics-row">
              {Object.entries(dashboardMetrics).map(([label,count]) => (
                <div key={label}
                  className={`metric-card metric-${label.toLowerCase().replace(/ /g,'-')} ${filterDashboardStatus===label?'active-filter':''}`}
                  onClick={()=>handleMetricClick(label)}
                  role="button" tabIndex={0}
                  onKeyPress={e=>(e.key==='Enter'||e.key===' ')&&handleMetricClick(label)}>
                  <h4>{label}</h4><p>{count}</p>
                </div>
              ))}
            </div>
            <h2>Expense Requests {filterDashboardStatus?`(${filterDashboardStatus})`:''}</h2>
            {error && <div className="error">{error}</div>}
            <div className="filters"><input id="expense-search-email" name="expenseSearchEmail" type="text" placeholder="Search by email..." value={searchEmail} onChange={e => setSearchEmail(e.target.value)} /><select id="expense-filter-category" name="expenseFilterCategory" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}> <option value="">All Categories</option> {categories.map(c => <option key={c} value={c}>{c}</option>)} </select><select id="expense-filter-type" name="expenseFilterType" value={filterExpenseType} onChange={e => setFilterExpenseType(e.target.value)}> <option value="">All Expense Types</option> {expenseTypes.map(t => <option key={t} value={t}>{t}</option>)} </select><button onClick={() => { setSearchEmail(''); setFilterCategory(''); setFilterExpenseType(''); setFilterDashboardStatus('');}} style={{ marginLeft: 'auto' }} disabled={!searchEmail && !filterCategory && !filterExpenseType && !filterDashboardStatus}>Clear All Filters</button></div>
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
                  {displayedExpenses.length===0 ? (
                    <tr><td colSpan={expenseTableColumns.length}>No matching expense requests found.</td></tr>
                  ) : displayedExpenses.map(exp => (
                    <tr key={exp.id}>
                      <td>{exp.id}</td>
                      <td>{exp.email}</td>
                      <td>{exp.expenseType}</td>
                      <td>{exp.category}</td>
                      <td>
                        <select
                          className={`status-select ${exp.status?.toLowerCase().replace(/ /g,'-')||'pending'}`}
                          value={exp.status||'Pending'}
                          onChange={async e => {
                            const newStatus = e.target.value;
                            const confirmMsg = `You\u2019re about to change status of request #${exp.id} to \"${newStatus}\".`;
                            if (!window.confirm(confirmMsg)) return;
                            const comment = window.prompt('Add a comment (optional):')||'';
                            await handleUpdateExpense(exp.id, 'status', newStatus, comment);
                          }}>
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Rejected">Rejected</option>
                          <option value="Request Clarification">Request Clarification</option>
                        </select>
                      </td>
                      <td style={{textAlign:'right'}}>{`$${exp.amount.toFixed(2)}`}</td>
                      <td>{exp.name||'N/A'}</td>
                      <td className="actions">
                        <button className="delete-btn" onClick={()=>handleDeleteExpense(exp.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      case 'users': return ( <ManageUsersPane userList={userList || []} /* ... other props ... */ filterRole={filterUserRole} setFilterRole={setFilterUserRole} isLoading={isLoading} error={error} userMessage={userMessage} newUserEmail={newUserEmail} newUserRole={newUserRole} isAddingUser={isAddingUser} sortConfig={sortConfig} searchEmail={searchEmail} fetchUsers={fetchUsers} setError={setError} setUserMessage={setUserMessage} setNewUserEmail={setNewUserEmail} setNewUserRole={setNewUserRole} requestSort={requestSort} handleAddUser={handleAddUser} handleRemoveUser={handleRemoveUser} handleChangeUserRole={handleChangeUserRole} setSearchEmail={setSearchEmail} /> );
      case 'analytics':
        return <AnalyticsPane expenses={expenses} isLoading={isLoading} error={error}/>;
      default:
        return <h2>Invalid view selected.</h2>;
    }
  };

  if (auth===undefined) return <div>Loading Authentication...</div>;
  if (!auth.email) return <Navigate to="/login" replace />;

  return (
    <div className="admin-dashboard">
      <aside className="nav-pane">
        <div className="nav-pane-content">
          <h3>Admin</h3>
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={view === 'users' ? 'active' : ''} onClick={() => setView('users')}>Manage Users</button>
          <button className={view === 'analytics' ? 'active' : ''} onClick={() => setView('analytics')}>Analytics</button>
          { <button className="sign-out" onClick={handleSignOut}>Sign Out</button> }
        </div>
      </aside>
      <main className="table-pane">
        {renderMainContent()}
      </main>
    </div>
  );
};

export default AdminDashboard;
