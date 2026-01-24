import axios from 'axios';


const GATEWAY_URL = process.env.NEXT_PUBLIC_API_URL || '';


export const apiCommand = axios.create({
  baseURL: GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


export const apiQuery = axios.create({
  baseURL: GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiCommand;