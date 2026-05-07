const axios = require('axios');

// This is a placeholder wrapper for future FastAPI / ML integration.
// Currently returns mock data if the external API is not configured or fails.
class MLService {
  constructor() {
    this.mlEndpoint = process.env.ML_API_URL || 'http://localhost:8000';
  }

  async predict(payload) {
    return this._post('/predict', payload, {
      zone: payload?.zone || 'Whitefield',
      predictedLoadMW: 8.6,
      overloadRisk: 'MEDIUM',
      confidenceScore: 0.87
    });
  }

  async hotspots(payload) {
    return this._post('/hotspots', payload, {
      results: []
    });
  }

  async optimize(payload) {
    return this._post('/optimize', payload, {
      shiftWindow: '23:00-03:00',
      peakReductionPercent: 18.4,
      sessionsShifted: 420
    });
  }

  async risk(payload) {
    return this._post('/risk', payload, {
      riskLevel: 'MEDIUM',
      loadPercent: payload?.load_percent || 88
    });
  }

  async _post(path, payload, fallback) {
    try {
      const response = await axios.post(`${this.mlEndpoint}${path}`, payload, { timeout: 1500 });
      return response.data;
    } catch (error) {
      return fallback;
    }
  }
}

module.exports = new MLService();
