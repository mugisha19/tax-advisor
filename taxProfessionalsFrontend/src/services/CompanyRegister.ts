import axios from "axios";
import type { CompanyRegistrationData } from "../types/company";

const REST_API_BASE_URL =
  `${import.meta.env.VITE_API_BASE_URL}/api/taxprofessionals/register-company`;

export const addCompany = (data: CompanyRegistrationData) => {
  return axios.post(REST_API_BASE_URL, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};
