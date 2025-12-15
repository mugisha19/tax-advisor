import axios from "axios";

const BASE_URL = 'http://localhost:8080/api/auth/login';

export const adminLogin = (credentials) => {
  return axios.post(BASE_URL, credentials);
};
