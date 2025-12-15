// src/services/getDocuments.ts

import axios from "axios";
import type { ApiResponse, Document } from "../types/document";

const REST_API_BASE_URL = "http://localhost:8080/api/documents/taxprofessional";

export const getAllDocuments = (
  tpin: string | number
): Promise<{ data: ApiResponse<Document[]> }> => {
  const tpinString = String(tpin);

  // Get authentication token from localStorage
  const token = localStorage.getItem("authToken");

  console.log("GetDocuments Service: TIN:", tpinString);
  console.log("GetDocuments Service: Token exists:", !!token);

  if (!token) {
    console.error(
      "GetDocuments Service: No authentication token found in localStorage"
    );
    return Promise.reject(
      new Error("Authentication token is missing. Please login again.")
    );
  }

  // Build headers
  const headers: any = {
    Accept: "application/json",
  };

  // Add Authorization header with Bearer prefix
  headers["Authorization"] = token.startsWith("Bearer ")
    ? token
    : `Bearer ${token}`;

  console.log(
    "GetDocuments Service: Request URL:",
    `${REST_API_BASE_URL}/${tpinString}`
  );

  return axios.get(`${REST_API_BASE_URL}/${tpinString}`, {
    headers: headers,
  });
};
