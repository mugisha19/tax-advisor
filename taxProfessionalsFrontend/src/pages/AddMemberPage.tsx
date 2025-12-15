import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaPhone,
  FaBuilding,
  FaIdCard,
  FaArrowLeft,
} from "react-icons/fa";
import rra from "../imgs/rra.png";
import ApplicantForm from "../components/ApplicantForm";
import Errors from "../components/Errors";
import LoadingSpinner from "../components/LoadingSpinner";
import { getCurrentUser } from "../services/getCurrentUser";
import { addCompanyMember } from "../services/addCompanyMember";
import type { CompanyAccount } from "../types/company";
import { AccountType } from "../types/company";

const AddMemberPage: React.FC = () => {
  const navigate = useNavigate();

  const [nid, setNid] = useState("");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<any>({});
  const [companyAccount, setCompanyAccount] = useState<CompanyAccount | null>(
    null
  );

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) {
          navigate("/");
          return;
        }

        const response = await getCurrentUser();
        const userData = response.data.data;

        // Check if this is a company account by checking for tinCompany field
        if (!userData.tinCompany) {
          navigate("/dashboard");
          return;
        }

        // Create CompanyAccount object from response data
        const companyData: CompanyAccount = {
          companyId: userData.companyId || 0,
          companyTin: userData.tinCompany,
          companyName: userData.companyName || "",
          companyEmail: userData.companyEmail || userData.email || "",
          members: userData.members || [],
        };
        setCompanyAccount(companyData);
      } catch (err: any) {
        console.error("AddMemberPage: Auth error:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("authToken");
          localStorage.removeItem("tinNumber");
          navigate("/");
        }
      } finally {
        setCheckingAuth(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const validateForm = () => {
    const formErrors: any = {};

    if (!nid.trim()) formErrors.nid = "NID is required";
    else if (!/^[0-9]{16}$/.test(nid.trim()))
      formErrors.nid = "NID must be 16 digits";

    if (!fullName.trim()) formErrors.fullName = "Full name is required";
    else if (fullName.trim().length < 3)
      formErrors.fullName = "Full name must be at least 3 characters";

    if (!phoneNumber.trim())
      formErrors.phoneNumber = "Phone number is required";
    else if (!/^\+250\d{9}$/.test(phoneNumber))
      formErrors.phoneNumber = "Phone number must be in format +250XXXXXXXXX";

    return formErrors;
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrors({});

    const formErrors = validateForm();
    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0 && companyAccount) {
      const memberData = {
        nid: nid.trim(),
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim(),
      };

      console.log("AddMemberPage: Submitting member data:", memberData);

      // Use companyId if available, otherwise use companyTin
      const companyIdentifier =
        companyAccount.companyId && companyAccount.companyId > 0
          ? companyAccount.companyId
          : companyAccount.companyTin;

      addCompanyMember(companyIdentifier, memberData)
        .then((response) => {
          setLoading(false);
          alert("Member added successfully!");
          navigate("/company-dashboard");
        })
        .catch((error) => {
          console.error("AddMemberPage: Error adding member:", error);
          setLoading(false);

          if (error.response?.data) {
            const errorData = error.response.data;

            if (errorData.errors && Array.isArray(errorData.errors)) {
              const backendErrors: any = {};
              errorData.errors.forEach((err: any) => {
                if (err.field) {
                  backendErrors[err.field] = err.message || err.defaultMessage;
                }
              });
              setErrors(backendErrors);
              setError(
                errorData.message || "Validation failed. Please check the form."
              );
            } else if (errorData.message) {
              setError(errorData.message);
            } else if (typeof errorData === "string") {
              setError(errorData);
            } else {
              setError(JSON.stringify(errorData));
            }
          } else if (error.message) {
            setError(error.message);
          } else {
            setError("Failed to add member. Please try again.");
          }
        });
    } else {
      setLoading(false);
    }
  };

  const renderField = (input: React.ReactNode, errorKey: string) => (
    <div className="flex flex-col">
      {input}
      <Errors message={errors[errorKey]} />
    </div>
  );

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!companyAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-100">
          <div className="bg-red-50 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <FaUser className="text-3xl text-red-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            Unauthorized Access
          </h3>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page
          </p>
          <button
            onClick={() => navigate("/")}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg bg-white p-4 sm:p-6 lg:p-8 rounded-2xl shadow-2xl space-y-4 sm:space-y-5 lg:space-y-6 border border-gray-100">
        {/* Back Button */}
        <button
          onClick={() => navigate("/company-dashboard")}
          className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors duration-200 group"
        >
          <FaArrowLeft className="group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Logo */}
        <div className="flex justify-center mb-2 sm:mb-3 lg:mb-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 shadow-sm">
            <img
              src={rra}
              alt="RRA Logo"
              className="h-20 sm:h-24 lg:h-28 xl:h-32 object-contain transition-transform hover:scale-105"
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">
            Add Company Member
          </h2>
          <p className="text-sm text-gray-500">
            Register a new team member for your company
          </p>
        </div>

        {/* Company Info Badge */}
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl mb-4 border border-blue-200 shadow-sm">
          <div className="flex items-center justify-center space-x-2">
            <div className="bg-blue-200 rounded-lg p-2">
              <FaBuilding className="text-blue-600 text-lg" />
            </div>
            <div className="text-left">
              <p className="text-xs text-blue-600 font-medium">Company</p>
              <p className="text-sm text-blue-900 font-bold">
                {companyAccount.companyName}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* NID Field */}
          {renderField(
            <div className="space-y-2">
              <label className="text-gray-700 font-semibold text-sm flex items-center space-x-2">
                <FaIdCard className="text-blue-600" />
                <span>National ID</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nid}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 16) setNid(value);
                  }}
                  placeholder="Enter 16-digit NID"
                  maxLength={16}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 px-4 text-base text-gray-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 hover:border-gray-300"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded">
                  {nid.length}/16
                </div>
              </div>
            </div>,
            "nid"
          )}

          {/* Full Name Field */}
          {renderField(
            <div className="space-y-2">
              <label className="text-gray-700 font-semibold text-sm flex items-center space-x-2">
                <FaUser className="text-blue-600" />
                <span>Full Name</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter full name"
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 px-4 text-base text-gray-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 hover:border-gray-300"
                />
              </div>
            </div>,
            "fullName"
          )}

          {/* Phone Number Field */}
          {renderField(
            <div className="space-y-2">
              <label className="text-gray-700 font-semibold text-sm flex items-center space-x-2">
                <FaPhone className="text-blue-600" />
                <span>Phone Number</span>
              </label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-700 font-semibold text-base pointer-events-none bg-gray-100 px-3 py-1 rounded-lg">
                  +250
                </div>
                <input
                  type="text"
                  value={
                    phoneNumber.startsWith("+250") ? phoneNumber.slice(4) : ""
                  }
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 9) {
                      setPhoneNumber("+250" + value);
                    }
                  }}
                  placeholder="XXXXXXXXX"
                  maxLength={9}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 pl-24 pr-4 text-base text-gray-800 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all duration-200 hover:border-gray-300"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs bg-gray-100 px-2 py-1 rounded">
                  {phoneNumber.slice(4).length}/9
                </div>
              </div>
            </div>,
            "phoneNumber"
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={() => navigate("/company-dashboard")}
              className="w-1/3 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="w-2/3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <span className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Adding...</span>
                </span>
              ) : (
                "Add Member"
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mt-4">
              <p className="text-red-600 text-sm font-medium text-center flex items-center justify-center space-x-2">
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </p>
            </div>
          )}
        </form>

        {/* Helper Text */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 mt-4 border border-gray-200">
          <p className="text-xs text-gray-600 text-center leading-relaxed">
            <span className="font-semibold">Note:</span> All fields are
            required. Make sure the information is accurate before submitting.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddMemberPage;
