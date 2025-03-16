import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Manage authentication state and user email
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState(null); // Add email state

  // Login function to authenticate the user and store email
  const login = (userEmail) => {
    setIsAuthenticated(true);
    setEmail(userEmail); // Store the user's email
  };

  // Logout function to clear authentication and email
  const logout = () => {
    setIsAuthenticated(false);
    setEmail(null); // Clear the user's email on logout
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, email, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => useContext(AuthContext);
