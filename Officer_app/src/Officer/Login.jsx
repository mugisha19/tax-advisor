import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  AlertCircle,
  Loader2,
  Shield,
  Mail,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Logo from "../assets/rra.jpg";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetError, setResetError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        const role = user?.role;

        if (role === "ADMIN" || role === "OFFICER") {
          navigate("/dashboard", { replace: true });
        }
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://10.0.0.65:8080'}/api/auth/login`,
        {
          username,
          password,
        }
      );

      const data = response.data;

      if (!data.success) {
        setError(data.message || "Login failed");
        setLoading(false);
        return;
      }

      const loginData = data.data;

      if (!loginData) {
        setError("Invalid response from server");
        setLoading(false);
        return;
      }

      const token = loginData.token;

      if (!token) {
        setError("Login failed. No token received.");
        setLoading(false);
        return;
      }

      let role = loginData.role;

      if (!role) {
        setError("Unknown role. Please contact admin.");
        setLoading(false);
        return;
      }

      role = role.toString().trim();
      role = role.replace(/[^a-zA-Z_]/g, "");
      role = role.replace(/^ROLE_/i, "");
      role = role.toUpperCase();

      localStorage.setItem("token", token);
      localStorage.setItem(
        "user",
        JSON.stringify({
          username: loginData.username || username,
          role: role,
        })
      );

      if (role === "ADMIN" || role === "OFFICER") {
        navigate("/dashboard", { replace: true });
      } else {
        setError(`Unknown role: ${role}. Please contact admin.`);
        setLoading(false);
      }
    } catch (err) {
      if (err.response) {
        setError(err.response.data?.message || "Invalid username or password");
      } else if (err.request) {
        setError("Cannot connect to server. Please try again.");
      } else {
        setError("An error occurred. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    setResetLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL || 'http://10.0.0.65:8080'}/api/auth/forgot-password`,
        {
          identifier: resetEmail,
        }
      );

      if (response.data.success) {
        setResetSuccess(
          "Password reset link has been sent to your email or SMS. Please check your inbox or phone."
        );
        setResetEmail("");
        // Auto close after 5 seconds
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetSuccess("");
        }, 5000);
      } else {
        setResetError(
          response.data.message ||
            "Failed to send reset link. Please try again."
        );
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setResetError("No account found with this email address.");
      } else {
        setResetError(
          err.response?.data?.message ||
            "Failed to send reset link. Please try again."
        );
      }
    } finally {
      setResetLoading(false);
    }
  };

  const toggleForgotPassword = () => {
    setShowForgotPassword(!showForgotPassword);
    setResetEmail("");
    setResetError("");
    setResetSuccess("");
    setError("");
  };

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
            {showForgotPassword
              ? "Reset your password"
              : "Sign in to access your dashboard"}
          </p>
        </div>

        {/* Login/Forgot Password Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8">
            {!showForgotPassword ? (
              // LOGIN FORM
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-shake">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-700 text-sm font-medium">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {/* Username Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="username"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Username
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400 hover:border-gray-400"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="password"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      id="password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400 hover:border-gray-400"
                    />
                  </div>
                </div>

                {/* Forgot Password Link */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={toggleForgotPassword}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      Login
                    </>
                  )}
                </button>
              </form>
            ) : (
              // FORGOT PASSWORD FORM
              <form onSubmit={handleForgotPassword} className="space-y-6">
                {/* Back Button */}
                <button
                  type="button"
                  onClick={toggleForgotPassword}
                  className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </button>

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-3">
                    <Lock className="w-6 h-6 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">
                    Reset Password
                  </h2>
                  <p className="text-sm text-gray-600">
                    Enter your email address and we'll send you a link to reset
                    your password
                  </p>
                </div>

                {/* Success Message */}
                {resetSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-green-700 text-sm font-medium">
                        {resetSuccess}
                      </p>
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {resetError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 animate-shake">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-red-700 text-sm font-medium">
                        {resetError}
                      </p>
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-2">
                  <label
                    htmlFor="resetEmail"
                    className="block text-sm font-semibold text-gray-700"
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    </div>
                    <input
                      id="resetEmail"
                      type="email"
                      placeholder="Enter your email address"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      required
                      disabled={resetLoading}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none disabled:bg-gray-100 disabled:cursor-not-allowed text-gray-900 placeholder-gray-400 hover:border-gray-400"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending Reset Link...
                    </>
                  ) : (
                    <>
                      <Mail className="w-5 h-5" />
                      Send Reset Link
                    </>
                  )}
                </button>
              </form>
            )}
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
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            © 2024 Rwanda Revenue Authority. All rights reserved.
          </p>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
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
      `,
        }}
      />
    </div>
  );
};

export default Login;
