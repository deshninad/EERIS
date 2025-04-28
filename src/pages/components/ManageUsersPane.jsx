// src/pages/components/ManageUsersPane.jsx
import React, { useMemo } from 'react';

const ManageUsersPane = ({ /* ... props ... */
  userList, filterRole, setFilterRole, searchEmail, setSearchEmail,
  sortConfig, requestSort, isLoading, error, userMessage,
  newUserEmail, setNewUserEmail, newUserRole, setNewUserRole,
  addingUser, handleAddUser, handleRemoveUser, handleChangeUserRole,
}) => {

  const displayedUsers = useMemo(() => { /* ... filter/sort logic ... */
      let filtered = (userList || []).filter(user => (!searchEmail || user.email.toLowerCase().includes(searchEmail.toLowerCase())) && (!filterRole || user.role === filterRole));
      if (sortConfig.key) { const { key, direction } = sortConfig; filtered.sort((a, b) => { const valA = String(a[key] || '').toLowerCase(); const valB = String(b[key] || '').toLowerCase(); if (valA < valB) return direction === 'asc' ? -1 : 1; if (valA > valB) return direction === 'asc' ? 1 : -1; return 0; }); } return filtered;
  }, [userList, searchEmail, filterRole, sortConfig]);

  if (isLoading && displayedUsers.length === 0) return <div>Loading users...</div>;
  if (error && !userMessage) return <div className="error">{error}</div>;

  return (
    <div className="users-view">
      <h2>Manage Users</h2>
      {userMessage && (<p className={`user-message ${userMessage.startsWith('Error:') ? 'error' : 'success'}`}>{userMessage}</p>)}
      <div className="filters"> {/* ... filters UI ... */}
         <input id="user-search-email" name="userSearchEmail" type="text" placeholder="Search by email..." value={searchEmail || ''} onChange={(e) => setSearchEmail(e.target.value)} />
         <label htmlFor="user-filter-role" style={{marginLeft: '1rem', marginRight: '0.5rem', fontWeight: '500'}}>Role:</label>
         <select id="user-filter-role" name="userFilterRole" value={filterRole} onChange={(e) => setFilterRole(e.target.value)} > <option value="">All Roles</option> <option value="admin">Admin</option> <option value="employee">Employee</option> </select>
         <button onClick={() => { setSearchEmail(''); setFilterRole(''); }} style={{ marginLeft: 'auto' }} disabled={!searchEmail && !filterRole} > Clear Filters </button>
      </div>
      <div className="users-content">
        <div className="users-table-wrapper">
          <table className="dynamic-table users-table">
            <thead>{/* ... table header ... */}
                <tr><th onClick={() => requestSort('email')} style={{cursor: 'pointer'}}> Email {sortConfig.key === 'email' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th><th onClick={() => requestSort('role')} style={{cursor: 'pointer'}}> Role {sortConfig.key === 'role' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {displayedUsers.length === 0 ? ( <tr><td colSpan="3">No users found matching criteria.</td></tr> )
               : ( displayedUsers.map(user => (
                   // === FIX / VERIFY: Ensure user.email is unique in displayedUsers ===
                   // The deduplication in AdminDashboard should handle this, but if the
                   // warning persists, there might be an issue with the source data
                   // or the filtering/sorting logic above might reintroduce duplicates.
                   <tr key={user.email}>
                       <td>{user.email}</td>
                       <td><select name={`role-${user.email}`} value={user.role} onChange={(e) => handleChangeUserRole(user.email, e.target.value)} ><option value="employee">Employee</option> <option value="admin">Admin</option></select></td>
                       <td className="actions"><button className="delete-btn" onClick={() => handleRemoveUser(user.email)}>Remove</button></td>
                   </tr>
                   // === End Verify ===
                 ))
              )}
            </tbody>
          </table>
        </div>
        <div className="add-user-side">{/* ... add user form ... */}
            <div className="add-user-form"><h4>Add New User</h4><label htmlFor="add-user-email">Email Address</label><input id="add-user-email" name="newUserEmail" type="email" placeholder="user@domain.com" value={newUserEmail} onChange={(e) => setNewUserEmail(e.target.value)} disabled={addingUser} required /><label htmlFor="add-user-role">Role</label><select id="add-user-role" name="newUserRole" value={newUserRole} onChange={(e) => setNewUserRole(e.target.value)} disabled={addingUser} required > <option value="" disabled>Select Role...</option> <option value="employee">Employee</option> <option value="admin">Admin</option></select><button className="add-user-btn" onClick={handleAddUser} disabled={addingUser || !newUserEmail || !newUserRole}>{addingUser ? 'Adding…' : 'Add User'}</button></div>
        </div>
      </div>
    </div>
  );
};

export default ManageUsersPane;
