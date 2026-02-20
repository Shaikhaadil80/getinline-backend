const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  leaveId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  professionalId: {
    type: String,
    required: true,
    index: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  reason: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

leaveSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Leave', leaveSchema);