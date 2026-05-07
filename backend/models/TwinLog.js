const mongoose = require('mongoose');

const TwinLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['INFO', 'WARNING', 'CRITICAL', 'AI_ACTION', 'SUCCESS'],
    required: true
  },
  text: {
    type: String,
    required: true
  },
  time: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TwinLog', TwinLogSchema);
