import axios from "axios";

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/auth/set-password`;

interface ResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export const resetPassword = (data: ResetPasswordData) => {

  return axios.post(REST_API_BASE_URL, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

