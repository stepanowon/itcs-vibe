import client from './client.js'
export const getMe = () => client.get('/users/me').then((r) => r.data)
export const changePassword = (payload) => client.patch('/users/me/password', payload).then((r) => r.data)
export const createManager = (payload) => client.post('/users', payload).then((r) => r.data)
export const listUsers = () => client.get('/users').then((r) => r.data)
