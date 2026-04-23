import axios from 'axios';

/**
 * We use NEXT_PUBLIC_ prefixes so these variables are available 
 * to the browser during the client-side execution.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
});

/**
 * Global Request Interceptor
 * Dynamically retrieves the key from environment variables or 
 * sessionStorage at the moment of the request.
 */
api.interceptors.request.use((config) => {
  // Check ENV first, then fallback to SessionStorage
  const adminKey = process.env.NEXT_PUBLIC_ADMIN_SECRET_KEY || 
                   (typeof window !== 'undefined' ? sessionStorage.getItem('nawemusic_admin_auth') : null);

  if (adminKey) {
    config.headers['X-Admin-Key'] = adminKey;
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
    throw error;
  }
};

export default api;