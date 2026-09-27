import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const client = axios.create({ baseURL: '/api' });

client.interceptors.request.use((config) => {
  const { accessToken } = useAuthStore.getState();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const { refreshToken } = useAuthStore.getState();
  if (!refreshToken) throw new Error('no refresh token');
  const { data } = await axios.post('/api/auth/refresh', { refreshToken });
  useAuthStore.getState().setAuth(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export function handleResponseError(error) {
  const originalRequest = error.config;
  const isAuthEndpoint = originalRequest?.url?.includes('/auth/refresh') || originalRequest?.url?.includes('/auth/login');

  if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
    originalRequest._retry = true;
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken()
        .catch((refreshError) => {
          useAuthStore.getState().clearAuth();
          window.location.href = '/login';
          throw refreshError;
        })
        .finally(() => {
          refreshPromise = null;
        });
    }
    return refreshPromise.then((newAccessToken) => {
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return client(originalRequest);
    });
  }
  return Promise.reject(error);
}

client.interceptors.response.use((response) => response, handleResponseError);

export default client;
