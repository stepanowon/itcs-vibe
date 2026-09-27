import client from './client.js'
export const getMyLeaveBalance = () => client.get('/leave-balances/me').then((r) => r.data)
export const listLeaveBalances = () => client.get('/leave-balances').then((r) => r.data)
