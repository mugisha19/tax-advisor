import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import rra from "../imgs/rra.png";
import { addCompany } from '../services/CompanyRegister';
import Errors from '../components/Errors';

const CompanyPage: React.FC = () => {
  const [tinCompany, setTinCompany] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errors, setErrors] = useState<any>({});
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    const formErrors: any = {};
    
    if (!tinCompany.trim()) {
      formErrors.tinCompany = "TIN Company is required";
    }

    // Check for authentication token
    const token = localStorage.getItem('authToken');
    if (!token) {
      formErrors.general = "Authentication token is missing. Please login first.";
    }

    // Get user's TIN from localStorage
    const userTin = localStorage.getItem('tinNumber');
    if (!userTin) {
      formErrors.general = "User TIN not found. Please login again.";
    }

    setErrors(formErrors);

    if (Object.keys(formErrors).length === 0) {
      // Prepare data for API - tinCompany and user's TIN
      const companyData = {
        tin: userTin?.trim(), // User's TIN from login
        tinCompany: tinCompany.trim() // Company TIN
      };

      console.log('CompanyPage: Submitting company registration');
      console.log('CompanyPage: User TIN:', userTin);
      console.log('CompanyPage: Company TIN:', tinCompany.trim());
      console.log('CompanyPage: Company data:', JSON.stringify(companyData, null, 2));

      // Call the API
      addCompany(companyData)
        .then((response) => {
          console.log('CompanyPage: Company registration successful:', response);
          console.log('CompanyPage: Response data:', response.data);
          
          // Check if response contains a token
          const token = response.data?.token 
            || response.data?.data?.token
            || response.data?.accessToken
            || response.data?.data?.accessToken;
          
          if (token) {
            // Store the token in localStorage
            const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
            localStorage.setItem('authToken', cleanToken);
            console.log('CompanyPage: Token stored successfully');
          }
          
          setLoading(false);
          alert("Company registration successful!");
          navigate("/dashboard");
        })
        .catch((error) => {
          console.error('CompanyPage: Company registration error:', error);
          console.error('CompanyPage: Error response:', error.response);
          console.error('CompanyPage: Error response data:', error.response?.data);
          
          setLoading(false);
          
          if (error.response?.data) {
            const errorData = error.response.data;
            
            if (errorData.message) {
              setError(errorData.message);
            } else if (typeof errorData === 'string') {
              setError(errorData);
            } else {
              setError(JSON.stringify(errorData));
            }
          } else if (error.message) {
            setError(error.message);
          } else {
            setError("Company registration failed. Please try again.");
          }
        });
    } else {
      setLoading(false);
    }
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
          Apply for Company
        </h2>

        <div className="flex flex-col">
          <label className="text-gray-700 font-medium mb-2">Tin-Company</label>
          <input
            type="text"
            value={tinCompany}
            onChange={(e) => setTinCompany(e.target.value)}
            placeholder="Enter Company TIN"
            className="w-full bg-gray-50 border border-gray-300 rounded-lg py-3 sm:py-4 px-4 sm:px-5 text-sm sm:text-base text-gray-800 focus:ring-2 focus:ring-blue-200 focus:border-blue-200 outline-none"
          />
          <Errors message={errors.tinCompany} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 sm:py-3 lg:py-4 rounded-full transition duration-200 text-sm sm:text-base lg:text-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Applying..." : "Apply"}
        </button>

        {error && (
          <p className="text-red-500 text-xs sm:text-sm lg:text-base text-center mt-2">{error}</p>
        )}

        {errors.general && (
          <p className="text-red-500 text-xs sm:text-sm lg:text-base text-center mt-2">{errors.general}</p>
        )}

        <div className="text-center pt-3 sm:pt-4">
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="text-gray-600 hover:text-gray-800 text-sm sm:text-base transition duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanyPage;

