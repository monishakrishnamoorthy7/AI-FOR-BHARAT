const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  severity: {
    type: String,
    enum: ['CRITICAL', 'WARNING', 'INFO'],
    required: true
  },
  feeder: {
    type: String,
    required: true
  },
  zone: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  time: String,
  sessions: Number
});

module.exports = mongoose.model('Alert', AlertSchema);
