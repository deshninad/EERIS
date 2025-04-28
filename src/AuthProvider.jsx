// src/AuthProvider.jsx
import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// Internal component name can be anything
const AuthProviderComponent = ({ children }) => {
  // ... state and functions (login, logout, etc.) ...
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem("isAuthenticated") === "true");
  const [email, setEmail] = useState(() => localStorage.getItem("userEmail") || null);
  const [role, setRole] = useState(() => localStorage.getItem("userRole") || null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const storedAuth = localStorage.getItem("isAuthenticated") === "true";
    const storedEmail = localStorage.getItem("userEmail");
    const storedRole = localStorage.getItem("userRole");
    if (storedAuth && storedEmail && storedRole) {
      setIsAuthenticated(true); setEmail(storedEmail); setRole(storedRole);
    }
    setIsAuthChecked(true);
  }, []);

  const login = (userEmail, userRole, remember) => { /* ... login logic ... */
    setIsAuthenticated(true); setEmail(userEmail); setRole(userRole);
    if (remember) { localStorage.setItem("isAuthenticated", "true"); localStorage.setItem("userEmail", userEmail); localStorage.setItem("userRole", userRole); }
    else { localStorage.removeItem("isAuthenticated"); localStorage.removeItem("userEmail"); localStorage.removeItem("userRole"); }
  };
  const logout = () => { /* ... logout logic ... */
    setIsAuthenticated(false); setEmail(null); setRole(null);
    localStorage.removeItem("isAuthenticated"); localStorage.removeItem("userEmail"); localStorage.removeItem("userRole");
  };

  const value = { isAuthenticated, email, role, login, logout, isAuthChecked };

  return (
    <AuthContext.Provider value={value}>
      {isAuthChecked ? children : <div>Loading Session...</div>}
    </AuthContext.Provider>
  );
};

// --- Ensure this is the export structure ---
export default AuthProviderComponent; // Default export for the component

export const useAuth = () => { // Named export for the hook
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
// -----------------------------------------
