const mongoose = require('mongoose');

const notifySchema = new mongoose.Schema({
  notifyId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: String,
    required: true,
    index: true,
  },
  professionalId: {
    type: String,
    required: true,
    index: true,
  },
  organizationId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Ensure a user can subscribe only once per professional
notifySchema.index({ userId: 1, professionalId: 1 }, { unique: true });

module.exports = mongoose.model('Notify', notifySchema);