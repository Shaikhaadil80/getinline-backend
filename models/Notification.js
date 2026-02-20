const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  notificationId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: String, // Firebase UID
    required: true,
    index: true,
  },
  title: {
    type: String,
    required: true,
  },
  body: {
    type: String,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 30 * 24 * 60 * 60, // auto-delete after 30 days if not read? Or handle manually.
  },
  expiresAt: {
    type: Date,
    default: null,
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    default: null,
  },
});

// Index for cleaning up read notifications automatically (TTL)
notificationSchema.index({ read: 1, createdAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);