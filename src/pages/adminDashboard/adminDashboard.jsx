import React, { useState } from 'react';
import './AdminDashboard.css';

const mockReceipts = [
  {
    id: '2793',
    name: 'Neeraj Pillai',
    email: 'npillai@usf.edu',
    expenseType: 'Travel',
    amount: '$100',
    date: '2025-04-22',
    status: 'Pending'
  },
  {
    id: '2794',
    name: 'DK',
    email: 'dkarmariya@usf.edu',
    expenseType: 'Meal',
    amount: '$75',
    date: '2025-04-21',
    status: 'Approved'
  },
  {
    id: '2795',
    name: 'Ninad',
    email: 'deshinad@usf.edu',
    expenseType: 'Utilities',
    amount: '$200',
    date: '2025-04-20',
    status: 'Rejected'
  }
];

const AdminDashboard = () => {
  const [receipts, setReceipts] = useState(mockReceipts);

  const updateStatus = (id, newStatus) => {
    setReceipts(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h1 className="logo">EERIS</h1>
        <div className="nav-links">
          <div className="nav-item">📁 Upload Receipt</div>
          <div className="nav-item active">👥 Admin Dashboard</div>
        </div>
      </aside>

      <main className="dashboard-content">
        <div className="centered">
          <p className="breadcrumb">Admin › Dashboard</p>
          <h2 className="title">Dashboard</h2>

          <div className="stats-row">
            <div className="stat-card yellow">
              <span className="count">{receipts.filter(r => r.status === 'Pending').length}</span>
              <span className="label">Pending Requests</span>
            </div>
            <div className="stat-card green">
              <span className="count">{receipts.filter(r => r.status === 'Approved').length}</span>
              <span className="label">Approved Requests</span>
            </div>
            <div className="stat-card red">
              <span className="count">{receipts.filter(r => r.status === 'Rejected').length}</span>
              <span className="label">Rejected Requests</span>
            </div>
          </div>

          <div className="table-wrapper">
            <h3 className="section-title">All Requests:</h3>
            <div className="filters">
              <input className="filter-input" placeholder="EmployeeID/ReceiptID" />
              <button className="filter-btn">Filter</button>
            </div>

            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Receipt ID</th>
                  <th>Expense Type</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span className="name">{r.name}</span><br/>
                      <span className="email">{r.email}</span>
                    </td>
                    <td>{r.id}</td>
                    <td>{r.expenseType}</td>
                    <td><span className={`status-tag ${r.status.toLowerCase()}`}>{r.status}</span></td>
                    <td>{r.amount}</td>
                    <td className="action-cell">
                      <button className="action-btn approve-btn" onClick={() => updateStatus(r.id, 'Approved')}>✔</button>
                      <button className="action-btn reject-btn" onClick={() => updateStatus(r.id, 'Rejected')}>✖</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">« <a>‹</a> <span>1</span> <a>›</a> »</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
