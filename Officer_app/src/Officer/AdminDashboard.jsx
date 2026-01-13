import React, { useEffect, useState } from "react";
import {
  ListApplicants,
  updateOfficer,
  deleteOfficer,
} from "../services/ReviewOfficer";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Eye,
  Shield,
  AlertCircle,
  RefreshCw,
  Building,
  IdCard,
  UserCheck,
  Edit,
  Trash2,
  X,
  Save,
  CheckCircle2,
  Key,
  Lock,
} from "lucide-react";

const AdminDashboard = () => {
  const [Officers, setOfficers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedOfficer, setSelectedOfficer] = useState(null);
  const [updateFormData, setUpdateFormData] = useState({
    names: "",
    email: "",
    phoneNumber: "",
    officerType: "",
  });
  const [passwordFormData, setPasswordFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigator = useNavigate();

  useEffect(() => {
    fetchOfficers();
  }, []);

  const fetchOfficers = () => {
    setLoading(true);
    setError("");

    ListApplicants()
      .then((response) => {

        if (response.data.success && response.data.data) {
          setOfficers(response.data.data);
        } else if (Array.isArray(response.data)) {
          setOfficers(response.data);
        } else if (response.data.data) {
          setOfficers(response.data.data);
        } else {
          setError("Invalid response format");
        }
      })
      .catch((error) => {

        if (error.response?.status === 401 || error.response?.status === 403) {
          setError("Unauthorized. Please login again.");
          setTimeout(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            navigator("/");
          }, 2000);
        } else if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else {
          setError("Failed to load officers. Please try again.");
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  function addNewOfficer() {
    navigator("/officers/register");
  }

  function viewApplicants() {
    navigator("/officer/review");
  }

  // Open update modal
  const handleUpdateClick = (officer) => {
    setSelectedOfficer(officer);
    setUpdateFormData({
      names: officer.names,
      email: officer.email || "",
      phoneNumber: officer.phoneNumber || "",
      officerType: officer.officerType,
    });
    setShowUpdateModal(true);
  };

  // Open password change modal
  const handlePasswordClick = (officer) => {
    setSelectedOfficer(officer);
    setPasswordFormData({
      newPassword: "",
      confirmPassword: "",
    });
    setShowPassword(false);
    setShowPasswordModal(true);
  };

  // Open delete modal
  const handleDeleteClick = (officer) => {
    setSelectedOfficer(officer);
    setShowDeleteModal(true);
  };

  // Handle update form input change
  const handleUpdateInputChange = (e) => {
    const { name, value } = e.target;
    setUpdateFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle password form input change
  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Submit update
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const response = await updateOfficer(
        selectedOfficer.officerId,
        updateFormData
      );

      if (response.data.success || response.status === 200) {
        setMessage("Officer updated successfully!");
        setTimeout(() => setMessage(""), 3000);
        setShowUpdateModal(false);
        setSelectedOfficer(null);

        // Refresh the officers list
        fetchOfficers();
      } else {
        throw new Error(response.data.message || "Failed to update officer");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to update officer. Please try again.";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    // Validate passwords match
    if (passwordFormData.newPassword !== passwordFormData.confirmPassword) {
      setError("Passwords do not match!");
      setTimeout(() => setError(""), 5000);
      setSubmitting(false);
      return;
    }

    // Validate password strength (basic example)
    if (passwordFormData.newPassword.length < 8) {
      setError("Password must be at least 8 characters long!");
      setTimeout(() => setError(""), 5000);
      setSubmitting(false);
      return;
    }

    try {
      // TODO: Replace with your actual password update API endpoint
      // const response = await updateOfficerPassword(selectedOfficer.officerId, {
      //   newPassword: passwordFormData.newPassword
      // });

      // Simulated success for now
      setMessage("Password updated successfully!");
      setTimeout(() => setMessage(""), 3000);
      setShowPasswordModal(false);
      setSelectedOfficer(null);
      setPasswordFormData({ newPassword: "", confirmPassword: "" });
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to update password. Please try again.";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit delete
  const handleDeleteSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      const response = await deleteOfficer(selectedOfficer.officerId);

      if (
        response.data.success ||
        response.status === 200 ||
        response.status === 204
      ) {
        setMessage("Officer deleted successfully!");
        setTimeout(() => setMessage(""), 3000);
        setShowDeleteModal(false);
        setSelectedOfficer(null);

        // Refresh the officers list
        fetchOfficers();
      } else {
        throw new Error(response.data.message || "Failed to delete officer");
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to delete officer. Please try again.";
      setError(errorMessage);
      setTimeout(() => setError(""), 5000);
      setShowDeleteModal(false);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="flex flex-col items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600 font-medium">Loading officers...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !Officers.length) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 text-lg mb-2">Error</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <button
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                onClick={fetchOfficers}
              >
                <RefreshCw className="w-4 h-4" />
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Officers Management
              </h1>
              <p className="text-gray-600">
                Manage and view all system officers and administrators
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                onClick={viewApplicants}
              >
                <Eye className="w-5 h-5" />
                View Applicants
              </button>
              <button
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                onClick={addNewOfficer}
              >
                <UserPlus className="w-5 h-5" />
                Add Officer
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-red-900">Error</h4>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
            <button
              onClick={() => setError("")}
              className="text-red-400 hover:text-red-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {message && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-700 font-medium">{message}</p>
            </div>
            <button
              onClick={() => setMessage("")}
              className="text-green-400 hover:text-green-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Total Officers
                </p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {Officers.length}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Active in the system
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">Departments</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {[...new Set(Officers.map((o) => o.department))].length}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Unique departments</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <Building className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600">
                  Officer Types
                </p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {[...new Set(Officers.map((o) => o.officerType))].length}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Different roles</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Officers Table */}
        {Officers.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Officers Found
              </h3>
              <p className="text-gray-500 mb-6">
                Get started by adding your first officer to the system.
              </p>
              <button
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl font-semibold transition-all shadow-sm hover:shadow-md inline-flex items-center gap-2"
                onClick={addNewOfficer}
              >
                <UserPlus className="w-5 h-5" />
                Add First Officer
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Officers List
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    All registered officers and administrators
                  </p>
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                  {Officers.length}{" "}
                  {Officers.length === 1 ? "Officer" : "Officers"}
                </span>
              </div>
            </div>

            <div className="w-full">
              <table className="w-full table-fixed">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="w-[10%] px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      S/N
                    </th>
                    <th className="w-[15%] px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="w-[30%] px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="w-[10%] px-4 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="w-[15%] px-4 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Officers.map((officer, idx) => (
                    <tr
                      key={officer.officerId}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
                          <span className="font-semibold text-gray-900 text-sm truncate">
                            {idx+1}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <IdCard className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span className="text-gray-900 text-sm truncate">
                            {officer.employeeId}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <span
                            className="text-gray-900 font-medium text-sm truncate"
                            title={officer.names}
                          >
                            {officer.names}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                          {officer.officerType}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleUpdateClick(officer)}
                            className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                            title="Edit Officer"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDeleteClick(officer)}
                            className="p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
                            title="Delete Officer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Update Modal */}
      {showUpdateModal && selectedOfficer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => !submitting && setShowUpdateModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Edit className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Update Officer Details
                  </h3>
                  <p className="text-blue-100 text-sm mt-1">
                    Modify officer information
                  </p>
                </div>
              </div>
              <button
                onClick={() => !submitting && setShowUpdateModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleUpdateSubmit} className="p-6">
              {/* Read-only fields */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-3">
                  Read-Only Information
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Officer ID
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 font-semibold">
                      <Shield className="w-4 h-4 text-blue-600" />
                      {selectedOfficer.officerId}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Employee ID
                    </label>
                    <div className="flex items-center gap-2 text-gray-900 font-semibold">
                      <IdCard className="w-4 h-4 text-gray-600" />
                      {selectedOfficer.employeeId}
                    </div>
                  </div>
                </div>
              </div>

              {/* Editable fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="names"
                    value={updateFormData.names}
                    onChange={handleUpdateInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100"
                    required
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="officer@rra.gov.rw"
                    value={updateFormData.email}
                    onChange={handleUpdateInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    placeholder="e.g., 0781234567 or +250781234567"
                    value={updateFormData.phoneNumber}
                    onChange={handleUpdateInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100"
                    disabled={submitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Officer Type *
                  </label>
                  <select
                    name="officerType"
                    value={updateFormData.officerType}
                    onChange={handleUpdateInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors disabled:bg-gray-100"
                    required
                    disabled={submitting}
                  >
                    <option value="">Select Type</option>
                    <option value="OFFICER">Officer</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPERVISOR">Supervisor</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-xs text-blue-800 flex items-start gap-2">
                  <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Security Note:</strong> Employee ID cannot be
                    changed for data integrity. Use the password button to
                    update credentials securely.
                  </span>
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && selectedOfficer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => !submitting && setShowPasswordModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-amber-600 to-amber-700 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Key className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Change Password
                  </h3>
                  <p className="text-amber-100 text-sm mt-1">
                    Update officer password
                  </p>
                </div>
              </div>
              <button
                onClick={() => !submitting && setShowPasswordModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handlePasswordSubmit} className="p-6">
              {/* Officer Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Changing password for:
                </p>
                <p className="font-semibold text-gray-900">
                  {selectedOfficer.names}
                </p>
                <p className="text-sm text-gray-600">
                  Employee ID: {selectedOfficer.employeeId}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    New Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="newPassword"
                      value={passwordFormData.newPassword}
                      onChange={handlePasswordInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors disabled:bg-gray-100"
                      placeholder="Enter new password"
                      required
                      disabled={submitting}
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <Eye className="w-5 h-5" />
                      ) : (
                        <Lock className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 8 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={passwordFormData.confirmPassword}
                    onChange={handlePasswordInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors disabled:bg-gray-100"
                    placeholder="Re-enter new password"
                    required
                    disabled={submitting}
                    minLength={8}
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs text-amber-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Security:</strong> The officer will need to use this
                    new password on their next login.
                  </span>
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Update Password
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedOfficer && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => !submitting && setShowDeleteModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-red-600 to-red-700 rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">
                    Delete Officer
                  </h3>
                  <p className="text-red-100 text-sm mt-1">
                    This action cannot be undone
                  </p>
                </div>
              </div>
              <button
                onClick={() => !submitting && setShowDeleteModal(false)}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                <p className="text-red-800 text-sm">
                  Are you sure you want to delete the officer{" "}
                  <span className="font-semibold">{selectedOfficer.names}</span>{" "}
                  (ID: {selectedOfficer.officerId})? This will permanently
                  remove them from the system.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-medium transition-colors disabled:opacity-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteSubmit}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Officer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
