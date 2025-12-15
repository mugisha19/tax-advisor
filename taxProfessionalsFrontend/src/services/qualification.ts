import axios from 'axios';

const REST_API_BASE_URL = 'http://localhost:8080/api/taxprofessionals/qualifications'

export const getQualifications = (tpin: string | number) => {
    const tpinString = String(tpin);
    
    // Get authentication token from localStorage
    const token = localStorage.getItem('authToken');
    
    console.log('Qualification Service: TIN:', tpinString);
    console.log('Qualification Service: Token exists:', !!token);
    console.log('Qualification Service: Token value:', token ? token.substring(0, 20) + '...' : 'null');
    
    if (!token) {
        console.error('Qualification Service: No authentication token found in localStorage');
        return Promise.reject(new Error('Authentication token is missing. Please login again.'));
    }
    
    // Build headers
    const headers: any = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    
    // Add Authorization header with Bearer prefix
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    console.log('Qualification Service: Request URL:', `${REST_API_BASE_URL}/${tpinString}`);
    console.log('Qualification Service: Headers:', { ...headers, Authorization: headers.Authorization?.substring(0, 20) + '...' });
    
    // API only supports PUT method
    return axios.put(`${REST_API_BASE_URL}/${tpinString}`, {}, {
        headers: headers
    });
}