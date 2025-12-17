import axios from "axios";

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/locations/cells`

export const getCell = (sectorId: string | number) => {
    return axios.get(`${REST_API_BASE_URL}/${sectorId}`);
}