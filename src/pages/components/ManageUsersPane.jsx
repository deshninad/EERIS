import React from 'react';

const ManageUsersPane = ({
  sortedUsers,
  newUserEmail,
  newUserRole,
  addingUser,
  userMessage,
  setNewUserEmail,
  setNewUserRole,
  handleAddUser,
  handleRemoveUser,
  handleChangeUserRole,
  requestSort,
  sortConfig,
}) => {
  return (
    <div className="users-view">
      <h2>Manage Users</h2>
      <div className="users-content">
        <div className="users-table-wrapper">
          <table className="dynamic-table users-table">
            <thead>
              <tr>
                <th onClick={() => requestSort('email')}>
                  Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th onClick={() => requestSort('role')}>
                  Role {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map(user => (
                <tr key={user.email}>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => handleChangeUserRole(user.email, e.target.value)}
                    >
                      <option value="employee">Employee</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <button onClick={() => handleRemoveUser(user.email)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="add-user-side">
          <div className="add-user-form">
            <input
              type="email"
              placeholder="user@usf.edu"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              disabled={addingUser}
            />
            <select
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value)}
              disabled={addingUser}
            >
              <option value="">Select Role</option>
              <option value="employee">Employee</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={handleAddUser} disabled={addingUser}>
              {addingUser ? 'Adding…' : 'Add User'}
            </button>
          </div>
          {userMessage && (
            <p className={`user-message ${userMessage.startsWith('Error') ? 'error' : 'success'}`}>
              {userMessage}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageUsersPane;
