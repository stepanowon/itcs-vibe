const { Router } = require('express');
const { authenticate } = require('../middlewares/authenticate');
const { requireRole } = require('../middlewares/requireRole');

function createUsersRouter({ userController }) {
  const router = Router();
  router.get('/me', authenticate, userController.getMe);
  router.patch('/me/password', authenticate, userController.changePassword);
  router.post('/', authenticate, requireRole('manager'), userController.createManager);
  router.get('/', authenticate, requireRole('manager'), userController.listUsers);
  return router;
}

module.exports = { createUsersRouter };
