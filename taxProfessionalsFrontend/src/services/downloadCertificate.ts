// src/services/downloadCertificate.ts

import axios from "axios";

const REST_API_BASE_URL =
  `${import.meta.env.VITE_API_BASE_URL}/api/taxprofessionals/certificate`;

export const downloadCertificate = (tpin: string): Promise<{ data: Blob }> => {
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
    Accept: "application/pdf",
  };

  // Add Authorization header with Bearer prefix
  headers["Authorization"] = token.startsWith("Bearer ")
    ? token
    : `Bearer ${token}`;

  return axios.get(`${REST_API_BASE_URL}/${tpinString}`, {
    headers: headers,
    responseType: "blob", // Important for binary file download
  });
};
