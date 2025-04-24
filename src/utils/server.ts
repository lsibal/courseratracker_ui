import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Add withCredentials to handle CORS with credentials
  withCredentials: true
});

// Add request interceptor for debugging
api.interceptors.request.use(
  config => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`, config.data || config.params);
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log(`Response from ${response.config.url}:`, response.status, response.data);
    return response;
  },
  error => {
    console.error('API Error:', error);
    // Log more detailed error information if available
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error setting up request:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;