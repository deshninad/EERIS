import React, { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import './eSummaryPage.css';
import data from '../../data/DATA.json';
import { useAuth } from '../../AuthProvider.jsx';

const ESummaryPage = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [error, setError]       = useState('');

  // redirect if not logged in
  if (!auth || !auth.email) {
    return <Navigate to="/login" replace />;
  }
  const { email, logout } = auth;

  // load this user's requests
  useEffect(() => {
    const entry = data.find((e) => e.email === email);
    setRequests(entry ? entry.requests : []);
  }, [email]);

  // delete locally
  const handleDelete = (id) =>
    setRequests((r) => r.filter((req) => req.receiptId !== id));

  // summary numbers
  const total    = requests.length;
  const approved = requests.filter((r) => r.status === 'Approved').length;
  const pending  = total - approved;

  return (
    <div className="dashboard-container">
      {/* NAV */}
      <nav className="navbar">
        <h2 className="navbar-logo">EERIS</h2>
        <div className="nav-links">
          <button className="nav-btn" onClick={() => navigate('/upload')}>
            Upload
          </button>
          <button
            className="nav-btn"
            onClick={() => {
              logout();
              navigate('/login');
            }}
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        {/* METRICS */}
        <div className="metrics-row">
          <div className="metric-card total">
            <h4>Total Requests</h4>
            <p>{total}</p>
          </div>
          <div className="metric-card approved">
            <h4>Approved</h4>
            <p>{approved}</p>
          </div>
          <div className="metric-card pending">
            <h4>Pending</h4>
            <p>{pending}</p>
          </div>
        </div>

        {/* REQUESTS TABLE */}
        <div className="requests-card">
          <h3>My Expense Requests</h3>
          {error && <p className="error-message">{error}</p>}
          <table className="requests-table">
            <thead>
              <tr>
                <th>Receipt ID</th>
                <th>Type</th>
                <th>Category</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Name</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="7">No requests available.</td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.receiptId}>
                    <td>{req.receiptId}</td>
                    <td>{req.expenseType}</td>
                    <td>{req.category}</td>
                    <td>{req.status}</td>
                    <td>${req.amount.toFixed(2)}</td>
                    <td>{req.name}</td>
                    <td>
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(req.receiptId)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ESummaryPage;
