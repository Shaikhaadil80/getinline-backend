const Notification = require('../models/Notification');
const { AppError } = require('../utils/errorHandler');
const { v4: uuidv4 } = require('uuid');

const generateNotificationId = () => {
  return `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
};

// @desc    Get notifications for logged-in user
// @route   GET /api/notifications/user
// @access  Private
const getUserNotifications = async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const { unreadOnly, limit = 50, skip = 0 } = req.query;

    const filter = { userId };
    if (unreadOnly === 'true') filter.read = false;

    const notifications = await Notification.find(filter)
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .sort({ createdAt: -1 });

    const total = await Notification.countDocuments(filter);

    res.json({ success: true, notifications, pagination: { total, limit, skip } });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:notificationId/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.uid;

    const notification = await Notification.findOne({ notificationId, userId });
    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    notification.read = true;
    await notification.save();

    res.json({ success: true, notification });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read for user
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });

    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:notificationId
// @access  Private
const deleteNotification = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.uid;

    const result = await Notification.deleteOne({ notificationId, userId });
    if (result.deletedCount === 0) {
      throw new AppError('Notification not found', 404);
    }

    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete all read notifications for user
// @route   DELETE /api/notifications/delete-read
// @access  Private
const deleteReadNotifications = async (req, res, next) => {
  try {
    const userId = req.user.uid;

    await Notification.deleteMany({ userId, read: true });

    res.json({ success: true, message: 'Read notifications deleted' });
  } catch (error) {
    next(error);
  }
};

// Helper to create an in-app notification (called from other services)
const createNotification = async (userId, title, body, data = {}) => {
  try {
    const notificationId = generateNotificationId();
    const notification = new Notification({
      notificationId,
      userId,
      title,
      body,
      data,
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  createNotification,
};