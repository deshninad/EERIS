import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import Link from react-router-dom for navigation
import "./eSummaryPage.css";
import data from "../../data/data.json"; // Import the JSON file (or fetch it later from an API)
import { useAuth } from "../../AuthProvider"; // Import the AuthContext to access the logged-in user's email

const Dashboard = () => {
  const [requestsData, setRequestsData] = useState([]);
  const { email, logout } = useAuth(); // Access the logged-in user's email and logout function
  const navigate = useNavigate();

  // Filter the data based on the logged-in user's email
  useEffect(() => {
    if (email) {
      const userRequests = data.find((entry) => entry.email === email);
      if (userRequests) {
        setRequestsData(userRequests.requests);
      }
    }
  }, [email]);

  // Handle request deletion
  const handleDeleteRequest = (receiptId) => {
    const updatedRequests = requestsData.filter((request) => request.receiptId !== receiptId);
    setRequestsData(updatedRequests);
    // Optionally, update the data on the server if you want to persist changes
  };

  return (
    <div className="dashboard-container">
        {/* Navigation Bar */}
      <nav className="navbar">
        <h2>EERIS</h2>
        <div className="nav-links">
          <button onClick={() => navigate("/upload")}>Upload Page</button>
          <button onClick={() => navigate("/login")}>Sign Out</button>
        </div>
      </nav>
      <h2>eSummary Page</h2>
    

      <table className="requests-table">
        <thead>
          <tr>
            <th>Receipt ID</th>
            <th>Expense Type</th>
            <th>Category</th>
            <th>Status</th>
            <th>Amount</th>
            <th>Name</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {requestsData.length === 0 ? (
            <tr>
              <td colSpan="7">No requests available.</td>
            </tr>
          ) : (
            requestsData.map((request, index) => (
              <tr key={index}>
                <td>{request.receiptId}</td>
                <td>{request.expenseType}</td>
                <td>{request.category}</td>
                <td>{request.status}</td>
                <td>${request.amount.toFixed(2)}</td>
                <td>{request.name}</td>
                <td>
                  <button onClick={() => handleDeleteRequest(request.receiptId)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Dashboard;
