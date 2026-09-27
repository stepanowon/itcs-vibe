import client from './client.js'
export const signup = (payload) => client.post('/auth/signup', payload).then((r) => r.data)
export const login = (payload) => client.post('/auth/login', payload).then((r) => r.data)
export const refresh = (refreshToken) => client.post('/auth/refresh', { refreshToken }).then((r) => r.data)
export const logout = () => client.post('/auth/logout').then((r) => r.data)
