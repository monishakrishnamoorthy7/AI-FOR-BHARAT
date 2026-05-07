import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, LoadGauge, Badge } from './Common';
import { INITIAL_TWIN, applyAIDecision } from '../data';
import { Zap, Home, Battery, Power, Info, Plug } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';
import { getDigitalTwin } from '../api/evosApi';
import { ensureSocketConnected } from '../api/socket';

export default function DigitalTwinTab({ logEntries, addLogEntry }) {
  const [twinState, setTwinState] = useState(INITIAL_TWIN);
  const [loadHistory, setLoadHistory] = useState(Array(20).fill({ time: '', load: 0, limit: INITIAL_TWIN.maxCapacity }));
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef(null);

  const applianceLoad = useMemo(() => 
    twinState.appliances.filter(a => a.on).reduce((s, a) => s + a.kw, 0)
  , [twinState.appliances]);

  const evLoad = useMemo(() => 
    twinState.evSlots.reduce((s, a) => s + a.kw, 0)
  , [twinState.evSlots]);

  const totalLoad = applianceLoad + evLoad;
  const isOverload = totalLoad > twinState.maxCapacity;
  const loadPercentage = Math.min(150, (totalLoad / twinState.maxCapacity) * 100);

  useEffect(() => {
    const socket = ensureSocketConnected();
    socketRef.current = socket;

    // If we mount after the socket is already connected, sync state immediately.
    setSocketConnected(socket.connected);

    const handleConnect = () => setSocketConnected(true);
    const handleDisconnect = () => setSocketConnected(false);
    const handleUpdate = (payload) => {
      if (payload?.state) {
        setTwinState(payload.state);
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('digitalTwinUpdate', handleUpdate);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('digitalTwinUpdate', handleUpdate);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadTwin = async () => {
      try {
        const res = await getDigitalTwin();
        if (!mounted) return;
        if (res?.data) {
          setTwinState(res.data);
        }
      } catch (error) {
        // Keep local synthetic data as fallback.
      }
    };
    loadTwin();
    return () => { mounted = false; };
  }, []);

  const applyLocalAI = (nextAppliances, nextEVsRaw, maxCap, suppressLogs = false) => {
    const { nextEVs, logs } = applyAIDecision(nextAppliances, nextEVsRaw, maxCap);
    if (!suppressLogs) {
      logs.forEach(log => addLogEntry(log));
    }
    return nextEVs;
  };

  const emitTwinUpdate = (nextState) => {
    const socket = socketRef.current;
    if (socket && socket.connected) {
      socket.emit('updateTwin', {
        appliances: nextState.appliances,
        evSlots: nextState.evSlots,
        maxCapacity: nextState.maxCapacity
      });
    }
  };

  const toggleAppliance = (id) => {
    setTwinState(prev => {
      const nextAppliances = prev.appliances.map(a => 
        a.id === id ? { ...a, on: !a.on } : a
      );
      if (socketConnected) {
        const nextState = { ...prev, appliances: nextAppliances };
        emitTwinUpdate(nextState);
        return nextState;
      }
      const nextEVs = applyLocalAI(nextAppliances, prev.evSlots, prev.maxCapacity);
      return { ...prev, appliances: nextAppliances, evSlots: nextEVs };
    });
  };

  const togglePlug = (id) => {
    setTwinState(prev => {
      const nextEVsRaw = prev.evSlots.map(ev => 
        ev.id === id ? { ...ev, present: !ev.present, status: !ev.present ? 'queued' : 'empty', kw: 0 } : ev
      );
      if (socketConnected) {
        const nextState = { ...prev, evSlots: nextEVsRaw };
        emitTwinUpdate(nextState);
        return nextState;
      }
      const nextEVs = applyLocalAI(prev.appliances, nextEVsRaw, prev.maxCapacity);
      return { ...prev, evSlots: nextEVs };
    });
  };

  const changeBattery = (id, newBat) => {
    setTwinState(prev => {
      const nextEVsRaw = prev.evSlots.map(ev => 
        ev.id === id ? { ...ev, battery: parseInt(newBat) } : ev
      );
      if (socketConnected) {
        const nextState = { ...prev, evSlots: nextEVsRaw };
        emitTwinUpdate(nextState);
        return nextState;
      }
      // Suppress logs during drag to prevent spam/stale percentages in the log stream
      const nextEVs = applyLocalAI(prev.appliances, nextEVsRaw, prev.maxCapacity, true);
      return { ...prev, evSlots: nextEVs };
    });
  };

  const commitBatteryChange = () => {
    setTwinState(prev => {
      if (socketConnected) {
        emitTwinUpdate(prev);
        return prev;
      }
      // Force a re-evaluation WITH logs now that the user has released the slider
      const { nextEVs, logs } = applyAIDecision(prev.appliances, prev.evSlots, prev.maxCapacity);
      logs.forEach(log => addLogEntry(log));
      return { ...prev, evSlots: nextEVs };
    });
  };

  // Simulation Loop
  useEffect(() => {
    if (socketConnected) return;
    const timer = setInterval(() => {
      setTwinState(prev => {
        let changed = false;
        const nextEVsRaw = prev.evSlots.map(ev => {
          if (ev.status === 'charging' && ev.battery < 100) {
            changed = true;
            return { ...ev, battery: ev.battery + 1 };
          }
          if (ev.battery >= 100 && ev.status === 'charging') {
            changed = true;
            addLogEntry({ type: 'SUCCESS', text: `Bay ${ev.id} fully charged.`, time: 'Just now' });
            return { ...ev, status: 'queued', kw: 0 };
          }
          return ev;
        });

        if (changed) {
          const nextEVs = applyLocalAI(prev.appliances, nextEVsRaw, prev.maxCapacity);
          return { ...prev, evSlots: nextEVs };
        }
        return prev;
      });

    }, 1000);
    return () => clearInterval(timer);
  }, [socketConnected]);

  // Chart update loop
  useEffect(() => {
    setLoadHistory(prev => {
      const newHist = [...prev.slice(1), { time: new Date().toISOString(), load: totalLoad, limit: twinState.maxCapacity }];
      return newHist;
    });
  }, [totalLoad, twinState.maxCapacity]);

  // Initial pass
  useEffect(() => {
    setTwinState(prev => {
      const nextEVs = applyLocalAI(prev.appliances, prev.evSlots, prev.maxCapacity);
      return { ...prev, evSlots: nextEVs };
    });
    // eslint-disable-next-line
  }, []);

  return (
    <div className="layout-col page-shell" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      <div className="layout-grid-12">
        
        {/* Left: Interactive Sim */}
        <div className="span-8 layout-col">
          <div className={isOverload ? "overload-container" : ""} style={{ borderRadius: '16px', transition: 'all 0.3s' }}>
            <Card title="Apartment Complex Simulator" subtitle="Interactive load balancing Digital Twin — BLR Residency Phase 1">
              <div className="twin-sim-grid" style={{ marginTop: '16px' }}>
                
                {/* Home Appliances */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Home size={18} color="var(--cyan-bright)" />
                    <span style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>Household Load</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {twinState.appliances.map(app => (
                      <button
                        key={app.id}
                        className="cyber-button-hover"
                        onClick={() => toggleAppliance(app.id)}
                        style={{
                          padding: '12px',
                          background: app.on ? 'var(--bg-hover)' : 'transparent',
                          border: `1px solid ${app.on ? app.color : 'var(--border-subtle)'}`,
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: app.on ? app.color : 'var(--text-dim)' }} />
                          <span style={{ fontSize: '13px', color: app.on ? 'var(--text-primary)' : 'var(--text-secondary)' }}>{app.name}</span>
                        </div>
                        <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: app.on ? app.color : 'var(--text-dim)' }}>{app.kw} kW</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* EV Charging Bays */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <Battery size={18} color="var(--violet-bright)" />
                    <span style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>Interactive Bays</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {twinState.evSlots.map(ev => (
                      <div key={ev.id} style={{ 
                        padding: '12px', 
                        background: ev.present ? 'rgba(13,30,53,0.8)' : 'rgba(13,30,53,0.2)', 
                        border: `1px solid ${ev.status === 'charging' ? 'var(--violet-bright)' : 'var(--border-subtle)'}`, 
                        borderRadius: '8px',
                        transition: 'all 0.3s'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Bay {ev.id}</div>
                          <button 
                            className="cyber-button-hover"
                            onClick={() => togglePlug(ev.id)}
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: ev.present ? 'var(--emerald)' : 'var(--text-dim)' }}
                          >
                            <Plug size={14} />
                          </button>
                        </div>
                        
                        <div style={{ fontSize: '14px', fontWeight: 700, color: ev.status === 'charging' ? 'var(--violet-bright)' : 'var(--text-primary)' }}>
                          {!ev.present ? 'EMPTY' : ev.status === 'charging' ? 'CHARGING' : 'QUEUED'}
                        </div>
                        
                        {ev.present && (
                          <div style={{ marginTop: '12px' }}>
                            <input 
                              type="range" 
                              min="0" max="100" 
                              value={ev.battery} 
                              onChange={(e) => changeBattery(ev.id, e.target.value)}
                              onMouseUp={commitBatteryChange}
                              onTouchEnd={commitBatteryChange}
                              className="cyber-slider"
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                              <span>{ev.battery}% SoC</span>
                              <span style={{ color: ev.status === 'charging' ? 'var(--violet-bright)' : 'var(--text-dim)' }}>
                                {ev.status === 'charging' ? '+3.3 kW' : '0.0 kW'}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </Card>
          </div>
        </div>

        {/* Right: Grid Impact */}
        <div className="span-4 layout-col">
          <div className={isOverload ? "overload-container" : ""} style={{ borderRadius: '16px', transition: 'all 0.3s' }}>
            <Card title="Simulated Complex Load" subtitle="Real-time balancing metrics">
              <div className={isOverload ? "overload-gauge" : ""} style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
                <LoadGauge value={Math.round(loadPercentage)} label="Capacity" size={160} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Current Demand</span>
                  <span style={{ fontWeight: 700, color: isOverload ? 'var(--red-bright)' : 'var(--cyan-bright)', fontFamily: 'JetBrains Mono' }}>{totalLoad.toFixed(1)} kW</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Grid Limit</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono' }}>{twinState.maxCapacity.toFixed(1)} kW</span>
                </div>
                
                {/* Live Area Chart */}
                <div style={{ height: '60px', marginTop: '8px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={loadHistory} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isOverload ? "var(--red-bright)" : "var(--cyan-bright)"} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={isOverload ? "var(--red-bright)" : "var(--cyan-bright)"} stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <YAxis domain={[0, twinState.maxCapacity * 1.5]} hide />
                      <Area type="monotone" dataKey="limit" stroke="var(--text-dim)" strokeDasharray="3 3" fill="none" />
                      <Area 
                        type="step" 
                        dataKey="load" 
                        stroke={isOverload ? "var(--red-bright)" : "var(--cyan-bright)"} 
                        fillOpacity={1} 
                        fill="url(#colorLoad)" 
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '4px 0' }} />
                <div style={{ 
                  padding: '12px', 
                  background: isOverload ? 'rgba(239,68,68,0.1)' : 'rgba(0,229,255,0.05)', 
                  borderRadius: '8px', 
                  border: `1px solid ${isOverload ? 'rgba(239,68,68,0.3)' : 'rgba(0,229,255,0.1)'}`,
                  transition: 'all 0.3s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Power size={14} color={isOverload ? "var(--red-bright)" : "var(--cyan-bright)"} />
                    <span style={{ fontSize: '11px', fontWeight: 700, color: isOverload ? 'var(--red-bright)' : 'var(--cyan-bright)', textTransform: 'uppercase' }}>
                      {isOverload ? 'EMERGENCY OVERLOAD DETECTED' : 'AI Load Balancer Active'}
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {isOverload 
                      ? 'WARNING: Baseline household appliance load exceeds transformer capacity. EVs disabled.'
                      : 'EV charging is dynamically throttled to prevent transformer overload while household demand is prioritized.'}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <Card title="IoT NODE EVENT LOG" subtitle="Real-time AI decisions">
            <div className="cyber-scroll" style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginTop: '12px' }}>
              {logEntries.map((log, i) => (
                <div key={i} style={{ 
                  padding: '12px', background: 'rgba(13,30,53,0.5)', border: '1px solid var(--border-subtle)', borderRadius: '6px',
                  animation: 'slideInTop 0.3s ease-out'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                    <Badge color={log.type === 'CRITICAL' ? 'var(--red-bright)' : log.type === 'WARNING' ? 'var(--amber)' : log.type === 'AI_ACTION' ? '#A855F7' : 'var(--emerald)'}>{log.type}</Badge>
                    <span style={{ fontSize: '8px', color: 'var(--text-dim)' }}>{log.time}</span>
                  </div>
                  <p style={{ fontSize: '10px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{log.text}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
