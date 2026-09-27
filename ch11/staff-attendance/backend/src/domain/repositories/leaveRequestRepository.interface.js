/**
 * @typedef {import('../entities/LeaveRequest')} LeaveRequestRow
 */

/**
 * @typedef {Object} LeaveRequestRepository
 * @property {(params: {requesterId: string, startDate: string, endDate: string, days: number, reason: string, halfDay?: 'am'|'pm'|null}) => Promise<LeaveRequestRow>} create
 * @property {(id: string) => Promise<LeaveRequestRow|null>} findById
 * @property {(requesterId: string, month: string) => Promise<LeaveRequestRow[]>} listByRequesterId
 * @property {(params: {status?: string, month?: string, userId?: string}) => Promise<LeaveRequestRow[]>} listAll
 * @property {(id: string, params: {status: string, processorId: string, processedAt: string}, client?: import('pg').PoolClient) => Promise<LeaveRequestRow|null>} updateStatusIfPending
 */

module.exports = {};
