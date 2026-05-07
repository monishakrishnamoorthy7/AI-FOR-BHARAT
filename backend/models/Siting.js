const mongoose = require('mongoose');

const SitingSchema = new mongoose.Schema({
  zoneId: {
    type: String,
    required: true
  },
  rank: Number,
  name: String,
  score: Number,
  feeder: String,
  headroom: String,
  chargers: Number,
  driver: String
});

module.exports = mongoose.model('Siting', SitingSchema);
