import axios from "axios";

const REST_API_BASE_URL = 'http://localhost:8080/api/locations/cells'

export const getCell = (sectorId: string | number) => {
    return axios.get(`${REST_API_BASE_URL}/${sectorId}`);
}