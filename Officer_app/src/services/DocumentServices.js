import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://10.0.0.65:8080'}/api/documents`;

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Get all documents for a tax professional by TPIN
export const getDocumentsByTpin = (tpin) => {
  // Validate TPIN before making the API call
  if (!tpin || (typeof tpin === 'string' && tpin.trim() === '')) {
    return Promise.reject(new Error('TPIN is required and cannot be empty'));
  }
  return api.get(`/taxprofessional/${tpin}`);
};

// Download a document by document ID
// Using relative URL to go through Vite proxy (avoids CORS issues)
export const downloadDocument = async (documentId) => {
  const token = localStorage.getItem("token");
  // Use relative URL to leverage Vite proxy - this bypasses CORS
  const url = `/api/documents/download/${documentId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.statusText}`);
  }

  const blob = await response.blob();

  // Return in axios-like format for compatibility
  return {
    data: blob,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  };
};

// Verify a document
export const verifyDocument = (documentId) => {
  return api.put(`/verify/${documentId}`);
};

// Get document by ID
export const getDocumentById = (documentId) => {
  return api.get(`/${documentId}`);
};

// Upload document
export const uploadDocument = (tpin, documentType, file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("documentType", documentType);

  return axios.post(`${BASE_URL}/upload/${tpin}`, formData, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
      "Content-Type": "multipart/form-data",
    },
  });
};

// Delete document
export const deleteDocument = (documentId) => {
  return api.delete(`/${documentId}`);
};

export default {
  getDocumentsByTpin,
  downloadDocument,
  verifyDocument,
  getDocumentById,
  uploadDocument,
  deleteDocument,
};
