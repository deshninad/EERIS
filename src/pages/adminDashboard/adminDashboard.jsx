import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [error, setError]       = useState('');

  // Filters & search
  const [searchEmail, setSearchEmail]           = useState('');
  const [filterCategory, setFilterCategory]     = useState('All');
  const [filterType, setFilterType]             = useState('All');

  // Sort state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

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

  // Update a field locally + on server
  const handleUpdate = async (id, field, value) => {
    try {
      await axios.post('http://localhost:5001/update-expense', {
        expenseId: id,
        field,
        newValue: value
      });
      setExpenses((prev) =>
        prev.map((e) => (e.id === id ? { ...e, [field]: value } : e))
      );
    } catch {
      setError('Error saving change.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.post('http://localhost:5001/delete-expense', { expenseId: id });
      setExpenses((prev) => prev.filter((e) => e.id !== id));
    } catch {
      setError('Error deleting.');
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  // Sorting mutates state once
  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    const sorted = [...expenses].sort((a, b) => {
      let va = a[key], vb = b[key];
      if (typeof va === 'string') {
        va = va.toLowerCase(); vb = vb.toLowerCase();
      }
      if (va < vb) return direction === 'asc' ? -1 : 1;
      if (va > vb) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    setExpenses(sorted);
    setSortConfig({ key, direction });
  };

  // Derive lists for filter dropdowns
  const categories = useMemo(
    () => ['All', ...new Set(expenses.map((e) => e.category))],
    [expenses]
  );
  const types = useMemo(
    () => ['All', ...new Set(expenses.map((e) => e.expenseType))],
    [expenses]
  );

  // Apply search & filters on the (possibly sorted) state
  const displayed = useMemo(() => {
    return expenses.filter((e) => {
      const matchEmail = e.email.toLowerCase().includes(searchEmail.toLowerCase());
      const matchCat   = filterCategory === 'All' || e.category === filterCategory;
      const matchType  = filterType === 'All' || e.expenseType === filterType;
      return matchEmail && matchCat && matchType;
    });
  }, [expenses, searchEmail, filterCategory, filterType]);

  return (
    <div className="admin-dashboard">
      <aside className="nav-pane">
        <h3>Admin</h3>
        <button
          className="sign-out"
          onClick={handleSignOut}
        >
          Sign Out
        </button>
      </aside>

      <main className="table-pane">
        <h2>Expense Requests</h2>
        {error && <div className="error">{error}</div>}

        {/* Filters */}
        <div className="filters">
          <input
            type="text"
            placeholder="Search by email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
          />
          <h4>Filter by Category</h4>
<select
  value={filterCategory}
  onChange={e => setFilterCategory(e.target.value)}
>
  <option value="" disabled hidden>
    Select a Category…
  </option>
  {categories.map(c => (
    <option key={c} value={c}>
      {c}
    </option>
  ))}
</select>

<h5>Filter by Type of Expense</h5>
<select
  value={filterType}
  onChange={e => setFilterType(e.target.value)}
>
  <option value="" disabled hidden>
    Select an Expense Type…
  </option>
  {types.map(t => (
    <option key={t} value={t}>
      {t}
    </option>
  ))}
</select>

        </div>

        <table className="dynamic-table">
          <thead>
            <tr>
              {['id','email','expenseType','category','status','amount'].map((col) => (
                <th
                  key={col}
                  onClick={() => requestSort(col)}
                >
                  {col.charAt(0).toUpperCase() + col.slice(1)}
                  {sortConfig.key === col && (sortConfig.direction === 'asc' ? ' ▲' : ' ▼')}
                </th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayed.length === 0 ? (
              <tr><td colSpan="7">No matching records.</td></tr>
            ) : (
              displayed.map((exp) => (
                <tr key={exp.id}>
                  <td>{exp.id}</td>
                  <td>{exp.email}</td>
                  <td>{exp.expenseType}</td>
                  <td>{exp.category}</td>
                  <td>
                    <select
                      className="status-select"
                      value={exp.status}
                      onChange={(e) =>
                        handleUpdate(exp.id, 'status', e.target.value)
                      }
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
                      onBlur={(e) =>
                        handleUpdate(exp.id, 'amount', e.target.value)
                      }
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
      </main>
    </div>
  );
};

export default AdminDashboard;
