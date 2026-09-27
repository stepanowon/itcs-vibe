import { authHandlers } from './auth.js'
import { usersHandlers } from './users.js'
import { leaveRequestsHandlers } from './leaveRequests.js'
import { leaveBalancesHandlers } from './leaveBalances.js'
import { leavePolicyHandlers } from './leavePolicy.js'
import { attendancesHandlers } from './attendances.js'
import { passwordsHandlers } from './passwords.js'
export const handlers = [
  ...authHandlers,
  ...usersHandlers,
  ...leaveRequestsHandlers,
  ...leaveBalancesHandlers,
  ...leavePolicyHandlers,
  ...attendancesHandlers,
  ...passwordsHandlers,
]
