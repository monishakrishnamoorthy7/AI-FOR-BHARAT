const { getTwinState, processTwinTick } = require('./digitalTwin');

// Adds some noise/fluctuations to create a "live" feel for the frontend
function generateLiveGridStats() {
  const baseLoad = 1245.2;
  const noise = (Math.random() - 0.5) * 15; // +/- 7.5 MW fluctuation
  return {
    cityLoad: +(baseLoad + noise).toFixed(1),
    peakReduction: +(14.5 + (Math.random() * 0.4 - 0.2)).toFixed(1),
    activeEVs: Math.floor(18450 + (Math.random() * 50 - 25)),
    stressedFeeders: Math.floor(8 + Math.random() * 2)
  };
}

module.exports = {
  generateLiveGridStats
};
