import axios, { InternalAxiosRequestConfig } from 'axios';
import { useAuth } from '../hooks/use-auth';

/**
 * Konfigurasi API Client menggunakan Axios.
 * Menghubungkan ke API Backend dengan menyertakan access token dan auto-refresh.
 */
export const apiClient = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3001/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Flag untuk mencegah loop tak terbatas jika refresh token juga gagal 401
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 1. Request Interceptor: Menyisipkan Access Token (JWT Bearer) ke Header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuth.getState().accessToken;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// 2. Response Interceptor: Menangani Auto Refresh Token pada status 401 (Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Jika response 401 dan request belum di-retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Jika sedang melakukan refresh, masukkan request ke antrean
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = useAuth.getState().refreshToken;

      if (!refreshToken) {
        useAuth.getState().logout();
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        // Panggil endpoint refresh token secara terpisah (hindari interceptor)
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        );

        const { accessToken: newAccess, refreshToken: newRefresh } = response.data;

        // Perbarui Zustand auth store
        useAuth.getState().setAuth(newAccess, newRefresh);

        // Proses request dalam antrean
        processQueue(null, newAccess);

        // Ulangi request asli
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        isRefreshing = false;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Jika refresh token kedaluwarsa atau gagal, logout user paksa
        processQueue(refreshError, null);
        useAuth.getState().logout();
        isRefreshing = false;
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
