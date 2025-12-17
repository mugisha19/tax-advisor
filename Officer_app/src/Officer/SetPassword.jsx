import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Shield,
  Key,
  Check,
  X as XIcon,
  UserCheck,
  RefreshCw,
} from "lucide-react";
import Logo from "../assets/rra.jpg";

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [isPasswordReset, setIsPasswordReset] = useState(false);
  const navigate = useNavigate();

  // Password strength validation
  const [passwordStrength, setPasswordStrength] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
  });

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const employeeIdParam = searchParams.get("employeeId");
    const resetParam = searchParams.get("reset"); // Check if it's a password reset

    if (!tokenParam) {
      setError("Invalid link. Please contact your administrator.");
      setValidatingToken(false);
      return;
    }

    setToken(tokenParam);
    if (employeeIdParam) {
      setEmployeeId(employeeIdParam);
    }
    if (resetParam === "true") {
      setIsPasswordReset(true);
    }

    // Validate token with backend
    validateToken(tokenParam);
  }, [searchParams]);

  const validateToken = async (tokenParam) => {
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/auth/validate-invitation`,
        { token: tokenParam }
      );

      if (response.data.success) {
        setTokenValid(true);
        if (response.data.data?.employeeId) {
          setEmployeeId(response.data.data.employeeId);
        }
      } else {
        setError(
          response.data.message ||
            "Invalid or expired link. Please contact your administrator."
        );
        setTokenValid(false);
      }
    } catch (err) {
      console.error("Token validation error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to validate link. Please try again or contact your administrator."
      );
      setTokenValid(false);
    } finally {
      setValidatingToken(false);
    }
  };

  // Check password strength
  useEffect(() => {
    setPasswordStrength({
      length: newPassword.length >= 8,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
    });
  }, [newPassword]);

  const isPasswordStrong =
    passwordStrength.length &&
    passwordStrength.uppercase &&
    passwordStrength.lowercase &&
    passwordStrength.number;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please try again.");
      return;
    }

    // Validate password strength
    if (!isPasswordStrong) {
      setError(
        "Password must be at least 8 characters and contain uppercase, lowercase, and number characters."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/auth/set-password`,
        {
          token: token,
          newPassword: newPassword,
          confirmPassword: confirmPassword,
        }
      );

      if (response.data.success) {
        setSuccess(
          isPasswordReset
            ? "Password reset successfully! Redirecting to login page..."
            : "Password set successfully! Redirecting to login page..."
        );

        // Clear any existing authentication data to force fresh login
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setTimeout(() => {
          navigate("/", { replace: true });
        }, 3000);
      } else {
        setError(
          response.data.message || "Failed to set password. Please try again."
        );
      }
    } catch (err) {
      console.error("Set password error:", err);
      if (err.response?.status === 400) {
        setError(
          err.response.data?.message ||
            "Invalid request. Please check your password and try again."
        );
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Invalid or expired link. Please request a new one.");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to set password. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-700 font-medium">Validating link...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-red-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Invalid Link
                </h2>
                <p className="text-red-700 mb-4">{error}</p>
                <p className="text-sm text-gray-600">
                  The link may have expired or already been used. Please request
                  a new one.
                </p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -top-48 -left-48 animate-pulse"></div>
        <div className="absolute w-96 h-96 bg-purple-500/10 rounded-full blur-3xl -bottom-48 -right-48 animate-pulse delay-700"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Brand Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6 relative">
            <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl"></div>
            <img
              src={Logo}
              alt="RRA Logo"
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-400/40 shadow-2xl relative z-10 hover:border-blue-400 transition-all duration-300 hover:scale-105"
            />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-wide">
            Tax Professional
          </h1>
          <p className="text-xl font-semibold text-blue-300 mb-3">
            Management System
          </p>
          <p className="text-gray-400 text-sm">
            {isPasswordReset
              ? "Create a new password for your account"
              : "Complete your account setup by creating a password"}
          </p>
        </div>

        {/* Password Setup Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8">
            {/* Welcome Banner */}
            {employeeId && !success && (
              <div className="mb-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                  {isPasswordReset ? (
                    <RefreshCw className="w-6 h-6 text-blue-600" />
                  ) : (
                    <UserCheck className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {isPasswordReset ? "Reset Your Password" : "Welcome!"}
                </h2>
                <p className="text-sm text-gray-600">
                  {isPasswordReset
                    ? "Creating new password for "
                    : "Setting up account for "}
                  <span className="font-semibold text-blue-600">
                    {employeeId}
                  </span>
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-shake">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-700 text-sm font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Message */}
              {success && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-green-700 font-medium">{success}</p>
                  </div>
                </div>
              )}

              {/* New Password Input */}
              <div className="space-y-2">
                <label
                  htmlFor="newPassword"
                  className="block text-sm font-semibold text-gray-700"
                >
                  {isPasswordReset ? "New Password" : "Create Password"}
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400 hover:border-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-semibold text-gray-700"
                >
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Key className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  </div>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={loading}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400 hover:border-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                    <XIcon className="w-3 h-3" />
                    Passwords do not match
                  </p>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <Check className="w-3 h-3" />
                    Passwords match
                  </p>
                )}
              </div>

              {/* Password Strength Indicator */}
              {newPassword && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-gray-700 flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5" />
                    Password Requirements:
                  </p>
                  <div className="space-y-1.5">
                    <StrengthItem
                      met={passwordStrength.length}
                      text="At least 8 characters"
                    />
                    <StrengthItem
                      met={passwordStrength.uppercase}
                      text="One uppercase letter (A-Z)"
                    />
                    <StrengthItem
                      met={passwordStrength.lowercase}
                      text="One lowercase letter (a-z)"
                    />
                    <StrengthItem
                      met={passwordStrength.number}
                      text="One number (0-9)"
                    />
                    <StrengthItem
                      met={passwordStrength.special}
                      text="One special character (!@#$%...)"
                      optional
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  loading ||
                  !isPasswordStrong ||
                  newPassword !== confirmPassword
                }
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {isPasswordReset
                      ? "Resetting Password..."
                      : "Setting Password..."}
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    {isPasswordReset ? "Reset Password" : "Complete Setup"}
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-100">
            <p className="text-sm text-gray-600 font-medium flex items-center justify-center gap-2">
              <Shield className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Secure access for authorized personnel</span>
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center space-y-3">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-gray-300 hover:text-white transition-colors"
          >
            ← Back to Login
          </button>
          <p className="text-sm text-gray-300">
            © 2024 Rwanda Revenue Authority. All rights reserved.
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          75% {
            transform: translateX(10px);
          }
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .delay-700 {
          animation-delay: 700ms;
        }
      `}</style>
    </div>
  );
};

// Helper component for password strength items
const StrengthItem = ({ met, text, optional = false }) => (
  <div className="flex items-center gap-2">
    <div
      className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
        met ? "bg-green-500" : optional ? "bg-gray-300" : "bg-red-400"
      }`}
    >
      {met ? (
        <Check className="w-3 h-3 text-white" />
      ) : (
        <XIcon className="w-3 h-3 text-white" />
      )}
    </div>
    <span
      className={`text-xs ${
        met
          ? "text-green-700 font-medium"
          : optional
          ? "text-gray-500"
          : "text-gray-700"
      }`}
    >
      {text}
    </span>
  </div>
);

export default SetPassword;
