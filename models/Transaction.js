const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  appointmentId: {
    type: String,
    required: true,
    index: true,
  },
  amountPaid: {
    type: Number,
    required: true,
    min: 0,
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'online', 'phonepe', 'card', 'other'],
    required: true,
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  remarks: {
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
  },
});

transactionSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);