// src/services/viewDocument.ts

import axios from "axios";

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/documents/download`;

export const viewDocument = (docId: number): Promise<{ data: Blob }> => {
  // Get authentication token from localStorage
  const token = localStorage.getItem("authToken");

  if (!token) {
    return Promise.reject(
      new Error("Authentication token is missing. Please login again.")
    );
  }

  // Build headers
  const headers: any = {
    Accept: "application/octet-stream",
  };

  // Add Authorization header with Bearer prefix
  headers["Authorization"] = token.startsWith("Bearer ")
    ? token
    : `Bearer ${token}`;

  return axios.get(`${REST_API_BASE_URL}/${docId}`, {
    headers: headers,
    responseType: "blob", // Important for binary file download
  });
};
