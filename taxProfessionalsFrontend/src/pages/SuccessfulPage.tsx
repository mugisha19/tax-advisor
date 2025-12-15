import React from "react";
import { FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function SuccessfulPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-10">
      <div className="bg-white shadow-lg sm:shadow-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 xl:p-10 text-center max-w-xs sm:max-w-sm md:max-w-md w-full">
        <div className="flex justify-center mb-4 sm:mb-5 lg:mb-6">
          <FaCheckCircle className="text-green-500 text-4xl sm:text-5xl lg:text-6xl animate-bounce" />
        </div>

        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 mb-2 sm:mb-3">
          Application Submitted Successfully!
        </h1>
        <p className="text-gray-600 text-sm sm:text-base mb-6 sm:mb-7 lg:mb-8">
          Thank you for submitting your application. We'll review your details
          and get back to you soon.
        </p>

         
        <button
          onClick={() => navigate("/")}
          className="w-full sm:w-auto bg-green-600 text-white py-2 sm:py-2 lg:py-3 px-4 sm:px-6 rounded-full font-semibold hover:bg-green-700 transition duration-200 text-sm sm:text-base"
        >
          Back to Home
        </button> 
      </div>
    </div>
  );
}

export default SuccessfulPage;