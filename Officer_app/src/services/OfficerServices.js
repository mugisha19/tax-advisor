import axios from "axios";

const BASE_URL = "http://localhost:8080/api/officer";

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

// Get applicants by status
export const getApplicantsByStatus = (status) => {
  const endpoint =
    status === "ALL" ? "/applications" : `/applications?status=${status}`;
  return api.get(endpoint);
};

// Review application (Approve/Reject)
export const reviewApplication = (tpin, status, comment = null, problematicDocumentIds = null) => {
  const requestBody = {
    tpin: tpin,
    status: status, // Must be "APPROVED" or "REJECTED" (exact case)
  };

  // Add rejection reason for rejected applications
  if (status === "REJECTED" && comment) {
    requestBody.rejectionReason = comment;
  }

  // Add problematic document IDs for rejected applications
  if (status === "REJECTED" && problematicDocumentIds && Array.isArray(problematicDocumentIds) && problematicDocumentIds.length > 0) {
    requestBody.problematicDocumentIds = problematicDocumentIds;
  }

  console.log("Sending review request:", requestBody);

  return api.post("/review", requestBody);
};

// Get current officer profile
export const getOfficerProfile = () => {
  return api.get("/profile");
};

// Get all applications reviewed by the current officer
export const getMyReviews = () => {
  return api.get("/my-reviews");
};

// Get all applications reviewed by specific officer
export const getApplicationsReviewedByOfficer = (employeeId) => {
  return api.get(`/applications/reviewed/${employeeId}`);
};

// Get application statistics
export const getApplicationStatistics = () => {
  return api.get("/statistics");
};

// Export applications report (Excel)
export const exportApplicationsExcel = (status) => {
  return api.get(`/export/excel?status=${status}`, {
    responseType: "blob",
  });
};

// Export applications report (PDF)
export const exportApplicationsPdf = (status) => {
  return api.get(`/export/pdf?status=${status}`, {
    responseType: "blob",
  });
};

// Upload certificate PDF to backend
export const uploadCertificate = async (tpin, pdfBlob) => {
  const formData = new FormData();
  formData.append('file', pdfBlob, `certificate_${tpin}.pdf`);
  
  return api.post(`/upload-certificate/${tpin}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default {
  getApplicantsByStatus,
  reviewApplication,
  getOfficerProfile,
  getMyReviews,
  getApplicationsReviewedByOfficer,
  getApplicationStatistics,
  exportApplicationsExcel,
  exportApplicationsPdf,
  uploadCertificate,
};
