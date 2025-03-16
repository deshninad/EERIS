import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage/LoginPage";
import EUploadPage from "./pages/eUploadPage/EUploadPage";
import ESummaryPage from "./pages/eSummaryPage/eSummaryPage";
import { AuthProvider } from "./AuthProvider";  
import ProtectedRoute from "./ProtectedRoute"; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
         <Route path="/upload" element={<ProtectedRoute><EUploadPage /></ProtectedRoute>} />
         <Route path="/dashboard" element={<ProtectedRoute><ESummaryPage /></ProtectedRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
