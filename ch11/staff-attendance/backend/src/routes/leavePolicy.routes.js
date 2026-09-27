const { Router } = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { requireRole } = require('../middlewares/requireRole');

function createLeavePolicyRouter({ leavePolicyController }) {
  const router = Router();
  router.get('/', authenticate, requireRole('manager'), leavePolicyController.get);
  router.patch('/', authenticate, requireRole('manager'), leavePolicyController.update);
  return router;
}

module.exports = { createLeavePolicyRouter };
