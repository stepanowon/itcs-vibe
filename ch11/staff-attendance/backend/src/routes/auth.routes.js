const { Router } = require('express');
const { authenticate } = require('../middlewares/authenticate');

function createAuthRouter({ authController }) {
  const router = Router();
  router.post('/signup', authController.signup);
  router.post('/login', authController.login);
  router.post('/refresh', authController.refresh);
  router.post('/logout', authenticate, authController.logout);
  return router;
}

module.exports = { createAuthRouter };
