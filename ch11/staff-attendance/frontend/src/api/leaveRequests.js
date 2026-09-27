import client from './client.js'
export const createLeaveRequest = (payload) => client.post('/leave-requests', payload).then((r) => r.data)
export const getMyLeaveRequests = (month) => client.get('/leave-requests/me', { params: { month } }).then((r) => r.data)
export const getAllLeaveRequests = ({ status, month, userId } = {}) => client.get('/leave-requests', { params: { status, month, userId } }).then((r) => r.data)
export const approveLeaveRequest = (id) => client.patch(`/leave-requests/${id}/approve`).then((r) => r.data)
export const rejectLeaveRequest = (id) => client.patch(`/leave-requests/${id}/reject`).then((r) => r.data)
