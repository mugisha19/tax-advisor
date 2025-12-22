import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  User,
  Lock,
  Building,
  IdCard,
  Shield,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  UserPlus,
  Mail,
} from "lucide-react";

const SignUp = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [names, setNames] = useState("");
  const [email, setEmail] = useState("");
  const [officerType, setOfficerType] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  async function saveOfficer(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate email format
    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    const officer = {
      employeeId,
      names,
      email,
      officerType,
    };

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://10.0.0.65:8080'}/api/admin/officers`,
        officer,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSuccess(
          "Officer created successfully! An invitation email has been sent to set up their password."
        );
        // Clear form
        setEmployeeId("");
        setNames("");
        setEmail("");
        setOfficerType("");

        setTimeout(() => {
          navigate("/officers");
        }, 3000);
      } else {
        setError(response.data.message || "Failed to create officer");
      }
    } catch (err) {

      if (err.response?.status === 409) {
        setError("An officer with this Employee ID or Email already exists");
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data?.error ||
            "Failed to create officer. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/officers")}
            className="mb-6 flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-all shadow-sm border border-gray-200 font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Officers
          </button>

          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <UserPlus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Add New Officer
              </h1>
              <p className="text-gray-600 mt-1">
                Create a new officer account and send invitation email
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-8">
            <form onSubmit={saveOfficer} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-red-900">Error</h4>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-700 font-medium">{success}</p>
                    <p className="text-green-600 text-sm mt-1">
                      Redirecting to officers list...
                    </p>
                  </div>
                </div>
              )}

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Mail className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 text-sm">
                    Email Invitation
                  </h4>
                  <p className="text-blue-700 text-sm mt-1">
                    An invitation email will be sent to the officer with a
                    secure link to set their password. The employee ID will be
                    used as their username for login.
                  </p>
                </div>
              </div>

              {/* Employee ID */}
              <div className="space-y-2">
                <label
                  htmlFor="employeeId"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Employee ID *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <IdCard className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="employeeId"
                    type="text"
                    placeholder="Enter employee ID"
                    name="employeeId"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400 hover:border-gray-400"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  This will be used as the username for login
                </p>
              </div>

              {/* Full Names */}
              <div className="space-y-2">
                <label
                  htmlFor="names"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Full Names *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="names"
                    type="text"
                    placeholder="Enter officer full names"
                    name="names"
                    value={names}
                    onChange={(e) => setNames(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400 hover:border-gray-400"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Email Address *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="Enter officer email address"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400 hover:border-gray-400"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  An invitation email will be sent to this address
                </p>
              </div>

              {/* Officer Type */}
              <div className="space-y-2">
                <label
                  htmlFor="officerType"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Officer Type *
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <Shield className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <select
                    id="officerType"
                    name="officerType"
                    value={officerType}
                    onChange={(e) => setOfficerType(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 hover:border-gray-400 appearance-none bg-white"
                  >
                    <option value="">Select Officer Type</option>
                    <option value="ADMIN">Admin</option>
                    <option value="OFFICER">Officer</option>
                  </select>
                  {/* Custom dropdown arrow */}
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating & Sending Invitation...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Create & Send Invitation
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/officers")}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all border border-gray-300 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Footer Info */}
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100">
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>
                Officers will receive a secure email with instructions to set
                their password
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
