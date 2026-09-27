import axios from 'axios';
import * as tokenStorage from './tokenStorage';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';

const httpClient = axios.create({ baseURL });

let refreshPromise = null;

function isRefreshRequest(config) {
  return typeof config?.url === 'string' && config.url.includes('/auth/refresh');
}

httpClient.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

httpClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    if (response?.status >= 500) {
      window.dispatchEvent(
        new CustomEvent('server-error', { detail: { message: '일시적인 오류가 발생했습니다' } })
      );
    }

    if (!config || response?.status !== 401 || config._retry || isRefreshRequest(config)) {
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = axios
        .post(`${baseURL}/auth/refresh`, {
          refreshToken: tokenStorage.getRefreshToken(),
        })
        .finally(() => {
          refreshPromise = null;
        });
    }

    try {
      const refreshResponse = await refreshPromise;
      const { accessToken, refreshToken } = refreshResponse.data;
      tokenStorage.setTokens({ accessToken, refreshToken });

      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${accessToken}`;
      config._retry = true;

      return httpClient(config);
    } catch (refreshError) {
      tokenStorage.clearTokens();
      window.dispatchEvent(new Event('auth:logout'));
      return Promise.reject(error);
    }
  }
);

export { httpClient };
export default httpClient;
