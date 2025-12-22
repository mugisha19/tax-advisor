import axios from 'axios';

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/taxprofessionals/qualifications`

export const getQualifications = (tpin: string | number) => {
    const tpinString = String(tpin);
    
    // Get authentication token from localStorage
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        return Promise.reject(new Error('Authentication token is missing. Please login again.'));
    }
    
    // Build headers
    const headers: any = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    
    // Add Authorization header with Bearer prefix
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // API only supports PUT method
    return axios.put(`${REST_API_BASE_URL}/${tpinString}`, {}, {
        headers: headers
    });
}