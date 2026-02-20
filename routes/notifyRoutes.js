const express = require('express');
const router = express.Router();
const notifyController = require('../controllers/notifyController');
const authMiddleware = require('../middleware/auth');
const { notify } = require('../utils/validation');

// All routes require authentication
router.use(authMiddleware);

router.post('/create', notify.create, notifyController.createNotify);
router.delete('/:notifyId', notify.notifyIdParam, notifyController.deleteNotify);
router.get('/user', notifyController.getUserNotifies);
router.get('/check', notifyController.checkNotifyExists);

module.exports = router;