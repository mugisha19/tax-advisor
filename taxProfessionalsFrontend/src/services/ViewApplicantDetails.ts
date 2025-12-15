import axios from 'axios';

const REST_API_BASE_URL = 'http://localhost:8080/api/taxprofessionals/application/tpin'

export const getDetails = (tpin: string | number) => {
    const tpinString = String(tpin);
    
    // Get authentication token from localStorage
    const token = localStorage.getItem('authToken');
    
    // Build headers
    const headers: any = {
        'Accept': 'application/json'
    };
    
    // Add Authorization header if token exists
    if (token) {
        headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }
    
    return axios.get(`${REST_API_BASE_URL}/${tpinString}`, {
        headers: headers
    });
}