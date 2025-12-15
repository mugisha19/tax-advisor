import axios from 'axios';

const REST_API_BASE_URL = 'http://localhost:8080/api/documents'

export const deleteDocument = (documentId: string | number) => {
    const documentIdString = String(documentId);
    
    
    const token = localStorage.getItem('authToken');
    
    console.log('DeleteDocument Service: Document ID:', documentIdString);
    console.log('DeleteDocument Service: Token exists:', !!token);
    
    if (!token) {
        console.error('DeleteDocument Service: No authentication token found in localStorage');
        return Promise.reject(new Error('Authentication token is missing. Please login again.'));
    }
    
    // Build headers
    const headers: any = {
        'Accept': 'application/json'
    };
    
    // Add Authorization header with Bearer prefix
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    console.log('DeleteDocument Service: Request URL:', `${REST_API_BASE_URL}/${documentIdString}`);
    
    return axios.delete(`${REST_API_BASE_URL}/${documentIdString}`, {
        headers: headers
    });
}



