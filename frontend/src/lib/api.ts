import axios from 'axios';

/**
 * We use NEXT_PUBLIC_ prefixes so these variables are available 
 * to the browser during the client-side execution.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL
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