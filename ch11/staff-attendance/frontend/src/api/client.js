import axios from 'axios'
import { useAuthStore } from '../store/authStore.js'

const client = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

client.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  if (import.meta.env.DEV) {
    console.log(`[api] → ${config.method?.toUpperCase()} ${config.url}`)
  }
  return config
})

let refreshPromise = null

async function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = useAuthStore.getState().refreshToken
    refreshPromise = axios
      .post(`${import.meta.env.VITE_API_BASE_URL}/auth/refresh`, { refreshToken })
      .then((res) => {
        useAuthStore.getState().setTokens(res.data)
        return res.data.accessToken
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

client.interceptors.response.use(
  (res) => {
    if (import.meta.env.DEV) console.log(`[api] ← ${res.config.url}`, res.status)
    return res
  },
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && !original.url.includes('/auth/')) {
      original._retry = true
      try {
        const newToken = await refreshAccessToken()
        original.headers.Authorization = `Bearer ${newToken}`
        return client(original)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  },
)

export default client
