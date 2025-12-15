import React, { useState, useEffect } from "react";
import { FaLock } from "react-icons/fa";
import rra from "../imgs/rra.png";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../services/ResetPassword";

const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const tokenFromUrl = searchParams.get("token");
    const typeFromUrl = searchParams.get("type");
    
    // Verify this is for tax professional or company accounts
    if (typeFromUrl && typeFromUrl !== "taxprofessional" && typeFromUrl !== "company") {
      setError("This reset link is not valid for tax professional accounts. Please use the correct reset link.");
      return;
    }
    
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    // Validate password strength
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long!");
      setLoading(false);
      return;
    }

    try {
      await resetPassword({
        token,
        newPassword,
        confirmPassword,
      });
      setSuccess(true);
      setError("");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error: any) {
      console.error("ResetPasswordPage: Error:", error);
      setError(
        error.response?.data?.message || 
        "Failed to reset password. The link may have expired. Please request a new one."
      );
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10">
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg bg-white p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl space-y-4 sm:space-y-5 lg:space-y-6">
        <div className="flex justify-center mb-2 sm:mb-3 lg:mb-4">
          <img
            src={rra}
            alt="RRA Logo"
            className="h-20 sm:h-24 lg:h-28 xl:h-32 object-contain"
          />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-4 sm:mb-6">
          Reset Password
        </h2>
        
        <p className="text-xs sm:text-sm text-gray-500 text-center -mt-2 mb-2">
          Tax Professional Account
        </p>

        {!success ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-gray-600 text-sm sm:text-base text-center">
              Enter your new password below.
            </p>

            <div className="relative">
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading || !token}
                className="w-full border border-gray-300 rounded-lg py-3 sm:py-3 lg:py-4 px-3 sm:px-4 pl-10 sm:pl-11 lg:pl-12 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base lg:text-lg"
              />
              <FaLock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base sm:text-lg" />
            </div>

            <div className="relative">
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading || !token}
                className="w-full border border-gray-300 rounded-lg py-3 sm:py-3 lg:py-4 px-3 sm:px-4 pl-10 sm:pl-11 lg:pl-12 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base lg:text-lg"
              />
              <FaLock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base sm:text-lg" />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 sm:py-3 lg:py-4 rounded-full transition duration-200 text-sm sm:text-base lg:text-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>

            {error && (
              <p className="text-red-500 text-xs sm:text-sm lg:text-base text-center mt-2">
                {error}
              </p>
            )}

            <div className="text-center pt-3 sm:pt-4">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate("/");
                }}
                className="text-blue-400 hover:text-blue-600 text-sm sm:text-base underline transition duration-200"
              >
                Back to Login
              </a>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-green-800 text-sm sm:text-base text-center">
                ✓ Password has been reset successfully!
              </p>
              <p className="text-green-700 text-xs sm:text-sm text-center mt-2">
                Redirecting you to login page...
              </p>
            </div>

            <button
              onClick={() => navigate("/")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 sm:py-3 lg:py-4 rounded-full transition duration-200 text-sm sm:text-base lg:text-lg"
            >
              Go to Login Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;

