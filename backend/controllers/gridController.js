const { CORRIDORS, ZONES } = require('../data/mockData'); // Fallback for pure static structures if needed
const { generateSessionShifts } = require('../utils/helpers');
const { getTwinState } = require('../services/digitalTwin');

const Alert = require('../models/Alert');
const Forecast = require('../models/Forecast');
const Siting = require('../models/Siting');
const TwinLog = require('../models/TwinLog');

exports.getOverview = (req, res) => {
  res.json({
    success: true,
    data: {
      cityLoad: 1245.2,
      peakReduction: 14.5,
      activeEVs: 18450,
      stressedFeeders: 8
    }
  });
};

exports.getForecast = async (req, res) => {
  try {
    const forecasts = await Forecast.find();
    res.json({ success: true, data: forecasts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getScheduler = (req, res) => {
  res.json({
    success: true,
    data: {
      shifts: generateSessionShifts()
    }
  });
};

exports.getSiting = async (req, res) => {
  try {
    const zoneId = req.query.zoneId || 'whitefield';
    const sites = await Siting.find({ zoneId });
    res.json({
      success: true,
      data: {
        zones: ZONES,
        corridors: CORRIDORS,
        sites,
        zoneId
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.getDigitalTwin = (req, res) => {
  res.json({
    success: true,
    data: getTwinState()
  });
};

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find();
    res.json({
      success: true,
      data: alerts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
