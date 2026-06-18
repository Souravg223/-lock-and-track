import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Use relative path so Next.js rewrites handle proxy to backend (avoids CORS)
// next.config.ts rewrites /api/* -> http://localhost:8080/api/*
export const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    // 403 means the account is blocked by admin — force logout
    if (error.response?.status === 403) {
      const msg = error.response?.data?.message || 'Your account has been blocked.';
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined') {
        alert(msg);
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

