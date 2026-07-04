import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ??
        error.message ??
        'An unexpected error occurred';
      return Promise.reject(new Error(message));
    }
    return Promise.reject(error);
  },
);
