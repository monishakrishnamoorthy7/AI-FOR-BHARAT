const { generateLiveGridStats } = require('../services/simulationEngine');
const { processTwinTick, getTwinState, updateTwinState } = require('../services/digitalTwin');
const TwinLog = require('../models/TwinLog');

function setupSockets(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client sends an action to update the Digital Twin (e.g., toggled appliance)
    socket.on('updateTwin', async (newState) => {
      const logs = updateTwinState(newState);
      
      // Persist logs to MongoDB asynchronously
      if (logs.length > 0) {
        TwinLog.insertMany(logs).catch(err => console.error('Error saving TwinLogs:', err));
      }

      // Broadcast the updated state and logs to all clients
      io.emit('digitalTwinUpdate', {
        state: getTwinState(),
        logs: logs
      });
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Global Simulation Loop (runs every 1.5 seconds)
  setInterval(() => {
    // 1. Process EV charging tick
    const logs = processTwinTick();
    const twinState = getTwinState();
    
    // Persist automated AI logs
    if (logs.length > 0) {
      TwinLog.insertMany(logs).catch(err => console.error('Error saving TwinLogs:', err));
    }
    
    // 2. Broadcast Digital Twin updates
    io.emit('digitalTwinUpdate', {
      state: twinState,
      logs: logs
    });

    // 3. Broadcast High-level city stats
    io.emit('liveUpdate', generateLiveGridStats());

    // 4. Check for Emergency Overload
    const totalLoad = twinState.appliances.filter(a => a.on).reduce((s, a) => s + a.kw, 0) 
                    + twinState.evSlots.reduce((s, a) => s + a.kw, 0);
                    
    if (totalLoad > twinState.maxCapacity) {
      io.emit('overloadAlert', {
        severity: 'CRITICAL',
        message: 'TRANSFORMER OVERLOAD: Baseline load exceeds capacity.'
      });
    }

  }, 1500);
}

module.exports = {
  setupSockets
};
