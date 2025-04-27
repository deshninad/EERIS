// src/pages/components/ManageUsersPane.jsx
import React, { useMemo } from 'react';

const ManageUsersPane = ({
  // Props from AdminDashboard
  userList, filterRole, setFilterRole, searchEmail, setSearchEmail,
  sortConfig, requestSort, isLoading, error, userMessage,
  newUserEmail, setNewUserEmail, newUserRole, setNewUserRole,
  addingUser, handleAddUser, handleRemoveUser, handleChangeUserRole,
  setUserMessage, // Allow setting messages from here if needed
  setError      // Allow setting errors from here if needed
}) => {

  // Local Filtering & Sorting based on props from parent
  const displayedUsers = useMemo(() => {
      let filtered = (userList || []).filter(user => // Ensure userList is array
          (!searchEmail || user.email.toLowerCase().includes(searchEmail.toLowerCase())) &&
          (!filterRole || user.role === filterRole)
      );
      // Apply sorting
      if (sortConfig.key) {
         const { key, direction } = sortConfig;
          filtered.sort((a, b) => { const valA = String(a[key] || '').toLowerCase(); const valB = String(b[key] || '').toLowerCase(); if (valA < valB) return direction === 'asc' ? -1 : 1; if (valA > valB) return direction === 'asc' ? 1 : -1; return 0; });
      }
      return filtered;
  }, [userList, searchEmail, filterRole, sortConfig]); // Dependencies


  // --- Render ---
  // Show loading state if loading and no users are displayed yet
  if (isLoading && displayedUsers.length === 0) {
    return <div>Loading users...</div>;
  }
  // Show general error from parent if no specific user message is active
  if (error && !userMessage) {
       return <div className="error">{error}</div>;
   }

  return (
    <div className="users-view">
      <h2>Manage Users</h2>

      {/* Display User Action Messages (Success/Error from Add/Update/Delete) */}
      {userMessage && (
          <p className={`user-message ${userMessage.startsWith('Error:') ? 'error' : 'success'}`}>
            {userMessage}
          </p>
      )}

      {/* Filters */}
      <div className="filters">
         <input
             id="user-search-email" name="userSearchEmail"
             type="text"
             placeholder="Search by email..."
             value={searchEmail || ''}
             onChange={(e) => setSearchEmail(e.target.value)} // Update parent state
         />
         <label htmlFor="user-filter-role" style={{marginLeft: '1rem', marginRight: '0.5rem', fontWeight: '500'}}>Role:</label>
          <select
             id="user-filter-role" name="userFilterRole"
             value={filterRole}
             onChange={(e) => setFilterRole(e.target.value)} // Update parent state
          >
              <option value="">All Roles</option> <option value="admin">Admin</option> <option value="employee">Employee</option>
          </select>
           <button
              onClick={() => { setSearchEmail(''); setFilterRole(''); }} // Clear parent state
              style={{ marginLeft: 'auto' }}
              disabled={!searchEmail && !filterRole}
            >
              Clear Filters
           </button>
      </div>

      <div className="users-content">
        {/* Users Table */}
        <div className="users-table-wrapper">
          <table className="dynamic-table users-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('email')} style={{cursor: 'pointer'}}> Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                <th onClick={() => requestSort('role')} style={{cursor: 'pointer'}}> Role {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Map over the locally processed displayedUsers */}
              {displayedUsers.length === 0 ? (
                    <tr><td colSpan="3">No users found matching criteria.</td></tr>
              ) : (
                    displayedUsers.map(user => (
                        // Key Warning: Check data source / uniqueness of user.email if persists
                        <tr key={user.email}>
                            <td>{user.email}</td>
                            <td>
                                <select
                                    name={`role-${user.email}`} // Dynamic name
                                    value={user.role}
                                    onChange={(e) => handleChangeUserRole(user.email, e.target.value)}
                                    // Style inherited from global select rules
                                >
                                    <option value="employee">Employee</option> <option value="admin">Admin</option>
                                </select>
                            </td>
                            <td className="actions">
                                <button className="delete-btn" onClick={() => handleRemoveUser(user.email)}>Remove</button>
                            </td>
                        </tr>
                    ))
              )}
            </tbody>
          </table>
        </div>
        {/* Add User Form */}
        <div className="add-user-side">
          <div className="add-user-form">
            <h4>Add New User</h4>
            <label htmlFor="add-user-email">Email Address</label>
            <input id="add-user-email" name="newUserEmail" type="email" placeholder="user@domain.com" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} disabled={addingUser} required />

            <label htmlFor="add-user-role">Role</label>
            <select id="add-user-role" name="newUserRole" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} disabled={addingUser} required >
                <option value="" disabled>Select Role...</option> <option value="employee">Employee</option> <option value="admin">Admin</option>
            </select>

            <button className="add-user-btn" onClick={handleAddUser} disabled={addingUser || !newUserEmail || !newUserRole}>{addingUser ? 'Adding…' : 'Add User'}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageUsersPane;
