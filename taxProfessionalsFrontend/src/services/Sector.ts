import axios from "axios";

const REST_API_BASE_URL = 'http://localhost:8080/api/locations/sectors'

export const getSector = (districtId: string | number) => {
    return axios.get(`${REST_API_BASE_URL}/${districtId}`);
}