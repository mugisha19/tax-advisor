import "./App.css";
import ApplicantPage from "./pages/ApplicantPage";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SuccessfulPage from "./pages/SuccessfulPage";
import ApplicantDashboard from "./pages/ApplicantDashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import LoginPage from "./pages/LoginPage";
import SignUpPage from "./pages/SignUpPage";
import DocumentPage from "./pages/DocumentPage";
import ProfilePage from "./pages/ProfilePage";
import AddMemberPage from "./pages/AddMemberPage";
import EditMemberPage from "./pages/EditMemberPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Routes */}
        <Route path="/applicant" element={<ApplicantPage />} />
        <Route path="/success" element={<SuccessfulPage />} />
        <Route path="/dashboard" element={<ApplicantDashboard />} />
        <Route path="/company-dashboard" element={<CompanyDashboard />} />
        <Route path="/add-member" element={<AddMemberPage />} />
        <Route path="/edit-member" element={<EditMemberPage />} />
        <Route path="/documents" element={<DocumentPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </Router>
  );
}

export default App;
