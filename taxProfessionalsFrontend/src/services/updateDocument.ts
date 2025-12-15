import axios from 'axios';

const REST_API_BASE_URL = 'http://localhost:8080/api/documents/update'

export const updateDocument = (documentId: string | number, file: File, documentType: string) => {
    const documentIdString = String(documentId);
    
    // Create FormData with file and documentType
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    // Get authentication token from localStorage
    const token = localStorage.getItem('authToken');
    
    console.log('UpdateDocument Service: Document ID:', documentIdString);
    console.log('UpdateDocument Service: Document Type:', documentType);
    console.log('UpdateDocument Service: File Name:', file.name);
    console.log('UpdateDocument Service: Token exists:', !!token);
    
    if (!token) {
        console.error('UpdateDocument Service: No authentication token found in localStorage');
        return Promise.reject(new Error('Authentication token is missing. Please login again.'));
    }
    
    // Build headers
    const headers: any = {
        'Accept': 'application/json'
    };
    
    // Add Authorization header with Bearer prefix
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Replace {docId} placeholder in URL or construct URL properly
    const requestUrl = `${REST_API_BASE_URL}/${documentIdString}`;
    console.log('UpdateDocument Service: Request URL:', requestUrl);
    
    // Note: Don't set Content-Type for multipart/form-data, let browser set it with boundary
    return axios.put(requestUrl, formData, {
        headers: headers
    });
}

