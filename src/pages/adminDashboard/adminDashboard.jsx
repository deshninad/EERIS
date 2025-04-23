import React, { useEffect, useState } from 'react';
import axios from 'axios';
//import NavBar from '../NavBar'; // adjust path if needed
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('employee');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const { data } = await axios.get('http://localhost:5000/get-expenses');
      setExpenses(data);
    } catch {
      setError('Error fetching expenses.');
    }
  };

  const approveExpense = async (id) => {
    try {
      await axios.post('http://localhost:5000/approve-expense', { expenseId: id });
      fetchExpenses();
    } catch {
      setError('Error approving expense.');
    }
  };

  const updateExpense = async (id, field, value) => {
    try {
      await axios.post('http://localhost:5000/update-expense', { expenseId: id, field, newValue: value });
      fetchExpenses();
    } catch {
      setError('Error updating expense.');
    }
  };

  const addUser = async () => {
    if (!newUserEmail) {
      setError('Please enter an email.');
      return;
    }
    try {
      await axios.post('http://localhost:5000/add-user', {
        email: newUserEmail,
        role: newUserRole,
      });
      alert(`Added ${newUserEmail} as ${newUserRole}`);
      setNewUserEmail('');
      setError('');
    } catch {
      setError('Error adding user.');
    }
  };

  return (
    <div className="admin-dashboard-container">
      {/* <NavBar /> */}

      <h2 className="admin-title">Admin Dashboard</h2>
      {error && <p className="error-message">{error}</p>}

      <div className="dashboard-content">
        {/* LEFT: Pending Expenses */}
        <div className="dashboard-card expenses-card">
          <h3>Pending Expenses</h3>
          <table className="expenses-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Employee</th>
                <th>Type</th>
                <th>Category</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Approve</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="7">No expenses available</td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp.id}>
                    <td>{exp.id}</td>
                    <td>{exp.email}</td>
                    <td>{exp.expenseType}</td>
                    <td>{exp.category}</td>
                    <td>{exp.status}</td>
                    <td>
                      <input
                        type="number"
                        className="amount-input"
                        defaultValue={exp.amount}
                        onBlur={(e) =>
                          updateExpense(exp.id, 'amount', e.target.value)
                        }
                      />
                    </td>
                    <td>
                      {exp.status !== 'Approved' && (
                        <button
                          className="approve-btn"
                          onClick={() => approveExpense(exp.id)}
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* RIGHT: Add New User */}
        <div className="dashboard-card add-user-card">
          <h3>Add New User</h3>
          <div className="add-user-form">
            <label>
              Email
              <input
                type="email"
                className="input-field"
                placeholder="User Email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
              />
            </label>
            <label>
              Role
              <select
                className="input-field"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button className="add-user-btn" onClick={addUser}>
              Add User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
