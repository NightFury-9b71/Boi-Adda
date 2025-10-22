import axios from "axios";
import API_ENDPOINTS from "./endpoints";

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Debug API URL in development
if (import.meta.env.DEV) {
  console.log('API Base URL:', API_BASE_URL);
  console.log('Environment:', import.meta.env.MODE);
}

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Handle token and user management
apiClient.interceptors.response.use(
  (response) => {
    // Handle successful login responses
    if (response.config.url?.includes(API_ENDPOINTS.AUTH.LOGIN) && response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    
    // Handle user data responses
    if (response.config.url?.includes(API_ENDPOINTS.AUTH.ME) && response.data) {
      localStorage.setItem('user_data', JSON.stringify(response.data));
    }
    
    return response;
  },
  (error) => {
    // Handle token expiration or invalid token
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_data');
      // You could also trigger a logout event here if needed
    }
    return Promise.reject(error);
  }
);

export default apiClient;