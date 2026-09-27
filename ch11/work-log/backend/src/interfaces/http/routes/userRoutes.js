const express = require('express');
const authGuard = require('../middlewares/authGuard');
const { requireFields } = require('../middlewares/validate');
const userController = require('../controllers/userController');

const router = express.Router();

router.use(authGuard);

router.get('/me', userController.getMe);
router.patch('/me/password', requireFields(['currentPassword', 'newPassword']), userController.changePassword);

module.exports = router;
