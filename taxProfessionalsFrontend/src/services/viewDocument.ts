// src/services/viewDocument.ts

import axios from "axios";

const REST_API_BASE_URL = "http://localhost:8080/api/documents/download";

export const viewDocument = (docId: number): Promise<{ data: Blob }> => {
  // Get authentication token from localStorage
  const token = localStorage.getItem("authToken");

  console.log("ViewDocument Service: Document ID:", docId);
  console.log("ViewDocument Service: Token exists:", !!token);

  if (!token) {
    console.error(
      "ViewDocument Service: No authentication token found in localStorage"
    );
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

  console.log(
    "ViewDocument Service: Request URL:",
    `${REST_API_BASE_URL}/${docId}`
  );

  return axios.get(`${REST_API_BASE_URL}/${docId}`, {
    headers: headers,
    responseType: "blob", // Important for binary file download
  });
};
