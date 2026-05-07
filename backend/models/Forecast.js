const mongoose = require('mongoose');

const CurvePointSchema = new mongoose.Schema({
  hour: Number,
  hod: Number,
  predicted: Number,
  baseline: Number,
  optimized: Number,
  upper: Number,
  lower: Number,
  isRisk: Boolean
}, { _id: false });

const ForecastSchema = new mongoose.Schema({
  zoneId: {
    type: String,
    required: true,
    unique: true
  },
  zoneName: {
    type: String,
    required: true
  },
  curve: [CurvePointSchema]
});

module.exports = mongoose.model('Forecast', ForecastSchema);
