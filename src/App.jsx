import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage/LoginPage';
import './App.css';
import { AuthProvider } from './AuthContext.jsx';  // Import the AuthProvider

function App() {
  return (
    <AuthProvider>  {/* Wrap the Router with AuthProvider */}
      <Router>
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
