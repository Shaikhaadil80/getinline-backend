const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  fromTime: { type: String, required: true }, // e.g., "09:00 AM"
  toTime: { type: String, required: true },   // e.g., "01:00 PM"
}, { _id: false });

const professionalSchema = new mongoose.Schema({
  professionalId: {
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
  profession: {
    type: String,
    required: true,
    trim: true,
  },
  degree: {
    type: String,
    required: true,
    trim: true,
  },
  mobile: {
    type: String,
    required: true,
    trim: true,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit mobile number'],
  },
  status: {
    type: String,
    enum: ['IN', 'OUT'],
    default: 'OUT',
  },
  slots: [timeSlotSchema],
  commonLeaves: [{
    type: String, // e.g., "Sunday", "Monday"
  }],
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
  active: {
    type: Boolean,
    default: true,
  },
  remark: {
    type: String,
    default: null,
  },
  organizationId: {
    type: String,
    required: true,
    index: true,
  },
  isPaidAppointment: {
    type: Boolean,
    default: false,
  },
  appointmentFees: {
    type: Number,
    default: 0,
  },
  minBookAppointmentFees: {
    type: Number,
    default: 0,
  },
  commonMeetingTimeFrame: {
    type: Number,
    default: 15, // minutes
  },
  qrId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  inOutNote: {
    type: String,
    default: null,
  },
});

// Update timestamps on save
professionalSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Professional', professionalSchema);