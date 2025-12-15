import Footer from "./Officer/Footer";
import DashboardLayout from "./Officer/DashboardLayout";
import OfficerDashboard from "./Officer/OfficerDashboard";
import MyReviews from "./Officer/MyReviews";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignUp from "./Officer/SignUp";
import AdminDashboard from "./Officer/AdminDashboard";
import Login from "./Officer/Login";
import SetPassword from "./Officer/SetPassword";
import ProtectedRoute from "./Officer/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <DashboardLayout>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/set-password" element={<SetPassword />} />

          {/* Protected Routes */}
          <Route
            path="/officers/register"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <SignUp />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officers"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/review"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "OFFICER"]}>
                <OfficerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/officer/my-reviews"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "OFFICER"]}>
                <MyReviews />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={["ADMIN", "OFFICER"]}>
                {/* DashboardLayout handles the dashboard content */}
                <div></div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </DashboardLayout>
      {/* <Footer /> */}
    </BrowserRouter>
  );
}

export default App;
