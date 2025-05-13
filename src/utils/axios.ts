import axios from 'axios';
import * as dotenv from 'dotenv';
import { sanitizeObject } from './sanitize';

dotenv.config();

const apiKey = process.env.VITE_API_KEY;
console.log('API Key loaded:', apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : 'No API key found');

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: true
});

// Add request interceptor for sanitization
api.interceptors.request.use(
  config => {
    // Sanitize request data
    if (config.data) {
      config.data = sanitizeObject(config.data);
    }
    if (config.params) {
      config.params = sanitizeObject(config.params);
    }
    return config;
  },
  error => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for sanitization
api.interceptors.response.use(
  response => {
    // Sanitize response data if it's a string or object with strings
    if (typeof response.data === 'string') {
      response.data = sanitizeInput(response.data);
    } else if (typeof response.data === 'object') {
      response.data = sanitizeObject(response.data);
    }
    return response;
  },
  error => {
    if (error.response?.data) {
      error.response.data = sanitizeObject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;