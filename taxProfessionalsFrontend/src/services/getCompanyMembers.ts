import axios from "axios";
import type { ApiResponse } from "../types/application";
import type { CompanyMember } from "../types/company";

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/companies`;

export const getCompanyMembers = (companyId: number | string): Promise<{
  data: ApiResponse<CompanyMember[]>;
}> => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    return Promise.reject(
      new Error("Authentication token is missing. Please login again.")
    );
  }

  const headers: any = {
    Accept: "application/json",
  };

  headers["Authorization"] = token.startsWith("Bearer ")
    ? token
    : `Bearer ${token}`;

  // Use companyId directly (could be number or string like tinCompany)
  const url = `${REST_API_BASE_URL}/${companyId}/members`;

  return axios.get(url, {
    headers: headers,
  });
};

