import axios from "axios";
import type { ApiResponse } from "../types/application";
import type { CompanyMember, AddMemberData } from "../types/company";

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/companies`;

export const addCompanyMember = (
  companyId: number | string,
  memberData: AddMemberData
): Promise<{
  data: ApiResponse<CompanyMember>;
}> => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    return Promise.reject(
      new Error("Authentication token is missing. Please login again.")
    );
  }

  const headers: any = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  headers["Authorization"] = token.startsWith("Bearer ")
    ? token
    : `Bearer ${token}`;

  const url = `${REST_API_BASE_URL}/${companyId}/members`;

  return axios.post(url, memberData, {
    headers: headers,
  });
};

