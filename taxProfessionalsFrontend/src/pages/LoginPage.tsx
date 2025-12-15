import React, { useState } from "react";
import { FaUser, FaLock } from "react-icons/fa";
import rra from "../imgs/rra.png";
import { useNavigate } from "react-router-dom";
import { login } from "../services/Login";
import { getCurrentUser } from "../services/getCurrentUser";
import { AccountType } from "../types/company";

const LoginPage: React.FC = () => {
  const [tinNumber, setTinNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const tin = tinNumber.trim();
    console.log("LoginPage: Submitting login - TIN:", tin, "Type:", typeof tin);

    try {
      const response = await login(tin, password);
      console.log("LoginPage: Login successful:", response);
      console.log("LoginPage: Response data:", response.data);

      localStorage.setItem("tinNumber", tin);

      const token =
        response.data?.token ||
        response.data?.accessToken ||
        response.data?.jwt ||
        response.data?.access_token ||
        response.data?.data?.token ||
        response.data?.data?.accessToken ||
        response.headers?.authorization ||
        response.headers?.Authorization;

      if (token) {
        const cleanToken = token.startsWith("Bearer ")
          ? token.substring(7)
          : token;
        localStorage.setItem("authToken", cleanToken);
        console.log("LoginPage: Token stored successfully in localStorage");
      } else {
        console.warn("LoginPage: No token found in response.");
      }

      // Check account type and redirect to appropriate dashboard
      try {
        const userResponse = await getCurrentUser();
        const userData = userResponse.data.data;
        
        // Check if this is a company account by checking for tinCompany field
        if (userData.tinCompany) {
          navigate("/company-dashboard");
        } else {
          navigate("/dashboard");
        }
      } catch (err) {
        // If we can't determine account type, default to individual dashboard
        console.error("LoginPage: Error checking account type:", err);
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("LoginPage: Login error:", error);
      console.error("LoginPage: Error response:", error.response);
      setLoading(false);

      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.data) {
        setError(
          typeof error.response.data === "string"
            ? error.response.data
            : JSON.stringify(error.response.data)
        );
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Invalid TIN number or password");
      }
    }
  };

  const handleSignUpClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate("/signup");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg bg-white p-4 sm:p-6 lg:p-8 rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl space-y-4 sm:space-y-5 lg:space-y-6"
      >
        <div className="flex justify-center mb-2 sm:mb-3 lg:mb-4">
          <img
            src={rra}
            alt="RRA Logo"
            className="h-20 sm:h-24 lg:h-28 xl:h-32 object-contain"
          />
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-4 sm:mb-6">
          Login
        </h2>

        <div className="relative">
          <input
            type="text"
            placeholder="Enter your Tin-Number"
            value={tinNumber}
            onChange={(e) => setTinNumber(e.target.value)}
            required
            disabled={loading}
            className="w-full border border-gray-300 rounded-lg py-3 sm:py-3 lg:py-4 px-3 sm:px-4 pl-10 sm:pl-11 lg:pl-12 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base lg:text-lg"
          />
          <FaUser className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base sm:text-lg" />
        </div>

        <div className="relative">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            className="w-full border border-gray-300 rounded-lg py-3 sm:py-3 lg:py-4 px-3 sm:px-4 pl-10 sm:pl-11 lg:pl-12 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm sm:text-base lg:text-lg"
          />
          <FaLock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-base sm:text-lg" />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 sm:py-3 lg:py-4 rounded-full transition duration-200 text-sm sm:text-base lg:text-lg"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <div className="text-center pt-2">
          <a
            href="/forgot-password"
            onClick={(e) => {
              e.preventDefault();
              navigate("/forgot-password");
            }}
            className="text-blue-400 hover:text-blue-600 text-xs sm:text-sm underline transition duration-200"
          >
            Forgot Password?
          </a>
        </div>

        <div className="text-center pt-3 sm:pt-4">
          <p className="text-gray-600 text-sm sm:text-base">
            Don't have an account?{" "}
            <a
              href="/"
              onClick={handleSignUpClick}
              className="text-blue-400 hover:text-blue-600 font-semibold underline transition duration-200 text-sm sm:text-base"
            >
              Sign up here
            </a>
          </p>
        </div>

        {error && (
          <p className="text-red-500 text-xs sm:text-sm lg:text-base text-center mt-2">
            {error}
          </p>
        )}
      </form>
    </div>
  );
};

export default LoginPage;
