const { Router } = require('express');
const { createHealthRouter } = require('./health.routes');
const { createAuthRouter } = require('./auth.routes');
const { createUsersRouter } = require('./users.routes');
const { createAttendancesRouter } = require('./attendances.routes');
const { createLeaveRequestsRouter } = require('./leaveRequests.routes');
const { createLeaveBalancesRouter } = require('./leaveBalances.routes');
const { createLeavePolicyRouter } = require('./leavePolicy.routes');

function createApiRouter({
  healthController,
  authController,
  userController,
  attendanceController,
  leaveRequestController,
  leaveBalanceController,
  leavePolicyController,
}) {
  const router = Router();
  router.use(createHealthRouter(healthController));
  router.use('/auth', createAuthRouter({ authController }));
  router.use('/users', createUsersRouter({ userController }));
  router.use('/attendances', createAttendancesRouter({ attendanceController }));
  router.use('/leave-requests', createLeaveRequestsRouter({ leaveRequestController }));
  router.use('/leave-balances', createLeaveBalancesRouter({ leaveBalanceController }));
  router.use('/leave-policy', createLeavePolicyRouter({ leavePolicyController }));
  return router;
}

module.exports = { createApiRouter };
