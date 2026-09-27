/**
 * @typedef {import('../entities/Attendance')} AttendanceRow
 */

/**
 * @typedef {Object} AttendanceRepository
 * @property {(userId: string, workDate: string) => Promise<AttendanceRow|null>} findByUserIdAndWorkDate
 * @property {(userId: string) => Promise<AttendanceRow|null>} findLatestByUserId
 * @property {(params: {userId: string, workDate: string, checkInAt: string}) => Promise<AttendanceRow>} create
 * @property {(id: string, checkOutAt: string) => Promise<AttendanceRow>} updateCheckOut
 * @property {(userId: string, yyyyMm: string) => Promise<AttendanceRow[]>} listByUserIdAndMonth
 * @property {(yyyyMm: string, userId: string) => Promise<AttendanceRow[]>} listByMonth
 */

module.exports = {};
