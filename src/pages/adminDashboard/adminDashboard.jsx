import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../AuthProvider.jsx';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const { email, logout } = useAuth();
  const navigate = useNavigate();

  // which pane to show: 'expenses' or 'users'
  const [view, setView] = useState('expenses');

  // expenses state
  const [expenses, setExpenses] = useState([]);
  const [expenseError, setExpenseError] = useState('');

  // manage-users state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('employee');
  const [addingUser, setAddingUser] = useState(false);
  const [userMessage, setUserMessage] = useState(''); // success or error

  // load expenses once
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setExpenseError('');
    try {
      const { data } = await axios.get('http://localhost:5001/get-expenses');
      setExpenses(data);
    } catch {
      setExpenseError('Failed to load expenses.');
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.post('http://localhost:5001/approve-expense', { expenseId: id });
      fetchExpenses();
    } catch {
      setExpenseError('Error approving.');
    }
  };

  const handleChange = async (id, field, value) => {
    try {
      await axios.post('http://localhost:5001/update-expense', {
        expenseId: id, field, newValue: value
      });
      fetchExpenses();
    } catch {
      setExpenseError('Error saving change.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.post('http://localhost:5001/delete-expense', { expenseId: id });
      fetchExpenses();
    } catch {
      setExpenseError('Error deleting.');
    }
  };

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const handleAddUser = async () => {
    setUserMessage('');
    const emailTrim = newUserEmail.trim().toLowerCase();
    if (!emailTrim.endsWith('@usf.edu')) {
      setUserMessage('Error: Email must end in @usf.edu.');
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

  return (
    <div className="admin-dashboard">
      {/* LEFT NAV PANE */}
      <aside className="nav-pane">
        <h3>Admin</h3>
        <button
          className={view === 'expenses' ? 'active' : ''}
          onClick={() => setView('expenses')}
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

      {/* RIGHT MAIN PANE */}
      <main className="table-pane">
        {view === 'expenses' ? (
          <>
            <h2>Pending Expenses</h2>
            {expenseError && <div className="error">{expenseError}</div>}
            <table className="dynamic-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>User</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length === 0 ? (
                  <tr>
                    <td colSpan="7">No pending expenses.</td>
                  </tr>
                ) : (
                  expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td>{exp.id}</td>
                      <td>{exp.email}</td>
                      <td>{exp.expenseType}</td>
                      <td>{exp.category}</td>
                      <td className={exp.status.toLowerCase()}>
                        {exp.status}
                      </td>
                      <td>
                        <input
                          type="number"
                          defaultValue={exp.amount}
                          onBlur={(e) =>
                            handleChange(exp.id, 'amount', e.target.value)
                          }
                        />
                      </td>
                      <td className="actions">
                        {exp.status !== 'Approved' && (
                          <button onClick={() => handleApprove(exp.id)}>
                            Approve
                          </button>
                        )}
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
                  className="input-field"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  placeholder="user@usf.edu"
                  disabled={addingUser}
                />
              </label>
              <label>
                Role:
                <select
                  className="input-field"
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  disabled={addingUser}
                >
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
            {userMessage && <p className="user-message">{userMessage}</p>}
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
