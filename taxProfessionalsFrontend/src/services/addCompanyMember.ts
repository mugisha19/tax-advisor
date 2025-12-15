import axios from "axios";
import type { ApiResponse } from "../types/application";
import type { CompanyMember, AddMemberData } from "../types/company";

const REST_API_BASE_URL = "http://localhost:8080/api/companies";

export const addCompanyMember = (
  companyId: number | string,
  memberData: AddMemberData
): Promise<{
  data: ApiResponse<CompanyMember>;
}> => {
  const token = localStorage.getItem("authToken");

  console.log("AddCompanyMember Service: Company ID:", companyId);
  console.log(
    "AddCompanyMember Service: Member data:",
    JSON.stringify(memberData, null, 2)
  );
  console.log("AddCompanyMember Service: Token exists:", !!token);

  if (!token) {
    console.error(
      "AddCompanyMember Service: No authentication token found in localStorage"
    );
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
  console.log("AddCompanyMember Service: Request URL:", url);

  return axios.post(url, memberData, {
    headers: headers,
  });
};

