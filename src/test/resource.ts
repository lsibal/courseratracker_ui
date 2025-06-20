// Get Resource by Service Offering and Resource Type
import * as dotenv from 'dotenv';
import api from '../utils/axios';

dotenv.config();

const activeOnly = true;
const resourceType = "Course"
const serviceOfferingId = "8";

const testApiCall = async () => {
  try {
    console.log('Service Offering API CALL');
    console.log('Making API call...');
    const response = await api.get(`/api/resources?activeOnly=${activeOnly}&resourceType=${resourceType}&serviceOffering=${serviceOfferingId}`);
    console.log('API Headers:', response.config?.headers);
    console.log('Response data:', response.data);
  } catch (error: any) {
    console.error('Request failed:', error.response?.status);
    console.error('Error details:', error.response?.data);
  }
};

testApiCall();