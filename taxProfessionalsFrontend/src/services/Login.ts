import axios from 'axios';

const REST_API_BASE_URL = 'http://localhost:8080/api/auth/login'

export const login = (tin: string | number, password: string) => {
    
    const tinString = String(tin);
    
    return axios.post(REST_API_BASE_URL, {
        username: tinString,
        password: password
    }, {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    });
}