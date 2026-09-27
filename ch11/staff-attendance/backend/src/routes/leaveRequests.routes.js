const { Router } = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { requireRole } = require('../middlewares/requireRole');

function createLeaveRequestsRouter({ leaveRequestController }) {
  const router = Router();
  router.post('/', authenticate, leaveRequestController.create);
  router.get('/', authenticate, requireRole('manager'), leaveRequestController.listAll);
  router.get('/me', authenticate, leaveRequestController.listMine);
  router.patch('/:id/approve', authenticate, requireRole('manager'), leaveRequestController.approve);
  router.patch('/:id/reject', authenticate, requireRole('manager'), leaveRequestController.reject);
  return router;
}

module.exports = { createLeaveRequestsRouter };
