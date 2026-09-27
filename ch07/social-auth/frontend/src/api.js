import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // fetch의 credentials: 'include'에 해당 (세션 쿠키 포함)
});
