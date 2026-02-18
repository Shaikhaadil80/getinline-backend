const User = require('../models/User');
const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');

// Helper to handle validation errors
const handleValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
};

// @desc    Create a new user (after first Firebase login)
// @route   POST /api/users/create
// @access  Private (Firebase auth)
const createUser = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { name, mobile, address, role = 'customer', organizationId = null } = req.body;
    const uid = req.user.uid; // from Firebase token

    // Check if user already exists
    const existingUser = await User.findOne({ uid });
    if (existingUser) {
      throw new AppError('User already exists', 400);
    }

    // Create new user
    const newUser = new User({
      uid,
      name,
      mobile,
      address,
      role,
      organizationId,
      createdBy: uid,
      updatedBy: uid,
    });

    await newUser.save();

    res.status(201).json({
      success: true,
      data: newUser,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by UID (from token or param)
// @route   GET /api/users/uid/:uid
// @access  Private (Firebase auth)
const getUserByUid = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { uid } = req.params;
    // If requesting own profile, allow; if admin, allow any; else check ownership
    if (req.user.uid !== uid && req.dbUser?.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    const user = await User.findOne({ uid });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile (name, mobile, address)
// @route   PATCH /api/users/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const uid = req.user.uid;
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.mobile) updates.mobile = req.body.mobile;
    if (req.body.address) updates.address = req.body.address;
    updates.updatedBy = uid;

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update FCM token
// @route   PATCH /api/users/fcm-token
// @access  Private
const updateFcmToken = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const uid = req.user.uid;
    const { fcmToken } = req.body;

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: { fcmToken, updatedBy: uid } },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (admin only)
// @route   PATCH /api/users/role
// @access  Private (admin)
const updateUserRole = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    // Check if requester is admin
    if (req.dbUser?.role !== 'admin') {
      throw new AppError('Only admins can change roles', 403);
    }

    const { uid, role } = req.body;

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: { role, updatedBy: req.user.uid } },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user status (admin only)
// @route   PATCH /api/users/status
// @access  Private (admin)
const updateUserStatus = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    if (req.dbUser?.role !== 'admin') {
      throw new AppError('Only admins can change status', 403);
    }

    const { uid, status } = req.body;

    const user = await User.findOneAndUpdate(
      { uid },
      { $set: { status, updatedBy: req.user.uid } },
      { new: true }
    );

    if (!user) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users (admin only, with optional filters)
// @route   GET /api/users
// @access  Private (admin)
const getAllUsers = async (req, res, next) => {
  try {
    if (req.dbUser?.role !== 'admin') {
      throw new AppError('Access denied', 403);
    }

    const { role, status, organizationId, limit = 50, skip = 0 } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (organizationId) filter.organizationId = organizationId;

    const users = await User.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: users,
      pagination: { total, limit, skip },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getUserByUid,
  updateProfile,
  updateFcmToken,
  updateUserRole,
  updateUserStatus,
  getAllUsers,
};