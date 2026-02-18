const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const userValidation = require('../utils/validation');
const { validate } = require('express-validator'); // we'll use validation result in controller

// All routes require authentication
router.use(authMiddleware);

// GET all users (admin only)
router.get('/', userController.getAllUsers);

// GET user by UID
router.get('/uid/:uid', userValidation.uidParam, userController.getUserByUid);

// POST create user (first login)
router.post('/create', userValidation.create, userController.createUser);

// PATCH update profile
router.patch('/profile', userValidation.updateProfile, userController.updateProfile);

// PATCH update FCM token
router.patch('/fcm-token', userValidation.fcmToken, userController.updateFcmToken);

// PATCH update role (admin)
router.patch('/role', userValidation.updateRole, userController.updateUserRole);

// PATCH update status (admin)
router.patch('/status', userValidation.updateStatus, userController.updateUserStatus);

module.exports = router;