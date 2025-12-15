// src/services/downloadCertificate.ts

import axios from "axios";

const REST_API_BASE_URL =
  "http://localhost:8080/api/taxprofessionals/certificate";

export const downloadCertificate = (tpin: string): Promise<{ data: Blob }> => {
  const tpinString = String(tpin);

  // Get authentication token from localStorage
  const token = localStorage.getItem("authToken");

  console.log("DownloadCertificate Service: TPIN:", tpinString);
  console.log("DownloadCertificate Service: Token exists:", !!token);

  if (!token) {
    console.error(
      "DownloadCertificate Service: No authentication token found in localStorage"
    );
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

  console.log(
    "DownloadCertificate Service: Request URL:",
    `${REST_API_BASE_URL}/${tpinString}`
  );

  return axios.get(`${REST_API_BASE_URL}/${tpinString}`, {
    headers: headers,
    responseType: "blob", // Important for binary file download
  });
};
