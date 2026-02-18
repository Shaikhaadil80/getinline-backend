const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  organizationId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  organizationName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 100,
  },
  picUrl: {
    type: String,
    default: null,
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
  latlong: {
    type: String,
    default: null,
  },
  qrId: {
    type: String,
    required: true,
    unique: true,
    index: true,
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
  },
  updatedBy: {
    type: String,
    required: true,
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
});

// Update the updatedAt field on save
organizationSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Organization', organizationSchema);