import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://10.0.0.65:8080'}/api/admin/users`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const getAllUsers = (search, type, hasSubmittedDocuments, page, size) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (type) params.append("type", type);
  if (hasSubmittedDocuments !== null && hasSubmittedDocuments !== undefined) 
    params.append("hasSubmittedDocuments", hasSubmittedDocuments);
  params.append("page", page);
  params.append("size", size);
  
  return api.get("", { params });
};

export const getUserById = (id, type) => {
  return api.get(`/${id}?type=${type}`);
};

export const updateUser = (id, type, data) => {
  return api.put(`/${id}?type=${type}`, data);
};

export const resetUserPassword = (id, type) => {
  return api.post(`/${id}/reset-password?type=${type}`);
};

export const deleteUser = (id, type) => {
  return api.delete(`/${id}?type=${type}`);
};

export default {
  getAllUsers,
  getUserById,
  updateUser,
  resetUserPassword,
  deleteUser,
};
