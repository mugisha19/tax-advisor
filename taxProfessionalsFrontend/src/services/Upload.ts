import axios from 'axios';

const REST_API_BASE_URL = 'http://localhost:8080/api/documents/upload'

export const uploadDocument = (
    tpin: string | number, 
    file: File, 
    documentType: string,
    additionalFields?: Record<string, string | File>,
    memberTpin?: string | number
) => {
    const tpinString = String(tpin);
    
    // Create FormData with file, tpin, and documentType
    const formData = new FormData();
    formData.append('file', file);
    // Use memberTpin if provided (for company admin), otherwise use logged-in user's tpin
    formData.append('tpin', memberTpin ? String(memberTpin) : tpinString);
    formData.append('documentType', documentType);
    
    // Add additional fields if provided (e.g., bachelorDegree, professionalQualification, etc.)
    if (additionalFields) {
        Object.entries(additionalFields).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });
    }
    
    // Get authentication token from localStorage
    const token = localStorage.getItem('authToken');
    
    console.log('Upload Service: TIN:', tpinString);
    console.log('Upload Service: Member TPIN:', memberTpin);
    console.log('Upload Service: Document Type:', documentType);
    console.log('Upload Service: File Name:', file.name);
    console.log('Upload Service: Token exists:', !!token);
    
    if (!token) {
        console.error('Upload Service: No authentication token found in localStorage');
        return Promise.reject(new Error('Authentication token is missing. Please login again.'));
    }
    
    // Build headers
    const headers: any = {
        'Accept': 'application/json'
    };
    
    // Add Authorization header with Bearer prefix
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    console.log('Upload Service: Request URL:', REST_API_BASE_URL);
    console.log('Upload Service: Headers:', { ...headers, Authorization: headers.Authorization?.substring(0, 20) + '...' });
    
    // Note: Don't set Content-Type for multipart/form-data, let browser set it with boundary
    return axios.post(REST_API_BASE_URL, formData, {
        headers: headers
    });
}

export const uploadAllDocuments = (
    tpin: string | number, 
    files: { file: File, documentType: string, additionalFields?: Record<string, string | File> }[],
    memberTpin?: string | number
) => {
    // Upload each document separately with tpin, documentType, and file
    const uploadPromises = files.map(({ file, documentType, additionalFields }) => 
        uploadDocument(tpin, file, documentType, additionalFields, memberTpin)
    );
    
    // Execute all uploads in parallel
    return Promise.all(uploadPromises);
}