import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaLock,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaCheckCircle,
} from "react-icons/fa";
import { MdBusiness } from "react-icons/md";
import rra from "../imgs/rra.png";
import { useNavigate } from "react-router-dom";
import ApplicantForm from "../components/ApplicantForm";
import Errors from "../components/Errors";
import { addApplicant } from "../services/SignUp";
import { addCompany } from "../services/CompanyRegister";
import { validateTin } from "../services/ValidateTin";
import { sendPasswordEmail } from "../services/SendPasswordEmail";

const SignUpPage: React.FC = () => {
  console.log("SignUpPage: Component rendering");

  // Step management
  const [accountType, setAccountType] = useState("");

  // Form state
  const [tin, setTin] = useState("");
  const [nid, setNid] = useState("");
  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");

  // Location state
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [sector, setSector] = useState("");
  const [cell, setCell] = useState("");
  const [village, setVillage] = useState("");

  // Additional fields
  const [category, setCategory] = useState("");
  const [detailedAddress, setDetailedAddress] = useState("");
  const [fax, setFax] = useState("");
  const [businessName, setBusinessName] = useState("");

  // UI state
  const [validating, setValidating] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<any>({});

  // Validation state
  const [validationTin, setValidationTin] = useState("");
  const [validationData, setValidationData] = useState<any>(null);
  const [isTinValidated, setIsTinValidated] = useState(false);

  const navigate = useNavigate();

  // Clear form when account type changes
  useEffect(() => {
    if (accountType) {
      clearForm();
    }
  }, [accountType]);

  const clearForm = () => {
    setTin("");
    setNid("");
    setFullname("");
    setEmail("");
    setPhoneNumber("");
    setPassword("");
    setProvince("");
    setDistrict("");
    setSector("");
    setCell("");
    setVillage("");
    setCategory("");
    setDetailedAddress("");
    setFax("");
    setBusinessName("");
    setValidationTin("");
    setValidationData(null);
    setIsTinValidated(false);
    setError("");
    setErrors({});
  };

  const handleValidateTin = async () => {
    if (!validationTin) {
      setError("Please enter a TIN to validate");
      return;
    }

    setValidating(true);
    setError("");
    setValidationData(null);
    setIsTinValidated(false);

    try {
      const response = await validateTin(validationTin);
      console.log("SignUpPage: TIN validation response:", response.data);

      // The response structure is: { success, message, data: {...}, timestamp }
      const apiResponse = response.data;
      const supplierData = apiResponse.data; // The actual supplier data

      console.log("SignUpPage: TIN validation data:", supplierData);

      setValidationData(apiResponse);

      // Auto-fill form fields with validated data (matching API field names)
      // Common fields for both Individual and Company
      setTin(supplierData.SupplierTin || validationTin);
      setFullname(supplierData.SupplierName || ""); // For Individual: names, For Company: we'll use businessName
      setBusinessName(supplierData.SupplierName || ""); // Company name
      setEmail(supplierData.EmailAddress || "");
      setPhoneNumber(supplierData.PhoneNumber || "");
      setNid(supplierData.NationalId || "");

      // Location fields
      setProvince(supplierData.Province || "");
      setDistrict(supplierData.District || "");
      setSector(supplierData.Sector || "");
      setCell(supplierData.Cell || "");
      setVillage(supplierData.Village || "");

      setIsTinValidated(true);
      setValidating(false);
      setError("");

      // Set the validated TIN
      setValidationTin(supplierData.SupplierTin || validationTin);
    } catch (err: any) {
      console.error("SignUpPage: TIN validation error:", err);
      setValidating(false);
      setError(
        err.response?.data?.message ||
          "Failed to validate TIN. Please check the number and try again."
      );
      setValidationData(null);
      setIsTinValidated(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // No validation - proceed directly to registration
    setRegistering(true);
    setError("");

    try {
      let response;

      // Prepare user data
      const userData = {
        category,
        cell,
        detailedAddress,
        district,
        email,
        fullName: fullname, // Backend expects camelCase
        phoneNumber,
        province,
        sector,
        village,
        fax,
        nid,
        businessName,
        tin,
        password,
        accountType,
      };

      console.log("SignUpPage: Registering user:", userData);

      if (accountType === "INDIVIDUAL") {
        response = await addApplicant(userData);
      } else {
        // Company registration - only TIN and password are required, rest are optional
        const companyData: any = {
          companyTin: tin,
          companyName: businessName || "",
          password,
          accountType,
          // Optional fields - only include if provided
          companyEmail: email || "",
          companyPhoneNumber: phoneNumber || "",
          province: province || "",
          district: district || "",
          sector: sector || "",
          cell: cell || "",
          village: village || "",
          companyAddress: detailedAddress || "",
          companyFax: fax || "",
          category: category || "",
          applicantNames: fullname || "",
        };

        console.log(
          "SignUpPage: Registering company with data (TIN + password required, others optional):",
          companyData
        );
        response = await addCompany(companyData);
      }

      console.log("SignUpPage: Registration successful:", response.data);

      // Send password email after successful registration
      try {
        await sendPasswordEmail({
          email: email,
          password: password,
          fullName: accountType === "INDIVIDUAL" ? fullname : businessName,
          accountType: accountType,
        });
        console.log("SignUpPage: Password email sent successfully");
      } catch (emailErr: any) {
        console.error("SignUpPage: Failed to send password email:", emailErr);
        // Don't block the registration flow if email fails
      }

      // Success
      alert(
        "Registration successful! A confirmation email with your password has been sent to " +
          email
      );
      navigate("/");
    } catch (err: any) {
      console.error("SignUpPage: Registration error:", err);
      setError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setRegistering(false);
    }
  };

  const renderField = (input: React.ReactNode, errorKey: string) => (
    <div className="flex flex-col">
      {input}
      <Errors message={errors[errorKey]} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-2xl bg-white p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl space-y-4 sm:space-y-5 lg:space-y-6">
        {/* Logo */}
        <div className="flex justify-center mb-2 sm:mb-3 lg:mb-4">
          <img
            src={rra}
            alt="RRA Logo"
            className="h-20 sm:h-24 lg:h-28 xl:h-32 object-contain"
          />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-4 sm:mb-6">
          Sign Up
        </h2>

        {/* Account Type Selection - Show this first */}
        {!accountType && (
          <div className="space-y-6">
            <div className="space-y-4">
              <label className="text-gray-700 font-medium block text-center text-lg">
                Select Account Type
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Individual Option */}
                <div
                  onClick={() => setAccountType("INDIVIDUAL")}
                  className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-gray-300 bg-white hover:border-blue-400 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <FaUser className="text-5xl mb-4 text-gray-400" />
                  <span className="font-semibold text-lg text-gray-700">
                    Individual
                  </span>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Register as an individual tax professional
                  </p>
                </div>

                {/* Company Option */}
                <div
                  onClick={() => setAccountType("COMPANY")}
                  className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-gray-300 bg-white hover:border-blue-400 hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  <FaBuilding className="text-5xl mb-4 text-gray-400" />
                  <span className="font-semibold text-lg text-gray-700">
                    Company
                  </span>
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Register as a company or organization
                  </p>
                </div>
              </div>

              <Errors message={errors.accountType} />
            </div>

            <div className="text-center pt-3 sm:pt-4">
              <p className="text-gray-600 text-sm sm:text-base">
                Already have an account?{" "}
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/");
                  }}
                  className="text-blue-400 hover:text-blue-600 font-semibold underline transition duration-200 text-sm sm:text-base"
                >
                  Login here
                </a>
              </p>
            </div>
          </div>
        )}

        {/* Registration Form - Show this after selecting account type */}
        {accountType && (
          <form onSubmit={handleRegister} className="space-y-6">
            {/* Show selected account type with option to change */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {accountType === "INDIVIDUAL" ? (
                    <FaUser className="text-2xl text-blue-600" />
                  ) : (
                    <FaBuilding className="text-2xl text-blue-600" />
                  )}
                  <div>
                    <p className="text-sm text-gray-600">Account Type</p>
                    <p className="font-semibold text-blue-800">
                      {accountType === "INDIVIDUAL" ? "Individual" : "Company"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAccountType("")}
                  className="text-sm text-blue-600 hover:text-blue-800 underline font-medium"
                >
                  Change
                </button>
              </div>
            </div>

            {/* TIN Validation Section */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                TIN Validation
                {isTinValidated && (
                  <FaCheckCircle className="text-green-500 text-lg" />
                )}
              </h3>
              <div className="flex flex-col sm:flex-row gap-2 items-end">
                <div className="flex-grow w-full">
                  <ApplicantForm
                    label="Enter TIN to Validate"
                    value={validationTin}
                    onChange={(e) => {
                      setValidationTin(e.target.value);
                      // Reset validation if TIN changes
                      if (isTinValidated && e.target.value !== tin) {
                        setIsTinValidated(false);
                      }
                    }}
                    placeholder="Enter TIN"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleValidateTin}
                  disabled={validating || isTinValidated || !accountType}
                  className={`w-full sm:w-auto font-semibold py-4 px-6 rounded-lg transition duration-200 mb-0 ${
                    isTinValidated
                      ? "bg-green-100 text-green-700 cursor-default"
                      : "bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
                  }`}
                >
                  {validating
                    ? "Validating..."
                    : isTinValidated
                    ? "Validated"
                    : "Validate"}
                </button>
              </div>
              {error && !validationData && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
              {isTinValidated && (
                <p className="text-green-600 text-sm mt-2">
                  ✓ TIN validated successfully! All fields have been
                  auto-filled.
                </p>
              )}
            </div>

            {/* Registration Information */}
            <div className="bg-blue-50 p-3 rounded-lg mb-4">
              <p className="text-sm text-blue-800 text-center font-medium">
                {accountType
                  ? `${
                      accountType === "INDIVIDUAL" ? "Individual" : "Company"
                    } Registration`
                  : "Registration Information"}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TIN Field */}
              {renderField(
                <ApplicantForm
                  label={accountType === "COMPANY" ? "Company TIN" : "TIN"}
                  value={tin}
                  onChange={(e) => setTin(e.target.value)}
                  placeholder={
                    accountType === "COMPANY" ? "Company TIN" : "TIN"
                  }
                  disabled={true}
                />,
                "tin"
              )}

              {/* Names/Company Name Field */}
              {accountType === "INDIVIDUAL"
                ? renderField(
                    <ApplicantForm
                      label="Names"
                      icon={<FaUser />}
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      placeholder="Full Names"
                      disabled={true}
                    />,
                    "fullname"
                  )
                : renderField(
                    <ApplicantForm
                      label="Company Name (Optional)"
                      icon={<MdBusiness />}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="Company Name (Optional)"
                      disabled={true}
                    />,
                    "businessName"
                  )}

              {/* Email Field */}
              {renderField(
                <ApplicantForm
                  label={
                    accountType === "COMPANY"
                      ? "Company Email (Optional)"
                      : "Email Address"
                  }
                  type="email"
                  icon={<FaEnvelope />}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    accountType === "COMPANY"
                      ? "Email Address (Optional)"
                      : "Email Address"
                  }
                  disabled={true}
                />,
                "email"
              )}

              {/* National ID / Passport - Only for Individual */}
              {accountType === "INDIVIDUAL" &&
                renderField(
                  <ApplicantForm
                    label="National ID / Passport"
                    value={nid}
                    onChange={(e) => setNid(e.target.value)}
                    placeholder="National ID or Passport Number"
                    disabled={true}
                  />,
                  "nid"
                )}

              {/* Phone Number Field */}
              {renderField(
                <div className="flex flex-col">
                  <label className="text-gray-700 font-medium mb-2">
                    {accountType === "COMPANY"
                      ? "Company Phone Number (Optional)"
                      : "Phone Number"}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => {
                        let value = e.target.value;
                        // Ensure phone number starts with +
                        if (!value.startsWith("+")) {
                          value = "+" + value;
                        }
                        setPhoneNumber(value);
                      }}
                      placeholder={
                        accountType === "COMPANY"
                          ? "+250788123456 (Optional)"
                          : "+250788123456"
                      }
                      disabled={true}
                      className="w-full border border-gray-300 rounded-lg py-4 pl-5 pr-5 text-base text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-gray-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-2xl pointer-events-none">
                      <FaPhone />
                    </span>
                  </div>
                </div>,
                "phoneNumber"
              )}

              {/* Location Fields */}
              {renderField(
                <ApplicantForm
                  label="Province"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  placeholder="Province"
                  disabled={true}
                />,
                "province"
              )}

              {renderField(
                <ApplicantForm
                  label="District"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="District"
                  disabled={true}
                />,
                "district"
              )}

              {renderField(
                <ApplicantForm
                  label="Sector"
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  placeholder="Sector"
                  disabled={true}
                />,
                "sector"
              )}

              {renderField(
                <ApplicantForm
                  label="Cell"
                  value={cell}
                  onChange={(e) => setCell(e.target.value)}
                  placeholder="Cell"
                  disabled={true}
                />,
                "cell"
              )}

              {renderField(
                <ApplicantForm
                  label="Village"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="Village"
                  disabled={true}
                />,
                "village"
              )}

              {/* Password Field */}
              {renderField(
                <ApplicantForm
                  label="Password"
                  type="password"
                  icon={<FaLock />}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create password"
                  disabled={false}
                />,
                "password"
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setAccountType("")}
                className="w-1/3 bg-gray-300 hover:bg-gray-400 text-gray-700 font-semibold py-3 rounded-full transition duration-200"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={registering || !isTinValidated}
                className="w-2/3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-full transition duration-200"
              >
                {registering ? "Registering..." : "Register"}
              </button>
            </div>

            {error && (
              <p className="text-red-500 text-xs sm:text-sm lg:text-base text-center mt-2">
                {error}
              </p>
            )}

            <div className="text-center pt-3 sm:pt-4">
              <p className="text-gray-600 text-sm sm:text-base">
                Already have an account?{" "}
                <a
                  href="/"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/");
                  }}
                  className="text-blue-400 hover:text-blue-600 font-semibold underline transition duration-200 text-sm sm:text-base"
                >
                  Login here
                </a>
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SignUpPage;
