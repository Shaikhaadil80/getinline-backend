const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const {user} = require('../utils/validation');
const { validate } = require('express-validator'); // we'll use validation result in controller

// All routes require authentication
router.use(authMiddleware);

// GET all users (admin only)
router.get('/', userController.getAllUsers);

// GET user by UID
router.get('/uid/:uid', user.uidParam, userController.getUserByUid);

router.patch('/role/:uid', user.updateRole, userController.updateUserRoleByUid);

// POST create user (first login)
router.post('/create', user.create, userController.createUser);

// PATCH update profile
router.patch('/profile', user.updateProfile, userController.updateProfile);

// PATCH update FCM token
router.patch('/fcm-token', user.fcmToken, userController.updateFcmToken);

// PATCH update role (admin)
router.patch('/role', user.updateRole, userController.updateUserRole);

// PATCH update status (admin)
router.patch('/status', user.updateStatus, userController.updateUserStatus);

module.exports = router;