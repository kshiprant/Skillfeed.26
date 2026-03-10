import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://skillfeed-26.onrender.com/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skillfeed_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
