// src/AuthProvider.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// Internal component name can be anything
const AuthProviderComponent = ({ children }) => {
  // --- DEBUG LOG ---
  // Log the props received by the component *inside* the function
  console.log("AuthProviderComponent rendered. Received props:", { children });

  // --- State and functions ---
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("isAuthenticated") === "true");
  const [email, setEmail] = useState(() => localStorage.getItem("userEmail") || null);
  const [role, setRole] = useState(() => localStorage.getItem("userRole") || null);
  // Added isAuthChecked state to prevent rendering children before auth status is known
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    console.log("AuthProviderComponent useEffect running to check localStorage");
    const storedAuth = localStorage.getItem("isAuthenticated") === "true";
    const storedEmail = localStorage.getItem("userEmail");
    const storedRole = localStorage.getItem("userRole");
    if (storedAuth && storedEmail && storedRole) {
      setIsAuthenticated(true);
      setEmail(storedEmail);
      setRole(storedRole);
      console.log("AuthProviderComponent: Found authenticated state in localStorage");
    } else {
      console.log("AuthProviderComponent: No authenticated state found in localStorage");
      // Ensure state is false if nothing found
      setIsAuthenticated(false);
      setEmail(null);
      setRole(null);
    }
    // Mark that the initial check is complete
    setIsAuthChecked(true);
    console.log("AuthProviderComponent: Initial auth check complete.");
  }, []); // Empty dependency array ensures this runs only once on mount

  const login = (userEmail, userRole, remember) => {
    console.log("AuthProvider login called for:", userEmail, userRole);
    setIsAuthenticated(true); setEmail(userEmail); setRole(userRole);
    if (remember) {
        localStorage.setItem("isAuthenticated", "true");
        localStorage.setItem("userEmail", userEmail);
        localStorage.setItem("userRole", userRole);
    } else {
        // If not remember, clear localStorage related to auth
        localStorage.removeItem("isAuthenticated");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("userRole");
    }
  };
  const logout = () => {
    console.log("AuthProvider logout called");
    setIsAuthenticated(false); setEmail(null); setRole(null);
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");
  };

  // Include isAuthChecked in the context value
  const value = { isAuthenticated, email, role, login, logout, isAuthChecked };

  // Render children only after the initial auth check is complete
  return (
    <AuthContext.Provider value={value}>
      {isAuthChecked ? children : <div>Loading Session...</div>}
    </AuthContext.Provider>
  );
};

// --- Exports ---
export default AuthProviderComponent; // Default export for the component

export const useAuth = () => { // Named export for the hook
    const context = useContext(AuthContext);
    if (context === undefined) {
        // This error means useAuth was called outside of a component wrapped by AuthProviderComponent
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
// -----------------
