const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  appointmentId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  age: {
    type: Number,
    required: true,
    min: 0,
    max: 150,
  },
  mobileNo: {
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
  organizationId: {
    type: String,
    required: true,
    index: true,
  },
  professionalId: {
    type: String,
    required: true,
    index: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  appointmentExpectedTime: {
    type: String, // e.g., "10:30 AM"
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'cancelled', 'InLine', 'completed'],
    default: 'pending',
    required: true,
  },
  registeredByOrganization: {
    type: Boolean,
    default: false,
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
    type: String, // Firebase UID
    required: true,
  },
  updatedBy: {
    type: String,
    required: true,
  },
});

appointmentSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);