import axios from "axios";
import type { ApiResponse } from "../types/application";
import type { CompanyMember } from "../types/company";

const REST_API_BASE_URL = "http://localhost:8080/api/companies";

export const getCompanyMembers = (companyId: number | string): Promise<{
  data: ApiResponse<CompanyMember[]>;
}> => {
  const token = localStorage.getItem("authToken");

  console.log("GetCompanyMembers Service: Company ID:", companyId);
  console.log("GetCompanyMembers Service: Token exists:", !!token);

  if (!token) {
    console.error(
      "GetCompanyMembers Service: No authentication token found in localStorage"
    );
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
  console.log("GetCompanyMembers Service: Request URL:", url);

  return axios.get(url, {
    headers: headers,
  });
};

