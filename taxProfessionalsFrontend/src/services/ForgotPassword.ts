import axios from "axios";

const REST_API_BASE_URL = "http://localhost:8080/api/auth/forgot-password";

interface ForgotPasswordData {
  tinNumber: string;
}

export const forgotPassword = (tinNumber: string) => {
  console.log("ForgotPassword Service: Requesting password reset for:", tinNumber);

  // Backend expects a single 'identifier' field (can be TIN or email)
  const requestData = { 
    identifier: tinNumber
  };
  
  console.log("ForgotPassword Service: Request body:", JSON.stringify(requestData));

  return axios.post(REST_API_BASE_URL, requestData, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

