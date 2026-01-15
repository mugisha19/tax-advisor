import axios from "axios";

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL || 'http://10.0.0.65:8080'}/api/system`;

/**
 * Get system status (public endpoint - works for both authenticated and unauthenticated users)
 */
export const getSystemStatus = () => {
  return axios.get(`${REST_API_BASE_URL}/status`);
};

/**
 * Get system status with admin details (admin only)
 */
export const getAdminSystemStatus = () => {
  const token = localStorage.getItem("token");
  return axios.get(`${REST_API_BASE_URL}/admin/status`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};

/**
 * Lock the system (admin only)
 */
export const lockSystem = (notes = null) => {
  const token = localStorage.getItem("token");
  return axios.post(
    `${REST_API_BASE_URL}/admin/lock`,
    { notes },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

/**
 * Unlock the system (admin only)
 */
export const unlockSystem = (notes = null) => {
  const token = localStorage.getItem("token");
  return axios.post(
    `${REST_API_BASE_URL}/admin/unlock`,
    { notes },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
};

/**
 * Get lock/unlock history (admin only)
 */
export const getLockHistory = () => {
  const token = localStorage.getItem("token");
  return axios.get(`${REST_API_BASE_URL}/admin/history`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
};
