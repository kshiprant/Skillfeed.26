import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  'http://localhost:5000/api';

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn('⚠️ VITE_API_BASE_URL is not defined. Falling back to localhost.');
}

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skillfeed_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;
