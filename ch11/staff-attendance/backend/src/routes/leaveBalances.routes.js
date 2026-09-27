const { Router } = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { requireRole } = require('../middlewares/requireRole');

function createLeaveBalancesRouter({ leaveBalanceController }) {
  const router = Router();
  router.get('/me', authenticate, leaveBalanceController.getMine);
  router.get('/', authenticate, requireRole('manager'), leaveBalanceController.listAll);
  return router;
}

module.exports = { createLeaveBalancesRouter };
