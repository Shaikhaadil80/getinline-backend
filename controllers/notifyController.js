const Notify = require('../models/Notify');
const Professional = require('../models/Professional');
const { validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');

const handleValidationErrors = (req) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new AppError(errors.array()[0].msg, 400);
  }
};

const generateNotifyId = () => {
  return `NOTIFY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// @desc    Subscribe to professional availability notifications
// @route   POST /api/notify/create
// @access  Private
const createNotify = async (req, res, next) => {
  try {
    handleValidationErrors(req);

    const { professionalId, organizationId } = req.body;
    const userId = req.user.uid;

    // Check if professional exists
    const professional = await Professional.findOne({ professionalId });
    if (!professional) {
      throw new AppError('Professional not found', 404);
    }

    // Check if already subscribed (unique index will prevent duplicate, but check for better error)
    const existing = await Notify.findOne({ userId, professionalId });
    if (existing) {
      throw new AppError('Already subscribed to this professional', 400);
    }

    const notifyId = generateNotifyId();
    const notify = new Notify({
      notifyId,
      userId,
      professionalId,
      organizationId,
    });

    await notify.save();

    res.status(201).json({ success: true, notify });
  } catch (error) {
    next(error);
  }
};

// @desc    Unsubscribe from professional notifications
// @route   DELETE /api/notify/:notifyId
// @access  Private
const deleteNotify = async (req, res, next) => {
  try {
    const { notifyId } = req.params;
    const userId = req.user.uid;

    const result = await Notify.deleteOne({ notifyId, userId });
    if (result.deletedCount === 0) {
      throw new AppError('Subscription not found', 404);
    }

    res.json({ success: true, message: 'Unsubscribed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all subscriptions for logged-in user
// @route   GET /api/notify/user
// @access  Private
const getUserNotifies = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const notifies = await Notify.find({ userId });
    res.json({ success: true, notifies });
  } catch (error) {
    next(error);
  }
};

// @desc    Check if user is subscribed to a professional
// @route   GET /api/notify/check
// @access  Private
const checkNotifyExists = async (req, res, next) => {
  try {
    const { professionalId } = req.query;
    const userId = req.user.uid;

    const exists = await Notify.exists({ userId, professionalId });
    res.json({ success: true, subscribed: !!exists });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createNotify,
  deleteNotify,
  getUserNotifies,
  checkNotifyExists,
};