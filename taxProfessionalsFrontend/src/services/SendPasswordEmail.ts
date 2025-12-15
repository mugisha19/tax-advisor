import axios from "axios";

const REST_API_BASE_URL = "http://localhost:8080/api/email/send-password";

interface SendPasswordEmailData {
  email: string;
  password: string;
  fullName?: string;
  accountType?: string;
  includeResetLink?: boolean; // Whether to include "Set New Password" link
}

export const sendPasswordEmail = (data: SendPasswordEmailData) => {
  console.log("SendPasswordEmail Service: Sending password email");
  console.log("SendPasswordEmail Service: Request data:", JSON.stringify(data, null, 2));

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

