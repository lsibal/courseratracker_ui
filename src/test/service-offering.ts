// Service Offering
import * as dotenv from 'dotenv';
import api from '../utils/axios';

dotenv.config();

const id = "7";

const testApiCall = async () => {
  try {
    console.log('Service Offering API CALL');
    console.log('Making API call...');
    const response = await api.get(`/api/service-offerings/${id}`);
    console.log('API Headers:', response.config?.headers);
    console.log('Response data:', response.data);
  } catch (error: any) {
    console.error('Request failed:', error.response?.status);
    console.error('Error details:', error.response?.data);
  }
};

testApiCall();