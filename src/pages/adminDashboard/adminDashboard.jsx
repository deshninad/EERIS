import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [expenses, setExpenses] = useState([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('employee');
  const [error, setError] = useState('');

  // Load all expenses when the component mounts
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get('http://localhost:5000/get-expenses');
      console.log('Fetched expenses:', response.data);  // Debug log
      setExpenses(response.data);
    } catch (error) {
      setError('Error fetching expenses');
    }
  };

  const approveExpense = async (expenseId) => {
    try {
      await axios.post('http://localhost:5000/approve-expense', { expenseId });
      fetchExpenses(); // Reload data after approval
    } catch (error) {
      setError('Error approving expense');
    }
  };

  const updateExpense = async (expenseId, field, newValue) => {
    try {
      await axios.post('http://localhost:5000/update-expense', { expenseId, field, newValue });
      fetchExpenses(); // Reload after update
    } catch (error) {
      setError('Error updating expense');
    }
  };

  const addUser = async () => {
    try {
      await axios.post('http://localhost:5000/add-user', { email: newUserEmail, role: newUserRole });
      alert(`Added ${newUserEmail} as ${newUserRole}`);
      setNewUserEmail('');
    } catch (error) {
      setError('Error adding user');
    }
  };

  return (
    <div className="admin-dashboard">
      <h2>Admin Dashboard</h2>

      {error && <p className="error">{error}</p>}

      <h3>Pending Expenses</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Employee</th>
            <th>Expense Type</th>
            <th>Category</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Approve</th>
            <th>Edit</th>
          </tr>
        </thead>
        <tbody>
        {expenses.length === 0 ? (
  <tr>
    <td colSpan="8">No expenses available</td>
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
          defaultValue={exp.amount}
          onBlur={(e) => updateExpense(exp.id, 'amount', e.target.value)}
        />
      </td>
      <td>
        {exp.status !== 'Approved' && (
          <button onClick={() => approveExpense(exp.id)}>Approve</button>
        )}
      </td>
    </tr>
  ))
)}

        </tbody>
      </table>

      <h3>Add New User</h3>
      <input
        type="email"
        placeholder="User Email"
        value={newUserEmail}
        onChange={(e) => setNewUserEmail(e.target.value)}
      />
      <select value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)}>
        <option value="employee">Employee</option>
        <option value="admin">Admin</option>
      </select>
      <button onClick={addUser}>Add User</button>
    </div>
  );
};

export default AdminDashboard;
