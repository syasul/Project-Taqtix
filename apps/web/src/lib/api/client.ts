import { apiClient } from '../api-client';
import { AxiosRequestConfig } from 'axios';

/**
 * Interface standard API envelope response sesuai API_CONTRACT.md.
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

/**
 * Custom Error Class untuk membungkus error response yang terstruktur dari backend.
 */
export class ApiClientError extends Error {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Meng-unwrap data dari Axios Response envelope { success, data } atau melempar ApiClientError.
 */
function unwrapResponse<T>(data: any, status?: number): T {
  if (data && typeof data === 'object') {
    if (data.success === false && data.error) {
      throw new ApiClientError(
        data.error.code || 'UNKNOWN_ERROR',
        data.error.message || 'Terjadi kesalahan pada permintaan Anda',
        status
      );
    }
    if (data.success === true && 'data' in data) {
      return data.data as T;
    }
  }
  return data as T;
}

/**
 * Menangani penangkapan error dari HTTP response axios.
 */
function handleError(error: any): never {
  if (error.response?.data) {
    const errorData = error.response.data;
    if (errorData.error) {
      throw new ApiClientError(
        errorData.error.code || 'API_ERROR',
        errorData.error.message || 'Terjadi kesalahan sistem',
        error.response.status
      );
    }
    if (errorData.message) {
      const msg = Array.isArray(errorData.message)
        ? errorData.message.join(', ')
        : errorData.message;
      throw new ApiClientError('VALIDATION_ERROR', msg, error.response.status);
    }
  }
  throw new ApiClientError(
    'NETWORK_ERROR',
    error.message || 'Gagal terhubung ke server TAQtix',
    error.response?.status
  );
}

/**
 * Standard API Client Wrapper yang otomatis unwrap { success, data }
 * dan melempar ApiClientError terstruktur.
 */
export const client = {
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const res = await apiClient.get<ApiResponse<T>>(url, config);
      return unwrapResponse<T>(res.data, res.status);
    } catch (err: any) {
      if (err instanceof ApiClientError) throw err;
      return handleError(err);
    }
  },

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const res = await apiClient.post<ApiResponse<T>>(url, data, config);
      return unwrapResponse<T>(res.data, res.status);
    } catch (err: any) {
      if (err instanceof ApiClientError) throw err;
      return handleError(err);
    }
  },

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    try {
      const res = await apiClient.patch<ApiResponse<T>>(url, data, config);
      return unwrapResponse<T>(res.data, res.status);
    } catch (err: any) {
      if (err instanceof ApiClientError) throw err;
      return handleError(err);
    }
  },

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const res = await apiClient.delete<ApiResponse<T>>(url, config);
      return unwrapResponse<T>(res.data, res.status);
    } catch (err: any) {
      if (err instanceof ApiClientError) throw err;
      return handleError(err);
    }
  },
};

export default client;
