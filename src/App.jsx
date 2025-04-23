import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage/LoginPage";
import EUploadPage from "./pages/eUploadPage/EUploadPage";
import ESummaryPage from "./pages/eSummaryPage/eSummaryPage";
import { AuthProvider } from "./AuthProvider";  
import ProtectedRoute from "./ProtectedRoute"; 
import AdminDashboard from "./pages/adminDashboard/adminDashboard";
import ReceiptConfirmation from "./pages/receiptConfirmation/ReceiptConfirmation";

//  function App() {
//    return (
//      <AuthProvider>
//        <Router>
//          <Routes>
//          <Route path="/" element={<LoginPage />} />
//          <Route path="/login" element={<LoginPage />} />
//           <Route path="/upload" element={<ProtectedRoute><EUploadPage /></ProtectedRoute>} />
//           <Route path="/dashboard" element={<ProtectedRoute><ESummaryPage /></ProtectedRoute>} />
//           <Route path="/admindashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
//          </Routes>
//        </Router>
//      </AuthProvider>
//    );
//  }


//removing access controls for development
function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
         <Route path="/upload" element={<EUploadPage />} />
         <Route path="/dashboard" element={<ESummaryPage />} />
         <Route path="/admindashboard" element={<AdminDashboard />} />
         <Route path="/receipt-confirmation" element={<ReceiptConfirmation />} />
        </Routes>
      </Router>
      </AuthProvider>
  );
}


export default App;
