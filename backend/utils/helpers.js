// Seeded random for deterministic data (optional, using Math.random for live feel)
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

function generateDemandCurve(zone) {
  const rng = seededRandom(42 + zone.basePeak);
  return Array.from({ length: 72 }, (_, h) => {
    const hod = h % 24;
    const dayShape = Math.max(0, Math.sin((hod - 6) * Math.PI / 16));
    const evSurge = (hod >= 17 && hod <= 22) ? zone.evGrowth * 0.38 * Math.sin((hod - 17) * Math.PI / 5) : 0;
    const noise = (rng() - 0.5) * 7;
    const predicted = Math.min(105, Math.max(20, zone.basePeak * (0.4 + 0.6 * dayShape) + evSurge + noise));
    const optimized = (hod >= 18 && hod <= 21) ? Math.min(predicted, zone.basePeak * 0.78) : predicted * (hod >= 22 || hod <= 5 ? 1.05 : 1);
    const baseline = predicted * ((hod >= 18 && hod <= 21) ? 1.12 : 1);
    return {
      hour: h, hod,
      predicted: +predicted.toFixed(1),
      baseline: +baseline.toFixed(1),
      optimized: +Math.min(optimized, baseline).toFixed(1),
      upper: +(predicted * 1.09).toFixed(1),
      lower: +(predicted * 0.91).toFixed(1),
      isRisk: predicted > zone.basePeak * 0.85
    };
  });
}

function generateAlerts() {
  return [
    { id:1, severity:'CRITICAL', feeder:'HSR-003', zone:'HSR Layout', text:'Projected peak 9.3 MW at 19:30 — exceeds 8.0 MW rated capacity', time:'in 47 min', sessions: 340 },
    { id:2, severity:'CRITICAL', feeder:'WF-007', zone:'Whitefield', text:'Transformer T4-WF approaching thermal limit. Load: 94% of rated', time:'in 23 min', sessions: 210 },
    { id:3, severity:'WARNING', feeder:'EC-012', zone:'Electronic City', text:'EV charging surge detected — 280 new sessions in last 30 min', time:'in 1 hr', sessions: 280 },
    { id:4, severity:'WARNING', feeder:'MH-004', zone:'Marathahalli', text:'Feeder voltage drop 3.2% — approaching regulation limit', time:'in 1.5 hr', sessions: 180 },
    { id:5, severity:'WARNING', feeder:'KR-009', zone:'Koramangala', text:'Evening ramp rate 2.1 MW/hr exceeds normal pattern by 40%', time:'in 2 hr', sessions: 150 },
    { id:6, severity:'INFO', feeder:'IN-002', zone:'Indiranagar', text:'Scheduled maintenance window approaching — reduce load by 15%', time:'in 3 hr', sessions: 90 },
    { id:7, severity:'INFO', feeder:'JN-005', zone:'Jayanagar', text:'New EV registration cluster detected — monitoring demand impact', time:'active', sessions: 45 },
  ];
}

function generateSiteLocations(zone) {
  const sites = {
    whitefield: [
      { rank:1, name:'ITPL Main Road Junction', score:94, feeder:'WF-007', headroom:'62%', chargers:8, driver:'HIGH DEMAND + AVAILABLE HEADROOM' },
      { rank:2, name:'Prestige Shantiniketan Gate', score:88, feeder:'WF-003', headroom:'55%', chargers:6, driver:'HIGH DWELL TIME + EV DENSITY' },
      { rank:3, name:'Phoenix Marketcity Parking B2', score:82, feeder:'WF-011', headroom:'48%', chargers:6, driver:'COMMERCIAL HUB + GRID ACCESS' },
    ],
    hsr: [
      { rank:1, name:'27th Main Road Hub', score:90, feeder:'HSR-003', headroom:'58%', chargers:8, driver:'EV DENSITY + COVERAGE GAP' },
      { rank:2, name:'Agara Lake Parking', score:85, feeder:'HSR-008', headroom:'65%', chargers:6, driver:'PUBLIC SPACE + HEADROOM' },
      { rank:3, name:'HSR BDA Complex', score:79, feeder:'HSR-001', headroom:'52%', chargers:4, driver:'RESIDENTIAL CLUSTER' },
    ],
  };
  return sites[zone.id] || [
    { rank:1, name:`${zone.name} Main Junction`, score:zone.composite - 2, feeder:`${zone.id.toUpperCase().slice(0,2)}-001`, headroom:'60%', chargers:6, driver:'DEMAND + HEADROOM' },
    { rank:2, name:`${zone.name} Commercial Hub`, score:zone.composite - 8, feeder:`${zone.id.toUpperCase().slice(0,2)}-004`, headroom:'55%', chargers:4, driver:'COMMERCIAL ACCESS' },
    { rank:3, name:`${zone.name} Residential Block`, score:zone.composite - 15, feeder:`${zone.id.toUpperCase().slice(0,2)}-007`, headroom:'68%', chargers:4, driver:'COVERAGE GAP' },
  ];
}

function generateSessionShifts() {
  return [
    { feeder:'HSR-003', zone:'HSR Layout', sessions:142, mw:0.52, window:'23:00–01:00', reduction:'-12.3%', status:'pending' },
    { feeder:'WF-007', zone:'Whitefield', sessions:98, mw:0.38, window:'23:30–02:30', reduction:'-8.7%', status:'implemented' },
    { feeder:'EC-012', zone:'Electronic City', sessions:85, mw:0.31, window:'00:00–03:00', reduction:'-7.2%', status:'implemented' },
    { feeder:'MH-004', zone:'Marathahalli', sessions:52, mw:0.22, window:'01:00–04:00', reduction:'-5.1%', status:'pending' },
    { feeder:'KR-009', zone:'Koramangala', sessions:28, mw:0.11, window:'23:00–02:00', reduction:'-3.8%', status:'hold' },
    { feeder:'IN-002', zone:'Indiranagar', sessions:15, mw:0.06, window:'02:00–05:00', reduction:'-2.1%', status:'pending' },
  ];
}

module.exports = {
  generateDemandCurve,
  generateAlerts,
  generateSiteLocations,
  generateSessionShifts
};
