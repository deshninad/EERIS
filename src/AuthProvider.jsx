// src/AuthProvider.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

// Internal context object
const AuthContext = createContext(null);

// The Provider component itself
const AuthProviderComponent = ({ children }) => {
  // State for authentication status, user email, and role
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("isAuthenticated") === "true");
  const [email, setEmail] = useState(() => localStorage.getItem("userEmail") || null);
  const [role, setRole] = useState(() => localStorage.getItem("userRole") || null);
  const [isAuthChecked, setIsAuthChecked] = useState(false); // Track if initial check is done

  // Effect to load auth state from localStorage on initial mount
  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated") === "true";
    const storedEmail = localStorage.getItem("userEmail");
    const storedRole = localStorage.getItem("userRole");

    if (storedAuth && storedEmail && storedRole) {
      setIsAuthenticated(true);
      setEmail(storedEmail);
      setRole(storedRole);
    }
    setIsAuthChecked(true); // Mark check as complete
  }, []); // Empty dependency array: runs only once on mount

  // Login function: updates state and localStorage
  const login = (userEmail, userRole, remember) => {
    setIsAuthenticated(true);
    setEmail(userEmail);
    setRole(userRole);
    if (remember) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("userRole", userRole);
    } else {
      localStorage.removeItem("isAuthenticated");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userRole");
    }
  };

  // Logout function: clears state and localStorage
  const logout = () => {
    setIsAuthenticated(false);
    setEmail(null);
    setRole(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
  };

  // Value object passed to consumers of the context
  const value = { isAuthenticated, email, role, login, logout, isAuthChecked };

  return (
    <AuthContext.Provider value={value}>
      {/* Render children only after initial check */}
      {isAuthChecked ? children : <div>Loading Session...</div>}
    </AuthContext.Provider>
  );
};

// Export the Provider component as the default export
export default AuthProviderComponent;

// Export the custom hook as a named export
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
