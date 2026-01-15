import axios from 'axios';

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/system`;

export interface SystemStatus {
  isSystemLocked: boolean;
  lockedAt: string | null;
  lockedByOfficerName: string | null;
  lastUpdatedAt: string | null;
}

export interface SystemStatusResponse {
  success: boolean;
  message: string;
  data: SystemStatus;
}

/**
 * Get system status (public endpoint)
 * Used to check if the system is locked for new registrations/applications
 */
export const getSystemStatus = () => {
  return axios.get<SystemStatusResponse>(`${REST_API_BASE_URL}/status`);
};
