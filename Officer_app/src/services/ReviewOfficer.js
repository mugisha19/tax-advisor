import axios from "axios";

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/admin/officers`;

export const ListApplicants = () => {
  const token = localStorage.getItem("token");

  return axios.get(REST_API_BASE_URL, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

// services/ReviewOfficer.js
export const updateOfficer = (officerId, data) => {
  return axios.put(`${REST_API_BASE_URL}/${officerId}`, data, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};

export const deleteOfficer = (officerId) => {
  return axios.delete(`${REST_API_BASE_URL}/${officerId}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
};
