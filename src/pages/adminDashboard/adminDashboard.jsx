import React, { useEffect, useState } from 'react';
import axios from 'axios';
//import NavBar from '../NavBar'; // adjust path as needed
import './AdminDashboard.css';

const AdminDashboard = () => {
  // expenses table state
  const [expenses, setExpenses] = useState([]);
  // users lists
  const [users, setUsers] = useState({ employees: [], admins: [] });
  const [loadingUsers, setLoadingUsers] = useState(false);

  // add-user form state
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('employee');
  const [loadingAddUser, setLoadingAddUser] = useState(false);

  // global error message
  const [error, setError] = useState('');

  // on mount: fetch both expenses & users
  useEffect(() => {
    fetchExpenses();
    fetchUsers();
  }, []);

  // fetch pending expenses
  const fetchExpenses = async () => {
    try {
      const { data } = await axios.get(
        'http://localhost:5001/get-expenses'
      );
      setExpenses(data);
    } catch {
      setError('Error fetching expenses.');
    }
  };

  // fetch existing user lists
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const { data } = await axios.get('http://localhost:5001/get-users');
      setUsers(data);
    } catch {
      setError('Error fetching users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  // approve an expense
  const approveExpense = async (id) => {
    try {
      await axios.post('http://localhost:5001/approve-expense', {
        expenseId: id,
      });
      fetchExpenses();
    } catch {
      setError('Error approving expense.');
    }
  };

  // update an expense field
  const updateExpense = async (id, field, value) => {
    try {
      await axios.post('http://localhost:5001/update-expense', {
        expenseId: id,
        field,
        newValue: value,
      });
      fetchExpenses();
    } catch {
      setError('Error updating expense.');
    }
  };

  // add a new user, with client-side validations
  const addUser = async () => {
    setError('');

    const email = newUserEmail.trim().toLowerCase();
    // domain check
    if (!email.endsWith('@usf.edu')) {
      setError('Email must end in @usf.edu.');
      return;
    }
    // existence check
    if (
      users.employees.includes(email) ||
      users.admins.includes(email)
    ) {
      setError('User already exists.');
      return;
    }

    setLoadingAddUser(true);
    try {
      const { data } = await axios.post(
        'http://localhost:5001/add-user',
        { email, role: newUserRole }
      );

      if (data.success) {
        // success!
        alert(`Added ${email} as ${newUserRole}.`);
        // update local users state
        setUsers((u) => ({
          ...u,
          [newUserRole + 's']: [...u[newUserRole + 's'], email],
        }));
        setNewUserEmail('');
      } else {
        // backend said “no”
        setError(data.message || 'Error adding user.');
      }
    } catch (err) {
      // check for a message from backend
      const msg = err.response?.data?.message;
      setError(msg || 'Error adding user.');
    } finally {
      setLoadingAddUser(false);
    }
  };

  return (
    <div className="admin-dashboard-container">
      <NavBar />

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
                disabled={loadingAddUser || loadingUsers}
              />
            </label>

            <label>
              Role
              <select
                className="input-field"
                value={newUserRole}
                onChange={(e) => setNewUserRole(e.target.value)}
                disabled={loadingAddUser || loadingUsers}
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </select>
            </label>

            <button
              className="add-user-btn"
              onClick={addUser}
              disabled={loadingAddUser || loadingUsers}
            >
              {loadingAddUser ? 'Adding…' : 'Add User'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
