import axios from 'axios';

const api = axios.create({
  // Use the environment variable, fallback to local only for dev
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;