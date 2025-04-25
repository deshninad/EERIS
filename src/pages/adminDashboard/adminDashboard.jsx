// src/pages/AdminDashboard/AdminDashboard.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx';
import AnalyticsPane from '../components/AnalyticsPane.jsx';
import ManageUsersPane from '../components/ManageUsersPane.jsx';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useState('dashboard');
  const [expenses, setExpenses] = useState([]);
  const [error, setError] = useState('');

  const [searchEmail, setSearchEmail] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const [userList, setUserList] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('');
  const [addingUser, setAddingUser] = useState(false);
  const [userMessage, setUserMessage] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, []);

  useEffect(() => {
    if (view === 'users') fetchUsers();
  }, [view]);

  const fetchExpenses = async () => {
    setError('');
    try {
      const { data } = await axios.get('http://localhost:5001/get-expenses');
      setExpenses(data);
    } catch {
      setError('Failed to load expenses.');
    }
  };

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get('http://localhost:5001/get-users');
      const employees = data.employees.map(email => ({ email, role: 'employee' }));
      const admins = data.admins.map(email => ({ email, role: 'admin' }));
      setUserList([...employees, ...admins]);
    } catch {
      console.error('Failed to load users.');
    }
  };

  const handleUpdateExpense = async (id, field, value) => {
    try {
      await axios.post('http://localhost:5001/update-expense', { expenseId: id, field, newValue: value });
      setExpenses(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
    } catch {
      setError('Error saving change.');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await axios.post('http://localhost:5001/delete-expense', { expenseId: id });
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch {
      setError('Error deleting.');
    }
  };

  const requestSort = (key) => {
    const direction = (sortConfig.key === key && sortConfig.direction === 'asc') ? 'desc' : 'asc';
    setSortConfig({ key, direction });
  };

  const categories = useMemo(() => [...new Set(expenses.map(e => e.category))], [expenses]);
  const types = useMemo(() => [...new Set(expenses.map(e => e.expenseType))], [expenses]);

  const displayed = useMemo(() => {
    return expenses.filter(e => {
      const matchEmail = e.email.toLowerCase().includes(searchEmail.toLowerCase());
      const matchCat = !filterCategory || e.category === filterCategory;
      const matchType = !filterType || e.expenseType === filterType;
      return matchEmail && matchCat && matchType;
    });
  }, [expenses, searchEmail, filterCategory, filterType]);

  const sortedUsers = useMemo(() => {
    let filtered = userList.filter(user =>
      user.email.toLowerCase().includes(searchEmail.toLowerCase()) &&
      (!filterType || user.role === filterType)
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const valA = a[sortConfig.key].toLowerCase();
        const valB = b[sortConfig.key].toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [userList, searchEmail, filterType, sortConfig]);

  const handleChangeUserRole = async (email, newRole) => {
    await axios.post('http://localhost:5001/update-user', { email, newRole });
    fetchUsers();
  };

  const handleRemoveUser = async (email) => {
    if (window.confirm(`Remove ${email}?`)) {
      await axios.post('http://localhost:5001/delete-user', { email });
      fetchUsers();
    }
  };

  const handleAddUser = async () => {
    setUserMessage('');
    const emailTrim = newUserEmail.trim().toLowerCase();
    if (!emailTrim.endsWith('@usf.edu')) {
      setUserMessage('Error: Email must end in @usf.edu.');
      return;
    }
    if (!newUserRole) {
      setUserMessage('Error: Please select a role.');
      return;
    }
    setAddingUser(true);
    try {
      const res = await axios.post('http://localhost:5001/add-user', { email: emailTrim, role: newUserRole });
      if (res.data.success) {
        setUserMessage(`Success: ${emailTrim} added as ${newUserRole}.`);
        setNewUserEmail('');
        setNewUserRole('');
        fetchUsers();
      } else {
        setUserMessage(`Error: ${res.data.message}`);
      }
    } catch (err) {
      setUserMessage(`Error: ${err.response?.data?.message || 'Something went wrong.'}`);
    } finally {
      setAddingUser(false);
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <aside className="nav-pane">
        <div className="nav-pane-content">
          <h3>Admin</h3>
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>Dashboard</button>
          <button className={view === 'users' ? 'active' : ''} onClick={() => setView('users')}>Manage Users</button>
          <button className={view === 'analytics' ? 'active' : ''} onClick={() => setView('analytics')}>Analytics</button>
          <button className="sign-out" onClick={handleSignOut}>Sign Out</button>
        </div>
      </aside>
      {/* CENTER PANE */}
      <main className="table-pane">
        {/* DASHBOARD VIEW */}
        {view==='dashboard' && (
          <>
            <h2>Expense Requests</h2>
            {error && <div className="error">{error}</div>}

            <div className="filters">
              <input
                type="text"
                placeholder="Search by email"
                value={searchEmail}
                onChange={e=>setSearchEmail(e.target.value)}
              />
              <select value={filterCategory} onChange={e=>setFilterCategory(e.target.value)}>
                <option value="" disabled hidden>Select a Category…</option>
                {categories.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterType} onChange={e=>setFilterType(e.target.value)}>
                <option value="" disabled hidden>Select an Expense Type…</option>
                {types.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="table-wrapper">
              <table className="dynamic-table">
                <thead>
                  <tr>
                    {['id','email','expenseType','category','status','amount'].map(col=>(
                      <th key={col} onClick={()=>requestSort(col)}>
                        {col.charAt(0).toUpperCase()+col.slice(1)}
                        {sortConfig.key===col ? (sortConfig.direction==='asc'?' ▲':' ▼') : ''}
                      </th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.length===0
                    ? <tr><td colSpan="7">No matching records.</td></tr>
                    : displayed.map(exp=>(
                      <tr key={exp.id}>
                        <td>{exp.id}</td>
                        <td>{exp.email}</td>
                        <td>{exp.expenseType}</td>
                        <td>{exp.category}</td>
                        <td>
                          <select
                            className={`status-select ${exp.status.toLowerCase()}`}
                            value={exp.status}
                            onChange={e=>handleUpdateExpense(exp.id,'status',e.target.value)}
                          >
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                          </select>
                        </td>
                        <td>
                          <input
                            type="number"
                            defaultValue={exp.amount}
                            onBlur={e=>handleUpdateExpense(exp.id,'amount',e.target.value)}
                          />
                        </td>
                        <td className="actions">
                          <button onClick={()=>handleDeleteExpense(exp.id)}>Delete</button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </>
        )}
        </main>

      <main className="table-pane">
        {view === 'dashboard' && (
          <>
            <h2>Expense Requests</h2>
            {error && <div className="error">{error}</div>}
            {/* dashboard filters & table */}
          </>
        )}

        {view === 'users' && (
          <ManageUsersPane
            sortedUsers={sortedUsers}
            newUserEmail={newUserEmail}
            newUserRole={newUserRole}
            addingUser={addingUser}
            userMessage={userMessage}
            setNewUserEmail={setNewUserEmail}
            setNewUserRole={setNewUserRole}
            handleAddUser={handleAddUser}
            handleRemoveUser={handleRemoveUser}
            handleChangeUserRole={handleChangeUserRole}
            requestSort={requestSort}
            sortConfig={sortConfig}
          />
        )}

        {view === 'analytics' && <AnalyticsPane expenses={expenses} />}
      </main>
    </div>
  );
};

export default AdminDashboard;