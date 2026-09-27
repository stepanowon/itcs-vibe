/**
 * @typedef {Object} LeavePolicyRow
 * @property {number} id
 * @property {number} base_days
 * @property {string} updated_at
 */

/**
 * @typedef {Object} LeavePolicyRepository
 * @property {() => Promise<LeavePolicyRow>} get
 * @property {(baseDays: number, client?: import('pg').PoolClient) => Promise<LeavePolicyRow>} setBaseDays
 */

module.exports = {};
