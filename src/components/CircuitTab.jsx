import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Card, Badge } from './Common';
import { Zap, Shield, Cpu, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';

const CIRCUIT_COLORS = {
  esp32: '#1C1C3A',
  esp32Shield: '#888888',
  relayBase: '#0F1F0F',
  relayActive: '#10B981',
  relayInactive: '#1A2A1A',
  traceBase: 'rgba(0,229,255,0.15)',
  traceActive: 'rgba(0,229,255,0.6)',
  glowCyan: '#00E5FF',
  glowAmber: '#F59E0B',
  glowRed: '#EF4444',
  lcdGreen: '#7FFF00',
  pcbBg: '#060E1C'
};

export default function CircuitTab({ logEntries, addLogEntry }) {
  const [scenario, setScenario] = useState('NORMAL');
  const [load, setLoad] = useState(44);
  const [evStates, setEvStates] = useState([true, true, false, false]); // Charging status for 4 bays
  const [batteryLevels, setBatteryLevels] = useState([42, 68, 25, 88]);
  const [voltage, setVoltage] = useState(229.4);
  const [current, setCurrent] = useState(2.61);
  const [aiActivity, setAiActivity] = useState(false);
  const [overloadPulse, setOverloadPulse] = useState(false);

  const prevLogCount = useRef(logEntries.length);

  // Trigger AI Activity LED blink on log change
  useEffect(() => {
    if (logEntries.length > prevLogCount.current) {
      setAiActivity(true);
      const timer = setTimeout(() => setAiActivity(false), 200);
      prevLogCount.current = logEntries.length;
      return () => clearTimeout(timer);
    }
  }, [logEntries]);

  // Scenario Handlers
  const handleScenario = (type) => {
    setScenario(type);
    if (type === 'NORMAL') {
      setEvStates([true, true, false, false]);
      setLoad(44);
      setCurrent(2.61);
      addLogEntry({ type: 'INFO', text: 'System state: NORMAL. 2 EVs active.', time: 'Just now' });
    } else if (type === 'PEAK_SURGE') {
      runPeakSurgeSequence();
    } else if (type === 'OVERNIGHT') {
      setEvStates([true, true, true, true]);
      setLoad(58);
      setCurrent(3.52);
      addLogEntry({ type: 'SUCCESS', text: 'Overnight optimization: All bays resumed at 3.3kW.', time: 'Just now' });
    }
  };

  const runPeakSurgeSequence = async () => {
    addLogEntry({ type: 'WARNING', text: 'Simulating Peak Surge scenario...', time: 'Just now' });
    
    // Step 1: EVs plug in
    await new Promise(r => setTimeout(r, 500));
    setEvStates([true, true, true, false]);
    setLoad(72);
    setCurrent(4.1);
    
    await new Promise(r => setTimeout(r, 500));
    setEvStates([true, true, true, true]);
    setLoad(97);
    setCurrent(5.8);
    setOverloadPulse(true);
    setTimeout(() => setOverloadPulse(false), 200);
    addLogEntry({ type: 'CRITICAL', text: 'GRID OVERLOAD DETECTED! Load: 97%', time: 'Just now' });

    // Step 2: AI Intervenes
    await new Promise(r => setTimeout(r, 1000));
    setEvStates([true, true, true, false]);
    setLoad(74);
    setCurrent(4.2);
    addLogEntry({ type: 'AI_ACTION', text: 'AI Load Balancer: Paused Bay 4 to protect transformer.', time: 'Just now' });
  };

  // Sensor drift
  useEffect(() => {
    const interval = setInterval(() => {
      setVoltage(229 + (Math.random() * 2 - 1));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (load > 90) return CIRCUIT_COLORS.glowRed;
    if (load > 70) return CIRCUIT_COLORS.glowAmber;
    return CIRCUIT_COLORS.relayActive;
  };

  const status = load > 90 ? 'OVER!' : load > 70 ? 'WARN' : 'SAFE';

  return (
    <div className="circuit-layout" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* LEFT: CIRCUIT CANVAS */}
      <div style={{ background: CIRCUIT_COLORS.pcbBg, position: 'relative', overflow: 'hidden', padding: '24px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Top Strip Local */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', zIndex: 10 }}>
          <div>
            <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '20px', fontWeight: 700, color: 'var(--cyan-bright)', letterSpacing: '0.05em' }}>⚡ EV BAY CONTROLLER — LIVE CIRCUIT</h1>
            <p style={{ fontFamily: 'Inter', fontSize: '11px', color: 'var(--text-dim)', marginTop: '2px' }}>Apartment Block B · Bay 3 · ESP32 IoT Node · AI-Managed</p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {['NORMAL', 'PEAK_SURGE', 'OVERNIGHT'].map(s => (
              <button 
                key={s} 
                onClick={() => handleScenario(s)}
                style={{ 
                  padding: '6px 12px', borderRadius: '4px', border: '1px solid var(--border-subtle)', 
                  background: scenario === s ? 'var(--bg-active)' : 'transparent',
                  color: scenario === s ? 'var(--cyan-bright)' : 'var(--text-secondary)',
                  fontSize: '10px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
          <Badge color={getStatusColor()}>{status}</Badge>
        </div>

        {/* The PCB Canvas Container */}
        <div style={{ 
          flex: 1, position: 'relative', 
          backgroundImage: `linear-gradient(${CIRCUIT_COLORS.traceBase} 1px, transparent 1px), linear-gradient(90deg, ${CIRCUIT_COLORS.traceBase} 1px, transparent 1px)`,
          backgroundSize: '28px 28px',
          border: '1px solid rgba(0,229,255,0.12)',
          borderRadius: '14px'
        }}>
          
          {/* Overload Pulse Overlay */}
          {overloadPulse && <div style={{ position: 'absolute', inset: 0, background: 'rgba(239,68,68,0.1)', zIndex: 100, pointerEvents: 'none' }} />}

          {/* SVG TRACES */}
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 1 }}>
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Traces: ESP32 to Relay (Control) */}
            <Trace path="M 300 200 L 400 200" active={evStates[0] || evStates[1] || evStates[2] || evStates[3]} />
            <Trace path="M 300 220 L 380 220 L 380 280 L 400 280" active={evStates[2] || evStates[3]} />
            
            {/* Traces: Relay to Bays (Power) */}
            {evStates.map((active, i) => (
              <Trace 
                key={i} 
                path={`M ${420 + i*32} 320 L ${420 + i*32} 380 L ${100 + i*160} 380 L ${100 + i*160} 420`} 
                active={active} 
                animate={active}
              />
            ))}

            {/* Traces: ESP32 to others */}
            <Trace path="M 230 180 L 150 180 L 150 120" active={true} animate={true} /> {/* LCD */}
            <Trace path="M 300 160 L 500 160 L 500 120" active={true} /> {/* RGB LED */}
            <Trace path="M 230 250 L 120 250 L 120 280" active={true} animate={true} dur="3s" /> {/* Sensor */}
          </svg>

          {/* COMPONENTS */}
          
          {/* LCD DISPLAY */}
          <Component pos={{ top: '60px', left: '80px' }} label="I2C LCD DISPLAY">
            <div style={{ width: '108px', height: '50px', background: '#001800', border: '2px solid #1A3A1A', borderRadius: '5px', padding: '4px' }}>
              <div style={{ 
                width: '100%', height: '100%', background: '#001200', borderRadius: '2px', padding: '4px',
                fontFamily: 'monospace', fontSize: '8px', color: CIRCUIT_COLORS.lcdGreen,
                backgroundImage: 'repeating-linear-gradient(rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 2px)'
              }}>
                <div>LOAD: {load}% {status}</div>
                <div style={{ marginTop: '2px' }}>AI:ON CH:{evStates.map(s => s ? '█' : '░')}</div>
                <div style={{ display: 'inline-block', width: '4px', height: '8px', background: 'var(--cyan-bright)', animation: 'spinnerRotate 1s infinite step-end', verticalAlign: 'middle' }} />
              </div>
            </div>
          </Component>

          {/* RGB LED */}
          <Component pos={{ top: '60px', right: '80px' }} label="STATUS LED">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '24px', height: '24px', borderRadius: '50%', background: getStatusColor(),
                boxShadow: `0 0 20px ${getStatusColor()}`, position: 'relative',
                animation: load > 90 ? 'pulseRed 0.8s infinite' : load > 70 ? 'pulseAmber 1.5s infinite' : 'none'
              }}>
                <div style={{ position: 'absolute', top: '4px', left: '4px', width: '8px', height: '4px', background: 'white', opacity: 0.3, borderRadius: '50%', transform: 'rotate(-45deg)' }} />
              </div>
              <div style={{ fontSize: '7px', color: 'var(--text-dim)', display: 'flex', gap: '4px' }}>
                <span style={{ color: CIRCUIT_COLORS.relayActive }}>● SAFE</span>
                <span style={{ color: CIRCUIT_COLORS.glowAmber }}>● WARN</span>
                <span style={{ color: CIRCUIT_COLORS.glowRed }}>● OVER</span>
              </div>
            </div>
          </Component>

          {/* ESP32 BRAIN */}
          <Component pos={{ top: '160px', left: '230px' }} label="ESP32 · AI CONTROLLER">
            <div style={{ width: '64px', height: '96px', background: 'linear-gradient(180deg, #1C1C3A 0%, #0F0F28 100%)', border: '1px solid #3A3A6A', borderRadius: '6px', position: 'relative' }}>
              {/* Pins */}
              {Array.from({length: 8}).map((_, i) => (
                <React.Fragment key={i}>
                  <div style={{ position: 'absolute', left: '-5px', top: `${15 + i*10}px`, width: '5px', height: '2px', background: '#888' }} />
                  <div style={{ position: 'absolute', right: '-5px', top: `${15 + i*10}px`, width: '5px', height: '2px', background: '#888' }} />
                </React.Fragment>
              ))}
              {/* Metal Shield */}
              <div style={{ position: 'absolute', top: '10px', left: '10px', right: '10px', height: '25px', background: 'linear-gradient(135deg, #888 0%, #555 100%)', borderRadius: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '8px', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>ESP32</span>
              </div>
              {/* LEDs */}
              <div style={{ position: 'absolute', top: '12px', right: '12px', width: '5px', height: '5px', borderRadius: '50%', background: CIRCUIT_COLORS.glowCyan, boxShadow: `0 0 5px ${CIRCUIT_COLORS.glowCyan}`, animation: 'pulseCyan 2s infinite' }} />
              <div style={{ position: 'absolute', top: '12px', right: '20px', width: '5px', height: '5px', borderRadius: '50%', background: '#A855F7', opacity: aiActivity ? 1 : 0.2 }} />
            </div>
          </Component>

          {/* RELAY MODULE */}
          <Component pos={{ top: '220px', right: '60px' }} label="RELAY MODULE · 4-CH">
            <div style={{ width: '140px', height: '48px', background: '#0F1F0F', border: '1px solid #1A3A1A', borderRadius: '5px', display: 'flex' }}>
              {evStates.map((active, i) => (
                <div key={i} style={{ flex: 1, borderRight: i < 3 ? '1px solid #1A3A1A' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <div style={{ width: '14px', height: '10px', background: '#1A2A1A', border: '1px solid #2A4A2A' }} />
                  <div style={{ 
                    width: '10px', height: '10px', borderRadius: '50%', 
                    background: active ? CIRCUIT_COLORS.relayActive : CIRCUIT_COLORS.relayInactive,
                    boxShadow: active ? `0 0 10px ${CIRCUIT_COLORS.relayActive}` : 'none',
                    transition: 'all 0.3s'
                  }} />
                  <span style={{ fontSize: '7px', color: active ? CIRCUIT_COLORS.relayActive : 'var(--text-dim)' }}>CH{i+1}</span>
                </div>
              ))}
            </div>
          </Component>

          {/* SENSOR */}
          <Component pos={{ top: '280px', left: '100px' }} label="LOAD SENSOR">
            <div style={{ position: 'relative' }}>
              <div style={{ 
                position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)',
                background: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(0,229,255,0.2)',
                fontSize: '9px', color: CIRCUIT_COLORS.glowCyan, whiteSpace: 'nowrap', fontFamily: 'monospace'
              }}>
                {current.toFixed(2)}A {(current * voltage).toFixed(0)}W
              </div>
              <div style={{ width: '44px', height: '28px', background: 'linear-gradient(135deg, #1A2A4A 0%, #0F1A30 100%)', border: '1px solid #2A4A7A', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span style={{ fontSize: '7px', color: 'white', opacity: 0.6 }}>INA219</span>
                <div style={{ position: 'absolute', top: '4px', right: '4px', width: '4px', height: '4px', borderRadius: '50%', background: '#FFD93D', animation: 'pulseAmber 1s infinite' }} />
              </div>
            </div>
          </Component>

          {/* EV BAYS */}
          <div style={{ position: 'absolute', bottom: '40px', left: 0, right: 0, display: 'flex', justifyContent: 'space-around', padding: '0 40px' }}>
            {evStates.map((active, i) => (
              <Component key={i} label={`BAY ${i+1}`} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ 
                    stroke: active ? CIRCUIT_COLORS.glowCyan : CIRCUIT_COLORS.traceBase,
                    strokeWidth: 2, filter: active ? 'drop-shadow(0 0 4px rgba(0,229,255,0.5))' : 'none',
                    animation: active ? 'chargePulse 2s infinite' : 'none',
                    transition: 'all 0.5s'
                  }}>
                    <rect x="4" y="8" width="24" height="18" rx="2" strokeDasharray={active ? "none" : "4 3"} />
                    <circle cx="10" cy="17" r="2" fill="currentColor" />
                    <circle cx="16" cy="17" r="2" fill="currentColor" />
                    <circle cx="22" cy="17" r="2" fill="currentColor" />
                    <circle cx="13" cy="22" r="2" fill="currentColor" />
                    <circle cx="19" cy="22" r="2" fill="currentColor" />
                  </svg>
                  {active && <Zap size={12} color={CIRCUIT_COLORS.glowCyan} style={{ position: 'absolute', top: '-10px', animation: 'fadeIn 0.4s infinite alternate' }} />}
                </div>
                <div style={{ width: '48px', height: '4px', background: 'rgba(0,0,0,0.5)', borderRadius: '2px', marginTop: '12px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${batteryLevels[i]}%`, height: '100%', 
                    background: batteryLevels[i] > 60 ? '#10B981' : batteryLevels[i] > 30 ? '#F59E0B' : '#EF4444',
                    transition: 'width 1s ease-in-out'
                  }} />
                </div>
                <div style={{ fontSize: '8px', color: 'var(--text-secondary)', marginTop: '4px', fontFamily: 'monospace' }}>EV{i+1}: {batteryLevels[i]}%</div>
              </Component>
            ))}
          </div>

        </div>
      </div>

      {/* RIGHT: READOUTS & LOG */}
      <div style={{ background: CIRCUIT_COLORS.pcbBg, padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
        
        {/* Metrics Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <MetricCard title="TOTAL LOAD" value={`${load}%`} sub={`${(load * 0.06).toFixed(1)} kW / 6.0 kW`} color={load > 90 ? 'var(--red-bright)' : load > 70 ? 'var(--amber)' : 'var(--cyan-bright)'} />
          <MetricCard title="ACTIVE CHARGING" value={`${evStates.filter(s => s).length} / 4`} sub="Total Bays Occupied" color="var(--cyan-bright)" dots={evStates} />
          <MetricCard title="VOLTAGE" value={`${voltage.toFixed(1)} V`} sub="Grid Input Stable" color="var(--emerald)" />
          <MetricCard title="CURRENT" value={`${current.toFixed(2)} A`} sub="Live Feed Consumption" color={current > 5 ? 'var(--red-bright)' : 'var(--cyan-bright)'} />
          <MetricCard title="AI STATUS" value={scenario === 'PEAK_SURGE' ? 'PROTECT' : 'STABLE'} sub="Decision Node Active" color="var(--emerald)" />
          <MetricCard title="PEAK REDUCTION" value={scenario === 'PEAK_SURGE' ? '24%' : '0%'} sub="vs Unmanaged Load" color="var(--emerald)" />
        </div>

        {/* AI LOG */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h2 style={{ fontFamily: 'Space Grotesk', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase' }}>IoT NODE EVENT LOG</h2>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', paddingRight: '4px' }}>
            {logEntries.map((log, i) => (
              <div key={i} style={{ 
                padding: '12px', background: 'rgba(13,30,53,0.5)', border: '1px solid var(--border-subtle)', borderRadius: '8px',
                animation: 'slideInTop 0.3s ease-out'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <Badge color={log.type === 'CRITICAL' ? 'var(--red-bright)' : log.type === 'WARNING' ? 'var(--amber)' : log.type === 'AI_ACTION' ? '#A855F7' : 'var(--emerald)'}>{log.type}</Badge>
                  <span style={{ fontSize: '9px', color: 'var(--text-dim)' }}>{log.time}</span>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{log.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Trace({ path, active, animate, dur = "1.5s" }) {
  return (
    <>
      <path d={path} stroke={active ? CIRCUIT_COLORS.traceActive : CIRCUIT_COLORS.traceBase} strokeWidth="1.5" fill="none" strokeLinecap="square" style={{ transition: 'stroke 0.4s' }} />
      {animate && (
        <path d={path} stroke={CIRCUIT_COLORS.glowCyan} strokeWidth="2" fill="none" filter="url(#glow)" strokeDasharray="4 20" strokeDashoffset="0">
          <animate attributeName="stroke-dashoffset" from="24" to="0" dur={dur} repeatCount="indefinite" />
        </path>
      )}
    </>
  );
}

function Component({ children, pos = {}, label, style = {} }) {
  return (
    <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', zIndex: 2, ...pos, ...style }}>
      {children}
      <div style={{ fontFamily: 'JetBrains Mono', fontSize: '8px', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
    </div>
  );
}

function MetricCard({ title, value, sub, color, dots }) {
  return (
    <div style={{ background: 'rgba(13,30,53,0.3)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px' }}>
      <div style={{ fontSize: '9px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>{title}</div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '20px', fontWeight: 700, color, fontFamily: 'JetBrains Mono', animation: 'numberTick 0.3s' }}>{value}</span>
      </div>
      <div style={{ fontSize: '9px', color: 'var(--text-dim)', marginTop: '2px' }}>{sub}</div>
      {dots && (
        <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
          {dots.map((d, i) => <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: d ? CIRCUIT_COLORS.glowCyan : 'rgba(255,255,255,0.1)' }} />)}
        </div>
      )}
    </div>
  );
}
