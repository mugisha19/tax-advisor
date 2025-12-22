import axios from 'axios';

const REST_API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api/documents`

export const deleteDocument = (documentId: string | number) => {
    const documentIdString = String(documentId);
    
    
    const token = localStorage.getItem('authToken');
    
    if (!token) {
        return Promise.reject(new Error('Authentication token is missing. Please login again.'));
    }
    
    // Build headers
    const headers: any = {
        'Accept': 'application/json'
    };
    
    // Add Authorization header with Bearer prefix
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    return axios.delete(`${REST_API_BASE_URL}/${documentIdString}`, {
        headers: headers
    });
}



