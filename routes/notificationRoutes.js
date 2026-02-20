const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

router.get('/user', notificationController.getUserNotifications);
router.patch('/:notificationId/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.delete('/:notificationId', notificationController.deleteNotification);
router.delete('/delete-read', notificationController.deleteReadNotifications);

module.exports = router;