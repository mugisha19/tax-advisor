// src/services/getDocuments.ts

import axios from "axios";
import type { ApiResponse, Document } from "../types/document";

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/documents/taxprofessional`;

export const getAllDocuments = (
  tpin: string | number
): Promise<{ data: ApiResponse<Document[]> }> => {
  const tpinString = String(tpin);

  // Get authentication token from localStorage
  const token = localStorage.getItem("authToken");

  if (!token) {
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

  return axios.get(`${REST_API_BASE_URL}/${tpinString}`, {
    headers: headers,
  });
};
