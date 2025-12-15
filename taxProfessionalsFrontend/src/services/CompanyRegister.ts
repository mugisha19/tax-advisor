import axios from "axios";
import type { CompanyRegistrationData } from "../types/company";

const REST_API_BASE_URL =
  "http://localhost:8080/api/taxprofessionals/register-company";

export const addCompany = (data: CompanyRegistrationData) => {
  console.log("CompanyRegister Service: Request URL:", REST_API_BASE_URL);
  console.log(
    "CompanyRegister Service: Request data:",
    JSON.stringify(data, null, 2)
  );

  return axios.post(REST_API_BASE_URL, data, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
};
