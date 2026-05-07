import React, { useCallback, useEffect, useState } from 'react';
import Header from './components/Header';
import OverviewTab from './components/OverviewTab';
import ForecastTab from './components/ForecastTab';
import SchedulerTab from './components/SchedulerTab';
import SitingTab from './components/SitingTab';
import DigitalTwinTab from './components/DigitalTwinTab';
import CircuitTab from './components/CircuitTab';
import { ensureSocketConnected } from './api/socket';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  const [gridStatus, setGridStatus] = useState('stable');
  const [logEntries, setLogEntries] = useState([
    { type: 'INFO', text: 'Grid Monitoring Station Alpha-1 Online.', time: '10m ago' },
    { type: 'SUCCESS', text: 'VRS decision engine synchronized.', time: '5m ago' }
  ]);

  const addLogEntry = useCallback((entry) => {
    setLogEntries(prev => [entry, ...prev].slice(0, 50));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Simulate occasional grid stress for the status indicator
  useEffect(() => {
    const stressTimer = setInterval(() => {
      setGridStatus(prev => prev === 'stable' ? 'overload' : 'stable');
    }, 10000);
    return () => clearInterval(stressTimer);
  }, []);

  useEffect(() => {
    const socket = ensureSocketConnected();
    const handleTwinUpdate = (payload) => {
      if (payload?.logs?.length) {
        payload.logs.forEach(addLogEntry);
      }
    };
    const handleOverload = (payload) => {
      if (payload?.message) {
        addLogEntry({
          type: payload.severity || 'WARNING',
          text: payload.message,
          time: 'Just now'
        });
      }
    };

    socket.on('digitalTwinUpdate', handleTwinUpdate);
    socket.on('overloadAlert', handleOverload);

    return () => {
      socket.off('digitalTwinUpdate', handleTwinUpdate);
      socket.off('overloadAlert', handleOverload);
    };
  }, [addLogEntry]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <OverviewTab />;
      case 'forecast': return <ForecastTab />;
      case 'scheduler': return <SchedulerTab />;
      case 'siting': return <SitingTab />;
      case 'twin': return <DigitalTwinTab logEntries={logEntries} addLogEntry={addLogEntry} />;
      case 'circuit': return <CircuitTab logEntries={logEntries} addLogEntry={addLogEntry} />;
      default: return <OverviewTab />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Background Grid Pattern */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
        backgroundImage: 'radial-gradient(var(--bg-elevated) 1px, transparent 1px)',
        backgroundSize: '40px 40px', opacity: 0.1, zIndex: -1
      }} />
      
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        currentTime={currentTime} 
        gridStatus={gridStatus} 
      />

      <main className="app-main" style={{ flex: 1, position: 'relative' }}>
        {renderContent()}
      </main>

      {/* Footer / Status Bar */}
      <footer style={{
        height: '28px', background: 'var(--bg-void)', borderTop: '1px solid var(--border-subtle)',
        display: 'flex', alignItems: 'center', padding: '0 24px', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>System Status: <span style={{ color: 'var(--emerald)' }}>OPERATIONAL</span></span>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Data Latency: <span style={{ color: 'var(--cyan-bright)' }}>12ms</span></span>
        </div>
        <div style={{ display: 'flex', gap: '20px' }}>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>VRS: 2.1.0-STABLE</span>
          <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>BESCOM LDC ENCRYPTION: ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}
