import client from './client.js'
export const checkIn = () => client.post('/attendances/check-in').then((r) => r.data)
export const checkOut = () => client.post('/attendances/check-out').then((r) => r.data)
export const getMyAttendances = (month) => client.get('/attendances/me', { params: { month } }).then((r) => r.data)
export const getAllAttendances = ({ month, userId } = {}) => client.get('/attendances', { params: { month, userId } }).then((r) => r.data)
