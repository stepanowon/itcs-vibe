/**
 * @typedef {import('../entities/LeaveBalance')} LeaveBalanceRow
 */

/**
 * @typedef {Object} LeaveBalanceRepository
 * @property {(userId: string) => Promise<LeaveBalanceRow|null>} findByUserId
 * @property {(params: {userId: string, totalDays: number, usedDays: number}, client?: import('pg').PoolClient) => Promise<LeaveBalanceRow>} create
 * @property {(userId: string, deltaDays: number, client?: import('pg').PoolClient) => Promise<LeaveBalanceRow>} incrementUsedDays
 * @property {(client?: import('pg').PoolClient) => Promise<{user_id: string, hire_date: string, total_days: number, used_days: number}[]>} listAllWithUserHireDate
 * @property {() => Promise<{userId: string, employeeNo: string, name: string, totalDays: number, usedDays: number, remainingDays: number}[]>} listAllWithUser
 * @property {(userId: string, totalDays: number, client?: import('pg').PoolClient) => Promise<LeaveBalanceRow|null>} setTotalDays
 */

module.exports = {};
