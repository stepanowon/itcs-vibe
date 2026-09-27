import client from './client.js'
export const getLeavePolicy = () => client.get('/leave-policy').then((r) => r.data)
export const updateLeavePolicy = (baseDays) => client.patch('/leave-policy', { baseDays }).then((r) => r.data)
