import axios from "axios";

const REST_API_BASE_URL = "http://localhost:8080/api/auth/set-password";

interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export const resetPassword = (data: ResetPasswordData) => {
  console.log("ResetPassword Service: Resetting password with token");

  return axios.post(REST_API_BASE_URL, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

