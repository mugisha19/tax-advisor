import axios from 'axios';

const REST_API_BASE_URL = 'http://localhost:8080/api/documents/update-rejected'

export const updateRejectedDocument = (
    documentId: string | number, 
    file: File, 
    documentType: string,
    additionalFields?: Record<string, string>
) => {
    const documentIdString = String(documentId);
    
    // Create FormData with file and documentType
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    
    // Add additional fields if provided (e.g., certificateType, bachelorDegree, etc.)
    if (additionalFields) {
        Object.entries(additionalFields).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });
    }
    
    // Get authentication token from localStorage
    const token = localStorage.getItem('authToken');
    
    console.log('UpdateRejectedDocument Service: Document ID:', documentIdString);
    console.log('UpdateRejectedDocument Service: Document Type:', documentType);
    console.log('UpdateRejectedDocument Service: File Name:', file.name);
    console.log('UpdateRejectedDocument Service: Token exists:', !!token);
    
    if (!token) {
        console.error('UpdateRejectedDocument Service: No authentication token found in localStorage');
        return Promise.reject(new Error('Authentication token is missing. Please login again.'));
    }
    
    // Build headers
    const headers: any = {
        'Accept': 'application/json'
    };
    
    // Add Authorization header with Bearer prefix
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Construct URL with document ID
    const requestUrl = `${REST_API_BASE_URL}/${documentIdString}`;
    console.log('UpdateRejectedDocument Service: Request URL:', requestUrl);
    
    // Note: Don't set Content-Type for multipart/form-data, let browser set it with boundary
    return axios.put(requestUrl, formData, {
        headers: headers
    });
}

