import axios from 'axios';

const REST_API_BASE_URL = 'http://localhost:8080/api/documents/tpin'

export const getVerifiedDocuments = (tpin: string | number) => {
    const tpinString = String(tpin);
    
    // Get authentication token from localStorage
    const token = localStorage.getItem('authToken');
    
    console.log('VerifiedDocuments Service: TIN:', tpinString);
    console.log('VerifiedDocuments Service: Token exists:', !!token);
    
    if (!token) {
        console.error('VerifiedDocuments Service: No authentication token found in localStorage');
        return Promise.reject(new Error('Authentication token is missing. Please login again.'));
    }
    
    // Build headers
    const headers: any = {
        'Accept': 'application/json'
    };
    
    // Add Authorization header with Bearer prefix
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    console.log('VerifiedDocuments Service: Request URL:', `${REST_API_BASE_URL}/${tpinString}/verified`);
    
    return axios.get(`${REST_API_BASE_URL}/${tpinString}/verified`, {
        headers: headers
    });
}