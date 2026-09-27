const { Router } = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { requireRole } = require('../middlewares/requireRole');

function createAttendancesRouter({ attendanceController }) {
  const router = Router();
  router.post('/check-in', authenticate, attendanceController.checkIn);
  router.post('/check-out', authenticate, attendanceController.checkOut);
  router.get('/me', authenticate, attendanceController.listMine);
  router.get('/', authenticate, requireRole('manager'), attendanceController.listAll);
  return router;
}

module.exports = { createAttendancesRouter };
