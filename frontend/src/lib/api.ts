import axios from 'axios';

/**
 * We use NEXT_PUBLIC_ prefixes so these variables are available 
 * to the browser during the client-side execution.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const ADMIN_SECRET_KEY = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY;

const api = axios.create({
  baseURL: API_URL,
});

/**
 * Global Request Interceptor
 * This automatically attaches the Admin Secret Key to the headers 
 * if it exists in your environment variables.
 */
api.interceptors.request.use((config) => {
  if (ADMIN_SECRET_KEY) {
    config.headers['X-Admin-Key'] = ADMIN_SECRET_KEY;
  }
  return config;
});

/**
 * Service to verify the JWT token from the "Magic Link"
 * This hits the /auth/verify/{token} endpoint we built in FastAPI.
 */
export const verifyEmailToken = async (token: string) => {
  try {
    const response = await api.get(`/auth/verify/${token}`);
    return response.data;
  } catch (error) {
    // Re-throw to be caught by the UI (invite/page.tsx)
    throw error;
  }
};

export default api;