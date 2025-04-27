// src/App.jsx (Fixed Router usage and added Summary Route)

import React from 'react';
// Import BrowserRouter and other necessary components
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Import the DEFAULT export from AuthProvider.jsx
import AuthProvider from './AuthProvider.jsx'; // Assuming default export

// Import your page components
import LoginPage from './pages/LoginPage/LoginPage.jsx';
import AdminDashboard from './pages/adminDashboard/AdminDashboard.jsx';
import EUploadPage from './pages/eUploadPage/EUploadPage.jsx';
import ESummaryPage from './pages/eSummaryPage/eSummaryPage.jsx'; // Ensure this is imported
// Import ProtectedRoute if you plan to use it later
// import ProtectedRoute from "./ProtectedRoute";

// Using the version without ProtectedRoute as shown in user's code
function App() {
  return (
    <AuthProvider>
      {/* --- FIX: Use BrowserRouter directly --- */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* Routes without ProtectedRoute for now */}
          <Route path="/upload" element={<EUploadPage />} />
          {/* FIX: Correct path for user dashboard if it's ESummaryPage (or create a separate UserDashboard) */}
          {/* If /dashboard IS the summary page list, this route is incorrect */}
          {/* Let's assume /dashboard is meant to be something else or removed for now */}
          {/* <Route path="/dashboard" element={<ESummaryPage />} />  */}
          <Route path="/admindashboard" element={<AdminDashboard />} />
          {/* --- FIX: Add the route for the specific summary page --- */}
          <Route path="/summary/:expenseId" element={<ESummaryPage />} />
          {/* ------------------------------------------------------- */}

           {/* Default Redirect */}
           <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
      {/* --- End FIX --- */}
    </AuthProvider>
  );
}

export default App;
