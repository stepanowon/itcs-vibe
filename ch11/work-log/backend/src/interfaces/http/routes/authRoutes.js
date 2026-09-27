const express = require('express');
const authController = require('../controllers/authController');
const { requireFields } = require('../middlewares/validate');

const router = express.Router();

router.post(
  '/signup',
  requireFields(['email', 'password', 'name', 'department']),
  authController.signup
);

router.post('/login', requireFields(['email', 'password']), authController.login);

router.post('/refresh', requireFields(['refreshToken']), authController.refresh);

router.post('/logout', requireFields(['refreshToken']), authController.logout);

module.exports = router;
