import React, { useEffect, useMemo, useState } from 'react';
import { Card, LoadGauge, Badge } from './Common';
import IntelligenceMap from './IntelligenceMap';
import { ZONES, CORRIDORS, generateHeatmap, generateAlerts, getTierColor } from '../data';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { AlertTriangle, Info, Zap, Battery } from 'lucide-react';
import { getAlerts, getOverview, mlRisk } from '../api/evosApi';

export default function OverviewTab() {
  const heatmapData = useMemo(() => generateHeatmap(), []);
  const [alerts, setAlerts] = useState(generateAlerts());
  const [overview, setOverview] = useState({
    cityLoad: 124.5,
    peakReduction: 14.5,
    activeEVs: 1240,
    stressedFeeders: 8
  });
  const [mlRiskAlert, setMlRiskAlert] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadOverview = async () => {
      try {
        const [overviewRes, alertsRes] = await Promise.all([
          getOverview(),
          getAlerts()
        ]);
        if (!mounted) return;
        if (overviewRes?.data) {
          setOverview(overviewRes.data);
        }
        if (alertsRes?.data?.length) {
          setAlerts(alertsRes.data);
        }
      } catch (error) {
        // Keep local synthetic data as fallback.
      }
    };
    loadOverview();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadRisk = async () => {
      try {
        const loadPercent = Math.min(110, Math.max(45, (overview.cityLoad / 140) * 100));
        const res = await mlRisk({
          load_percent: loadPercent,
          temperature: 32.0,
          traffic_index: 0.7,
          feeder_health: 0.72
        });
        if (!mounted) return;
        if (res?.data?.riskLevel) {
          const severity = res.data.riskLevel === 'CRITICAL' ? 'CRITICAL' : res.data.riskLevel === 'HIGH' ? 'WARNING' : 'INFO';
          setMlRiskAlert({
            id: 'ml-risk',
            severity,
            feeder: 'ML-RISK',
            zone: 'Bangalore',
            text: `ML risk model: ${res.data.riskLevel} at ${res.data.loadPercent}% load.`,
            time: 'Just now',
            sessions: Math.round(overview.activeEVs / 100)
          });
        }
      } catch (error) {
        if (mounted) setMlRiskAlert(null);
      }
    };
    loadRisk();
    return () => { mounted = false; };
  }, [overview.cityLoad, overview.activeEVs]);

  const totalLoad = overview.cityLoad; // MW
  const activeSessions = overview.activeEVs;
  const gridHealth = 94;

  return (
    <div className="layout-grid-12 overview-grid page-shell" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      {/* Smart Grid Intelligence Map - Full Width */}
      <div className="span-12">
        <Card title="Bangalore Smart-Grid Intelligence" subtitle="Real-time geospatial load distribution & infrastructure health">
          <IntelligenceMap zones={ZONES} corridors={CORRIDORS} height="480px" />
        </Card>
      </div>

      {/* Top row: KPIs */}
      <Card title="System Total Load" subtitle="Across all 12 BESCOM zones" className="span-3">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
          <span style={{ fontSize: '32px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--cyan-bright)' }}>{totalLoad}</span>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>MW</span>
        </div>
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--emerald)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <TrendingUp size={14} /> +4.2% vs yesterday
        </div>
      </Card>

      <Card title="Active EV Sessions" subtitle="Current charging load" className="span-3">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
          <span style={{ fontSize: '32px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--violet-bright)' }}>{activeSessions}</span>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>Sessions</span>
        </div>
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          Distributed across 42 substations
        </div>
      </Card>

      <Card title="Grid Stability" subtitle="Phase balance & voltage" className="span-3">
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
          <LoadGauge value={gridHealth} label="Health" size={100} />
        </div>
      </Card>

      <Card title="Carbon Impact" subtitle="CO2 Offset" className="span-3">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '12px' }}>
          <span style={{ fontSize: '32px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--emerald)' }}>482</span>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600 }}>kg CO2e</span>
        </div>
        <progress value="75" max="100" style={{ width: '100%', height: '4px', marginTop: '16px', accentColor: 'var(--emerald)' }} />
      </Card>

      {/* Middle row: Zone Distribution & Alerts */}
      <Card title="Zone Demand Distribution" subtitle="Real-time MW by feeder group" className="span-8" style={{ height: '360px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={ZONES} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
            <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={10} axisLine={false} tickLine={false} />
            <YAxis stroke="var(--text-dim)" fontSize={10} axisLine={false} tickLine={false} />
            <Tooltip 
              contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px', fontFamily: 'Inter' }}
              itemStyle={{ color: 'var(--text-primary)' }}
            />
            <Bar dataKey="demand" radius={[4, 4, 0, 0]}>
              {ZONES.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getTierColor(entry.tier)} opacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <Card title="AI Alert Feed" subtitle="Prioritized grid events" className="span-4 cyber-scroll" style={{ height: '360px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {[mlRiskAlert, ...alerts].filter(Boolean).map(alert => (
            <div key={alert.id} className="cyber-button-hover" style={{ 
              padding: '14px', 
              background: alert.severity === 'CRITICAL' ? 'rgba(239,68,68,0.05)' : 'rgba(13,30,53,0.5)',
              borderLeft: `3px solid ${alert.severity === 'CRITICAL' ? 'var(--red-bright)' : alert.severity === 'WARNING' ? 'var(--amber)' : 'var(--cyan-mid)'}`,
              borderRadius: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: 700, color: alert.severity === 'CRITICAL' ? 'var(--red-bright)' : 'var(--text-secondary)' }}>{alert.severity}</span>
                <span style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{alert.time}</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{alert.text}</p>
              <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', gap: '12px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Zap size={10} /> {alert.feeder}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Battery size={10} /> {alert.sessions} sessions</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

    </div>
  );
}

const TrendingUp = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
    <polyline points="17 6 23 6 23 12"></polyline>
  </svg>
);
