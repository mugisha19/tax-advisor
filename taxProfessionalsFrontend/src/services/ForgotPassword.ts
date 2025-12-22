import axios from "axios";

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth/forgot-password`;

interface ForgotPasswordData {
  tinNumber: string;
}

export const forgotPassword = (tinNumber: string) => {

  // Backend expects a single 'identifier' field (can be TIN or email)
  const requestData = { 
    identifier: tinNumber
  };

  return axios.post(REST_API_BASE_URL, requestData, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

