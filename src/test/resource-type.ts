// Resource Type by Service Offering
import * as dotenv from 'dotenv';
import api from '../utils/axios';

dotenv.config();

const serviceOfferingId = "8";
const courseName = "Course"

const testApiCall = async () => {
  try {
    console.log('Service Offering API CALL');
    console.log('Making API call...');
    const response = await api.get(`/api/resource-types?serviceOfferingId=${serviceOfferingId}&name=${courseName}`);
    console.log('API Headers:', response.config?.headers);
    console.log('Response data:', response.data);
  } catch (error: any) {
    console.error('Request failed:', error.response?.status);
    console.error('Error details:', error.response?.data);
  }
};

testApiCall();