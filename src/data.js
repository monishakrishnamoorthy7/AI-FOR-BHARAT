// ═══════════════════════════════════════════════════
// EVOS — Synthetic Data Generation
// ═══════════════════════════════════════════════════

export const ZONES = [
  { id:'whitefield', name:'Whitefield', type:'IT', basePeak:88, evGrowth:42, tier:1, demand:87, headroom:71, access:62, coverage:83, composite:91, stations:5, lat: 12.9698, lng: 77.7499, feederHealth: 0.65 },
  { id:'hsr', name:'HSR Layout', type:'Mixed', basePeak:82, evGrowth:38, tier:1, demand:83, headroom:68, access:74, coverage:70, composite:87, stations:4, lat: 12.9121, lng: 77.6446, feederHealth: 0.58 },
  { id:'electronic_city', name:'Electronic City', type:'IT', basePeak:79, evGrowth:35, tier:1, demand:79, headroom:75, access:58, coverage:65, composite:83, stations:4, lat: 12.8452, lng: 77.6633, feederHealth: 0.72 },
  { id:'marathahalli', name:'Marathahalli', type:'Mixed', basePeak:76, evGrowth:33, tier:1, demand:75, headroom:63, access:70, coverage:71, composite:81, stations:3, lat: 12.9569, lng: 77.7011, feederHealth: 0.60 },
  { id:'koramangala', name:'Koramangala', type:'Commercial', basePeak:74, evGrowth:28, tier:2, demand:68, headroom:55, access:88, coverage:42, composite:74, stations:3, lat: 12.9352, lng: 77.6245, feederHealth: 0.85 },
  { id:'indiranagar', name:'Indiranagar', type:'Commercial', basePeak:70, evGrowth:25, tier:2, demand:63, headroom:58, access:82, coverage:38, composite:69, stations:2, lat: 12.9719, lng: 77.6412, feederHealth: 0.88 },
  { id:'btm', name:'BTM Layout', type:'Mixed', basePeak:68, evGrowth:22, tier:2, demand:60, headroom:62, access:65, coverage:55, composite:63, stations:2, lat: 12.9166, lng: 77.6101, feederHealth: 0.82 },
  { id:'jayanagar', name:'Jayanagar', type:'Residential', basePeak:65, evGrowth:18, tier:3, demand:52, headroom:70, access:55, coverage:48, composite:58, stations:1, lat: 12.9250, lng: 77.5898, feederHealth: 0.92 },
  { id:'hebbal', name:'Hebbal', type:'Mixed', basePeak:63, evGrowth:20, tier:3, demand:55, headroom:65, access:50, coverage:52, composite:55, stations:1, lat: 13.0354, lng: 77.5988, feederHealth: 0.89 },
  { id:'yelahanka', name:'Yelahanka', type:'Residential', basePeak:55, evGrowth:15, tier:3, demand:45, headroom:72, access:42, coverage:60, composite:48, stations:1, lat: 13.1007, lng: 77.5963, feederHealth: 0.94 },
  { id:'banashankari', name:'Banashankari', type:'Residential', basePeak:52, evGrowth:12, tier:4, headroom:78, access:45, coverage:35, composite:41, stations:0, lat: 12.9254, lng: 77.5468, feederHealth: 0.96 },
  { id:'jp_nagar', name:'JP Nagar', type:'Residential', basePeak:50, evGrowth:10, tier:4, demand:35, headroom:80, access:40, coverage:30, composite:38, stations:0, lat: 12.9063, lng: 77.5857, feederHealth: 0.95 },
];

// Seeded random for deterministic data
function seededRandom(seed) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646; };
}

export function generateDemandCurve(zone, seed = 42) {
  const rng = seededRandom(seed + zone.basePeak);
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

export function generateHeatmap(seed = 100) {
  const rng = seededRandom(seed);
  return ZONES.map(zone => ({
    ...zone,
    cells: Array.from({ length: 24 }, (_, bucket) => {
      const hod = (bucket % 8) * 3 + 18;
      const normalized = hod % 24;
      const dayShape = Math.max(0, Math.sin((normalized - 6) * Math.PI / 16));
      const evEffect = (normalized >= 17 && normalized <= 21) ? zone.evGrowth * 0.4 : 0;
      const value = Math.min(105, Math.max(15, zone.basePeak * (0.35 + 0.65 * dayShape) + evEffect + (rng() - 0.5) * 8));
      return Math.round(value);
    })
  }));
}

export function generateAlerts() {
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

export function generateRecommendations() {
  return [
    { id:1, zone:'HSR Layout', feeder:'HSR-003', text:'Shift 34% of evening load to 23:00–03:00 window', loadShifted:'1.6 MW', sessions:420, peakReduction:'-18.4%', status:'pending', confidence:87, stressReduction:'4.2 hrs/night',
      shap:[{f:'EV density growth',v:62},{f:'Load history',v:28},{f:'Temperature',v:10}]},
    { id:2, zone:'Whitefield', feeder:'WF-007', text:'Redistribute 28% of IT corridor peak to adjacent feeders', loadShifted:'1.2 MW', sessions:310, peakReduction:'-14.2%', status:'pending', confidence:82, stressReduction:'3.1 hrs/night',
      shap:[{f:'Registration surge',v:55},{f:'Weekday pattern',v:32},{f:'Corridor density',v:13}]},
    { id:3, zone:'Electronic City', feeder:'EC-012', text:'Stagger fleet charging across 22:00–04:00 in 2-hour blocks', loadShifted:'0.9 MW', sessions:185, peakReduction:'-11.8%', status:'implemented', confidence:91, stressReduction:'2.8 hrs/night',
      shap:[{f:'Fleet schedule',v:58},{f:'Grid headroom',v:30},{f:'Night tariff',v:12}]},
  ];
}

export function generateSessionShifts() {
  return [
    { feeder:'HSR-003', zone:'HSR Layout', sessions:142, mw:0.52, window:'23:00–01:00', reduction:'-12.3%', status:'pending' },
    { feeder:'WF-007', zone:'Whitefield', sessions:98, mw:0.38, window:'23:30–02:30', reduction:'-8.7%', status:'implemented' },
    { feeder:'EC-012', zone:'Electronic City', sessions:85, mw:0.31, window:'00:00–03:00', reduction:'-7.2%', status:'implemented' },
    { feeder:'MH-004', zone:'Marathahalli', sessions:52, mw:0.22, window:'01:00–04:00', reduction:'-5.1%', status:'pending' },
    { feeder:'KR-009', zone:'Koramangala', sessions:28, mw:0.11, window:'23:00–02:00', reduction:'-3.8%', status:'hold' },
    { feeder:'IN-002', zone:'Indiranagar', sessions:15, mw:0.06, window:'02:00–05:00', reduction:'-2.1%', status:'pending' },
  ];
}

export const INITIAL_TWIN = {
  appliances: [
    { id:'ac', name:'Air Conditioning', kw:2.2, on:true, color:'#00E5FF' },
    { id:'fridge', name:'Refrigerator', kw:0.3, on:true, color:'#10B981' },
    { id:'washer', name:'Washing Machine', kw:1.8, on:false, color:'#A855F7' },
    { id:'heater', name:'Water Heater', kw:2.0, on:false, color:'#F59E0B' },
  ],
  evSlots: [
    { id:1, battery:22, status:'charging', kw:3.3, present:true },
    { id:2, battery:65, status:'charging', kw:3.3, present:true },
    { id:3, battery:45, status:'queued', kw:0, present:true },
    { id:4, battery:88, status:'queued', kw:0, present:false },
  ],
  maxCapacity: 6.0,
};

export function applyAIDecision(appliances, evSlots, maxKw) {
  const applianceLoad = appliances.filter(a => a.on).reduce((s, a) => s + a.kw, 0);
  let availableKw = maxKw - applianceLoad;
  const result = evSlots.map(ev => ({ ...ev }));
  
  // Reset all to queued if present
  result.forEach(ev => { if (ev.present) { ev.status = 'queued'; ev.kw = 0; } });
  
  // Prioritize lowest battery first with a 5% hysteresis for currently charging EVs
  // This prevents rapid oscillation/spam when two EVs have similar battery levels
  const prioritized = [...result].filter(ev => ev.present).sort((a, b) => {
    const aWasCharging = evSlots.find(e => e.id === a.id)?.status === 'charging';
    const bWasCharging = evSlots.find(e => e.id === b.id)?.status === 'charging';
    
    let aEff = a.battery - (aWasCharging ? 5 : 0);
    let bEff = b.battery - (bWasCharging ? 5 : 0);
    
    if (aEff !== bEff) return aEff - bEff;
    return a.id - b.id; // stable tie breaker
  });
  
  let logs = [];
  
  // Allocate available kW
  for (const ev of prioritized) {
    if (availableKw >= 3.3) {
      ev.status = 'charging';
      ev.kw = 3.3;
      availableKw -= 3.3;
    }
  }
  
  // Generate logs by comparing old and new states
  // Sort by highest battery first so the logs correctly reflect the AI sacrificing the highest battery EVs first
  const sortedForLogging = [...evSlots].sort((a, b) => b.battery - a.battery);

  sortedForLogging.forEach(oldEv => {
    const newEv = result.find(r => r.id === oldEv.id);
    if (!oldEv.present && newEv.present) {
      logs.push({ type: 'INFO', text: `EV plugged into Bay ${oldEv.id}. Evaluating grid capacity.`, time: 'Just now' });
    } else if (oldEv.present && !newEv.present) {
      logs.push({ type: 'INFO', text: `EV unplugged from Bay ${oldEv.id}. Re-allocating capacity.`, time: 'Just now' });
    } else if (oldEv.status === 'charging' && newEv.status === 'queued') {
      logs.push({ type: 'WARNING', text: `Transformer capacity limit reached. Paused charging on Bay ${oldEv.id} (${newEv.battery}%).`, time: 'Just now' });
    } else if (oldEv.status === 'queued' && newEv.status === 'charging') {
      logs.push({ type: 'AI_ACTION', text: `Capacity available. Resumed charging on Bay ${oldEv.id} (${newEv.battery}%).`, time: 'Just now' });
    }
  });

  return { nextEVs: result, logs };
}

export function getTierColor(tier) {
  return tier === 1 ? '#EF4444' : tier === 2 ? '#F59E0B' : tier === 3 ? '#00E5FF' : '#10B981';
}

export function getTierBg(tier) {
  return tier === 1 ? 'rgba(239,68,68,0.15)' : tier === 2 ? 'rgba(245,158,11,0.15)' : tier === 3 ? 'rgba(0,229,255,0.1)' : 'rgba(16,185,129,0.1)';
}

export function getTierBorder(tier) {
  return tier === 1 ? 'rgba(239,68,68,0.3)' : tier === 2 ? 'rgba(245,158,11,0.3)' : tier === 3 ? 'rgba(0,229,255,0.25)' : 'rgba(16,185,129,0.25)';
}

export function generateSiteLocations(zone) {
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

export const SHAP_FEATURES = [
  { name:'EV Registration Growth (6mo)', value:62 },
  { name:'Historical Load Pattern', value:28 },
  { name:'Temperature Forecast (>34°C)', value:10 },
  { name:'Day Type (Weekday)', value:8 },
  { name:'Holiday/Festival Flag', value:-4 },
  { name:'Existing Charging Infra', value:-2 },
];

export const STRESS_PERIODS = [
  { time:'Today 19:30', zone:'HSR Layout', excess:'+1.3 MW', duration:2.5, severity:'critical' },
  { time:'Today 19:00', zone:'Whitefield', excess:'+1.1 MW', duration:3, severity:'critical' },
  { time:'Today 20:00', zone:'Electronic City', excess:'+0.8 MW', duration:2, severity:'warning' },
  { time:'Today 19:30', zone:'Marathahalli', excess:'+0.6 MW', duration:1.5, severity:'warning' },
  { time:'Wed 19:00', zone:'HSR Layout', excess:'+1.4 MW', duration:2.5, severity:'critical' },
  { time:'Wed 19:30', zone:'Whitefield', excess:'+0.9 MW', duration:2, severity:'warning' },
  { time:'Thu 19:00', zone:'Koramangala', excess:'+0.5 MW', duration:1, severity:'warning' },
];

export const CORRIDORS = [
  { 
    zones:['Whitefield','Marathahalli','Electronic City'], 
    stations:5, 
    road:'ITPL Main Road / ORR', 
    timeline:'Q3 2025',
    path: [
      [12.9698, 77.7499], // Whitefield
      [12.9569, 77.7011], // Marathahalli
      [12.8452, 77.6633], // Electronic City
    ]
  },
  { 
    zones:['HSR Layout','Koramangala','BTM Layout'], 
    stations:4, 
    road:'Outer Ring Road South', 
    timeline:'Q4 2025',
    path: [
      [12.9121, 77.6446], // HSR Layout
      [12.9352, 77.6245], // Koramangala
      [12.9166, 77.6101], // BTM Layout
    ]
  },
];
