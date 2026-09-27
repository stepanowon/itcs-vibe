const express = require('express');
const workLogController = require('../controllers/workLogController');
const { requireFields } = require('../middlewares/validate');
const authGuard = require('../middlewares/authGuard');

const router = express.Router();

router.use(authGuard);

router.post('/', requireFields(['logDate', 'title', 'content', 'isCompleted']), workLogController.create);
router.get('/', workLogController.list);
router.get('/:id', workLogController.getById);
router.patch('/:id', workLogController.update);
router.delete('/:id', workLogController.remove);

module.exports = router;
