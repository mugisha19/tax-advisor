import axios from "axios";

const REST_API_BASE_URL =
  `${import.meta.env.VITE_API_BASE_URL}/api/taxprofessionals/signup-type`;

export const determineSignupType = (accountType: string) => {
  console.log("SignupType Service: Determining account type:", accountType);

  return axios.post(
    REST_API_BASE_URL,
    {
      accountType: accountType,
    },
    {
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    }
  );
};
