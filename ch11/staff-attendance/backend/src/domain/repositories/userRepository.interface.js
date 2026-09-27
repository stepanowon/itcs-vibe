/**
 * @typedef {import('../entities/User')} UserRow
 */

/**
 * @typedef {Object} UserRepository
 * @property {(email: string) => Promise<UserRow|null>} findByEmail
 * @property {(employeeNo: string) => Promise<UserRow|null>} findByEmployeeNo
 * @property {(id: string) => Promise<UserRow|null>} findById
 * @property {() => Promise<UserRow[]>} findAll
 * @property {() => Promise<number>} countManagers
 * @property {(params: {email: string, name: string, employeeNo: string, hireDate: string, passwordHash: string, role: string}, client?: import('pg').PoolClient) => Promise<UserRow>} create
 * @property {(id: string, passwordHash: string) => Promise<void>} updatePassword
 * @property {(params: {email: string, name: string, employeeNo: string, hireDate: string, passwordHash: string, initialTotalDays?: number}) => Promise<UserRow>} createWithInitialManagerCheck
 */

module.exports = {};
