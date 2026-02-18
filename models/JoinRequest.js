const mongoose = require('mongoose');

const joinRequestSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: String,  // Firebase UID
    required: true,
    index: true,
  },
  organizationId: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected'],
    default: 'pending',
    required: true,
  },
  requestedRole: {
    type: String,
    enum: ['customer', 'professional', 'receptionist', 'manager', 'admin'],
    default: 'professional', // default role when accepted (can be changed by admin)
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  handledAt: {
    type: Date,
    default: null,
  },
  handledBy: {
    type: String, // Firebase UID of admin who handled
    default: null,
  },
  remark: {
    type: String,
    default: null,
  },
});

module.exports = mongoose.model('JoinRequest', joinRequestSchema);