const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  uid: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'],
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'manager', 'receptionist', 'professional'],
    default: 'customer',
    required: true,
  },
  organizationId: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: String,
    required: true,
    default: 'system', // will be overridden in controller
  },
  updatedBy: {
    type: String,
    required: true,
    default: 'system',
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  remark: {
    type: String,
    default: null,
  },
  fcmToken: {
    type: String,
    default: null,
  },
});

// Update the updatedAt field on save
userSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('User', userSchema);