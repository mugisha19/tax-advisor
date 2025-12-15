import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  User,
  Phone,
  CreditCard,
  Save,
  XCircle,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  X,
} from "lucide-react";
import { updateCompanyMember } from "../services/updateCompanyMember";
import rra from "../imgs/rra.png";

interface MemberData {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  nid: string;
  tpin?: string;
  status?: string;
}

export default function EditMemberPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const memberData = location.state?.member as MemberData;

  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    nid: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error";
  }>({ show: false, message: "", type: "success" });

  useEffect(() => {
    // If no member data is passed, redirect back
    if (!memberData) {
      alert("No member data provided");
      navigate("/company-dashboard");
      return;
    }

    // Pre-fill form with existing member data
    setFormData({
      fullName: memberData.fullName || "",
      phoneNumber: memberData.phoneNumber || "",
      nid: memberData.nid || "",
    });
  }, [memberData, navigate]);

  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: "", type: "success" });
    }, 3000);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    }

    if (!formData.nid.trim()) {
      newErrors.nid = "National ID / Passport is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showNotification("Please fix all validation errors", "error");
      return;
    }

    setLoading(true);

    try {
      console.log("EditMemberPage: Submitting update with data:", {
        memberTpin: memberData.tpin,
        ...formData,
      });
      
      const response = await updateCompanyMember({
        memberTpin: memberData.tpin || "",
        ...formData,
      });

      console.log("EditMemberPage: Update response:", response);
      console.log("EditMemberPage: Response data:", response.data);
      
      // Check if the backend actually succeeded
      if (response.data.success === false) {
        console.error("EditMemberPage: Backend returned success=false:", response.data.message);
        showNotification(
          response.data.message || "Failed to update member",
          "error"
        );
        setLoading(false);
        return;
      }
      
      showNotification("Member updated successfully!", "success");
      
      // Navigate back to company dashboard after a short delay with refresh flag
      console.log("EditMemberPage: Navigating to company dashboard with refresh flag");
      setTimeout(() => {
        navigate("/company-dashboard", { state: { refresh: true } });
      }, 1500);
    } catch (error: any) {
      console.error("EditMemberPage: Error updating member:", error);
      showNotification(
        error.response?.data?.message || "Failed to update member",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/company-dashboard");
  };

  if (!memberData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Notification Toast */}
      {notification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in">
          <div
            className={`flex items-center gap-3 px-6 py-4 rounded-lg shadow-lg ${
              notification.type === "success"
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            {notification.type === "success" ? (
              <CheckCircle className="h-6 w-6 text-green-600" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600" />
            )}
            <p
              className={`font-medium ${
                notification.type === "success"
                  ? "text-green-800"
                  : "text-red-800"
              }`}
            >
              {notification.message}
            </p>
            <button
              onClick={() =>
                setNotification({ show: false, message: "", type: "success" })
              }
              className="ml-2"
            >
              <X
                className={`h-5 w-5 ${
                  notification.type === "success"
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img src={rra} alt="RRA Logo" className="h-12 sm:h-14 object-contain" />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                  Edit Company Member
                </h1>
                <p className="text-sm text-gray-600">
                  Update member information
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition duration-200"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Member Info Header */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Member Information
                </h2>
                {memberData.tpin && (
                  <p className="text-sm text-gray-600 mt-1">
                    TPIN: {memberData.tpin}
                  </p>
                )}
              </div>
              {memberData.status && (
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    memberData.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : memberData.status === "PENDING"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {memberData.status}
                </span>
              )}
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className={`w-full border ${
                    errors.fullName ? "border-red-500" : "border-gray-300"
                  } rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200`}
                  placeholder="Enter full name"
                  disabled={loading}
                />
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Phone className="inline h-4 w-4 mr-1" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, phoneNumber: e.target.value })
                  }
                  className={`w-full border ${
                    errors.phoneNumber ? "border-red-500" : "border-gray-300"
                  } rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200`}
                  placeholder="Enter phone number"
                  disabled={loading}
                />
                {errors.phoneNumber && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.phoneNumber}
                  </p>
                )}
              </div>

              {/* National ID / Passport */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="inline h-4 w-4 mr-1" />
                  National ID / Passport *
                </label>
                <input
                  type="text"
                  value={formData.nid}
                  onChange={(e) =>
                    setFormData({ ...formData, nid: e.target.value })
                  }
                  className={`w-full border ${
                    errors.nid ? "border-red-500" : "border-gray-300"
                  } rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200`}
                  placeholder="Enter National ID or Passport number"
                  disabled={loading}
                />
                {errors.nid && (
                  <p className="text-red-500 text-sm mt-1">{errors.nid}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition duration-200 shadow-md hover:shadow-lg"
              >
                <Save className="h-5 w-5" />
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition duration-200 shadow-md hover:shadow-lg"
              >
                <XCircle className="h-5 w-5" />
                Cancel
              </button>
            </div>
          </form>
        </div>

        {/* Info Note */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Changes will be saved immediately. Make sure all
            information is correct before saving.
          </p>
        </div>
      </div>
    </div>
  );
}

