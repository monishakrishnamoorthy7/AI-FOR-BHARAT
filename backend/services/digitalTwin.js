const { INITIAL_TWIN } = require('../data/mockData');

let twinState = JSON.parse(JSON.stringify(INITIAL_TWIN));

function applyAIDecision(appliances, evSlots, maxKw) {
  const applianceLoad = appliances.filter(a => a.on).reduce((s, a) => s + a.kw, 0);
  let availableKw = maxKw - applianceLoad;
  const result = evSlots.map(ev => ({ ...ev }));
  
  result.forEach(ev => { if (ev.present) { ev.status = 'queued'; ev.kw = 0; } });
  
  const prioritized = [...result].filter(ev => ev.present).sort((a, b) => {
    const aWasCharging = evSlots.find(e => e.id === a.id)?.status === 'charging';
    const bWasCharging = evSlots.find(e => e.id === b.id)?.status === 'charging';
    
    let aEff = a.battery - (aWasCharging ? 5 : 0);
    let bEff = b.battery - (bWasCharging ? 5 : 0);
    
    if (aEff !== bEff) return aEff - bEff;
    return a.id - b.id;
  });
  
  let logs = [];
  
  for (const ev of prioritized) {
    if (availableKw >= 3.3) {
      ev.status = 'charging';
      ev.kw = 3.3;
      availableKw -= 3.3;
    }
  }
  
  const sortedForLogging = [...evSlots].sort((a, b) => b.battery - a.battery);

  sortedForLogging.forEach(oldEv => {
    const newEv = result.find(r => r.id === oldEv.id);
    if (!oldEv.present && newEv.present) {
      logs.push({ type: 'INFO', text: `EV plugged into Bay ${oldEv.id}. Evaluating capacity.`, time: new Date().toISOString() });
    } else if (oldEv.present && !newEv.present) {
      logs.push({ type: 'INFO', text: `EV unplugged from Bay ${oldEv.id}. Re-allocating capacity.`, time: new Date().toISOString() });
    } else if (oldEv.status === 'charging' && newEv.status === 'queued') {
      logs.push({ type: 'WARNING', text: `Transformer capacity limit reached. Paused charging on Bay ${oldEv.id} (${newEv.battery}%).`, time: new Date().toISOString() });
    } else if (oldEv.status === 'queued' && newEv.status === 'charging') {
      logs.push({ type: 'AI_ACTION', text: `Capacity available. Resumed charging on Bay ${oldEv.id} (${newEv.battery}%).`, time: new Date().toISOString() });
    }
  });

  return { nextEVs: result, logs };
}

function processTwinTick() {
  let changed = false;
  let logs = [];
  
  const nextEVsRaw = twinState.evSlots.map(ev => {
    if (ev.status === 'charging' && ev.battery < 100) {
      changed = true;
      return { ...ev, battery: ev.battery + 1 };
    }
    if (ev.battery >= 100 && ev.status === 'charging') {
      changed = true;
      logs.push({ type: 'SUCCESS', text: `Bay ${ev.id} fully charged.`, time: new Date().toISOString() });
      return { ...ev, status: 'queued', kw: 0 };
    }
    return ev;
  });

  if (changed) {
    const aiResult = applyAIDecision(twinState.appliances, nextEVsRaw, twinState.maxCapacity);
    twinState.evSlots = aiResult.nextEVs;
    return [...logs, ...aiResult.logs];
  }
  
  return logs;
}

function getTwinState() {
  return twinState;
}

// Allows the frontend to dispatch actions to the backend twin via REST/Sockets
function updateTwinState(newState) {
  twinState = { ...twinState, ...newState };
  const aiResult = applyAIDecision(twinState.appliances, twinState.evSlots, twinState.maxCapacity);
  twinState.evSlots = aiResult.nextEVs;
  return aiResult.logs;
}

module.exports = {
  getTwinState,
  processTwinTick,
  updateTwinState
};
