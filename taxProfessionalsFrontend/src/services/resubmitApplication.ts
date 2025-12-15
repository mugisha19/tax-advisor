import axios from 'axios';

const REST_API_BASE_URL = 'http://localhost:8080/api/applications';

export const resubmitApplication = (tpin: string | number) => {
    const tpinString = String(tpin);
    
    // Get authentication token from localStorage
    const token = localStorage.getItem('authToken');
    
    console.log('ResubmitApplication Service: TPIN:', tpinString);
    console.log('ResubmitApplication Service: Token exists:', !!token);
    
    if (!token) {
        console.error('ResubmitApplication Service: No authentication token found in localStorage');
        return Promise.reject(new Error('Authentication token is missing. Please login again.'));
    }
    
    // Build headers
    const headers: any = {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    };
    
    // Add Authorization header with Bearer prefix
    headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    
    // Construct URL with TPIN
    const requestUrl = `${REST_API_BASE_URL}/${tpinString}/resubmit`;
    console.log('ResubmitApplication Service: Request URL:', requestUrl);
    
    return axios.post(requestUrl, {}, {
        headers: headers
    });
}

