const mongoose = require('mongoose');

const professionalStatusHistorySchema = new mongoose.Schema({
  professionalId: {
    type: String,
    required: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['IN', 'OUT'],
    required: true,
  },
  note: {
    type: String,
    default: null,
  },
  changedBy: {
    type: String, // Firebase UID
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ProfessionalStatusHistory', professionalStatusHistorySchema);