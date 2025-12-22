import axios from "axios";

const BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://10.0.0.65:8080'}/api/auth/login`;

export const adminLogin = (credentials) => {
  return axios.post(BASE_URL, credentials);
};
