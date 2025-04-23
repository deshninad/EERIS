import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // which view: 'dashboard' or 'users'
  const [view, setView] = useState('dashboard');

  // expenses state + errors
  const [expenses, setExpenses] = useState([]);
  const [error, setError]       = useState('');

  // filters & search
  const [searchEmail, setSearchEmail]       = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType]         = useState('');

  // sorting (mutates state once)
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // manage-users state
  const [newUserEmail, setNewUserEmail]   = useState('');
  const [newUserRole, setNewUserRole]     = useState('');
  const [addingUser, setAddingUser]       = useState(false);
  const [userMessage, setUserMessage]     = useState('');

  // load expenses
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setError('');
    try {
      const { data } = await axios.get('http://localhost:5001/get-expenses');
      setExpenses(data);
    } catch {
      setError('Failed to load expenses.');
    }
  };

  // update numeric or status field
  const handleUpdate = async (id, field, value) => {
    try {
      await axios.post('http://localhost:5001/update-expense', {
        expenseId: id,
        field,
        newValue: value
      });
      setExpenses(prev =>
        prev.map(e => (e.id === id ? { ...e, [field]: value } : e))
      );
    } catch {
      setError('Error saving change.');
    }
  };

  // delete expense
  const handleDelete = async (id) => {
    try {
      await axios.post('http://localhost:5001/delete-expense', { expenseId: id });
      setExpenses(prev => prev.filter(e => e.id !== id));
    } catch {
      setError('Error deleting.');
    }
  };

  // sort once on header click
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const sorted = [...expenses].sort((a, b) => {
      let va = a[key], vb = b[key];
      if (typeof va === 'string') {
        va = va.toLowerCase();
        vb = vb.toLowerCase();
      }
      if (va < vb) return direction === 'asc' ? -1 : 1;
      if (va > vb) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setExpenses(sorted);
    setSortConfig({ key, direction });
  };

  // derive filter lists
  const categories = useMemo(
    () => Array.from(new Set(expenses.map(e => e.category))),
    [expenses]
  );
  const types = useMemo(
    () => Array.from(new Set(expenses.map(e => e.expenseType))),
    [expenses]
  );

  // apply search & filters
  const displayed = useMemo(() => {
    return expenses.filter(e => {
      const matchEmail = e.email.toLowerCase().includes(searchEmail.toLowerCase());
      const matchCat   = !filterCategory || e.category === filterCategory;
      const matchType  = !filterType   || e.expenseType === filterType;
      return matchEmail && matchCat && matchType;
    });
  }, [expenses, searchEmail, filterCategory, filterType]);

  // add user handler
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
      const res = await axios.post('http://localhost:5001/add-user', {
        email: emailTrim,
        role: newUserRole
      });
      if (res.data.success) {
        setUserMessage(`Success: ${emailTrim} added as ${newUserRole}.`);
        setNewUserEmail('');
        setNewUserRole('');
      } else {
        setUserMessage(`Error: ${res.data.message || 'Could not add user.'}`);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Error adding user.';
      setUserMessage(`Error: ${msg}`);
    } finally {
      setAddingUser(false);
    }
  };

  // sign out
  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-dashboard">
      <aside className="nav-pane">
        <h3>Admin</h3>
        <button
          className={view === 'dashboard' ? 'active' : ''}
          onClick={() => setView('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={view === 'users' ? 'active' : ''}
          onClick={() => setView('users')}
        >
          Manage Users
        </button>
        <button className="sign-out" onClick={handleSignOut}>
          Sign Out
        </button>
      </aside>

      <main className="table-pane">
        {view === 'dashboard' ? (
          <>
            <h2>Expense Requests</h2>
            {error && <div className="error">{error}</div>}

            <div className="filters">
              <input
                type="text"
                placeholder="Search by email"
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
              />

              <select
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="" disabled hidden>
                  Select a Category…
                </option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
              >
                <option value="" disabled hidden>
                  Select an Expense Type…
                </option>
                {types.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <table className="dynamic-table">
              <thead>
                <tr>
                  {['id','email','expenseType','category','status','amount'].map(col => (
                    <th key={col} onClick={() => requestSort(col)}>
                      {col.charAt(0).toUpperCase() + col.slice(1)}
                      {sortConfig.key === col && 
                        (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                    </th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayed.length === 0 ? (
                  <tr>
                    <td colSpan="7">No matching records.</td>
                  </tr>
                ) : (
                  displayed.map(exp => (
                    <tr key={exp.id}>
                      <td>{exp.id}</td>
                      <td>{exp.email}</td>
                      <td>{exp.expenseType}</td>
                      <td>{exp.category}</td>
                      <td>
                      <select
                        className={`status-select ${exp.status.toLowerCase()}`}
                        value={exp.status}
                        onChange={e => handleUpdate(exp.id, 'status', e.target.value)}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Approved">Approved</option>
                        <option value="Rejected">Rejected</option>
                      </select>

                      </td>
                      <td>
                        <input
                          type="number"
                          defaultValue={exp.amount}
                          onBlur={e => handleUpdate(exp.id, 'amount', e.target.value)}
                        />
                      </td>
                      <td className="actions">
                        <button onClick={() => handleDelete(exp.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <h2>Manage Users</h2>
            <div className="add-user-form">
              <label>
                Email:
                <input
                  type="email"
                  placeholder="user@usf.edu"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  disabled={addingUser}
                />
              </label>
              <label>
                Role:
                <select
                  value={newUserRole}
                  onChange={e => setNewUserRole(e.target.value)}
                  disabled={addingUser}
                >
                  <option value="" disabled hidden>
                    Select a Role…
                  </option>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <button
                className="add-user-btn"
                onClick={handleAddUser}
                disabled={addingUser}
              >
                {addingUser ? 'Adding…' : 'Add User'}
              </button>
            </div>
            {userMessage && (
              <p className={`user-message ${userMessage.startsWith('Error') ? 'error' : 'success'}`}>
                {userMessage}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
