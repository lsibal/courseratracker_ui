import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const apiKey = process.env.VITE_API_KEY;
console.log('API Key loaded:', apiKey ? `${apiKey.slice(0, 6)}...${apiKey.slice(-4)}` : 'No API key found');

// const bearerToken = `${apiKey}`;
// console.log('Bearer Token:', bearerToken.slice(0, 13) + '...' + bearerToken.slice(-4));

const api = axios.create({
  baseURL: 'http://hourglass-qa.shieldfoundry.com',
  headers: {
    'Content-Type': 'application/json',
    'X-Api-Key': apiKey
  }
});

export default api;