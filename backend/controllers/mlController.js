const mlService = require('../services/mlService');

function badRequest(res, message) {
  return res.status(400).json({ success: false, error: message });
}

exports.predict = async (req, res) => {
  if (!req.body || !req.body.zone) {
    return badRequest(res, 'Missing required predict payload.');
  }
  try {
    const data = await mlService.predict(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.optimize = async (req, res) => {
  if (!req.body || typeof req.body.peakLoadMW !== 'number') {
    return badRequest(res, 'Missing required optimize payload.');
  }
  try {
    const data = await mlService.optimize(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.hotspots = async (req, res) => {
  if (!Array.isArray(req.body)) {
    return badRequest(res, 'Hotspots payload must be an array.');
  }
  try {
    const data = await mlService.hotspots(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.risk = async (req, res) => {
  if (!req.body || typeof req.body.load_percent !== 'number') {
    return badRequest(res, 'Missing required risk payload.');
  }
  try {
    const data = await mlService.risk(req.body);
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
