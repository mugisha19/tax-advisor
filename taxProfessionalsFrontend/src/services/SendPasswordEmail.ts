import axios from "axios";

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/email/send-password`;

interface SendPasswordEmailData {
  email: string;
  password: string;
  fullName?: string;
  accountType?: string;
  includeResetLink?: boolean; // Whether to include "Set New Password" link
}

export const sendPasswordEmail = (data: SendPasswordEmailData) => {

  // Always include reset link option
  const emailData = {
    ...data,
    includeResetLink: true, // Always send the reset link option
  };

  return axios.post(REST_API_BASE_URL, emailData, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};

