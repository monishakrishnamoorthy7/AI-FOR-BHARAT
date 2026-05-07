import React, { useEffect, useMemo, useState } from 'react';
import { Card, Badge } from './Common';
import { ZONES, generateDemandCurve } from '../data';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, ShieldAlert, Cpu } from 'lucide-react';
import { getForecasts, mlPredict } from '../api/evosApi';

export default function ForecastTab() {
  const [zones, setZones] = useState(ZONES);
  const [selectedZone, setSelectedZone] = useState(ZONES[0]);
  const [mlPrediction, setMlPrediction] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadForecasts = async () => {
      try {
        const res = await getForecasts();
        const curvesByZone = new Map((res?.data || []).map((f) => [f.zoneId, f.curve]));
        const nextZones = ZONES.map((zone) => ({
          ...zone,
          curve: curvesByZone.get(zone.id)
        }));
        if (!mounted) return;
        setZones(nextZones);
        setSelectedZone((prev) => nextZones.find((z) => z.id === prev.id) || nextZones[0]);
      } catch (error) {
        // Keep local synthetic data as fallback.
      }
    };
    loadForecasts();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadPrediction = async () => {
      try {
        const now = new Date();
        const hour = now.getHours();
        const day = now.getDay();
        const payload = buildPredictPayload(selectedZone, hour, day);
        const res = await mlPredict(payload);
        if (!mounted) return;
        if (res?.data?.predictedLoadMW) {
          setMlPrediction(res.data);
        }
      } catch (error) {
        if (mounted) setMlPrediction(null);
      }
    };
    loadPrediction();
    return () => { mounted = false; };
  }, [selectedZone]);

  const forecastData = useMemo(() => {
    if (selectedZone?.curve?.length) {
      return selectedZone.curve;
    }
    return generateDemandCurve(selectedZone);
  }, [selectedZone]);

  const riskHours = forecastData.filter(d => d.predicted > selectedZone.basePeak * 0.85).length;
  const predictedPeak = mlPrediction?.predictedLoadMW || Math.max(...forecastData.map(d => d.predicted));
  const peakSubtitle = mlPrediction?.overloadRisk ? `ML risk: ${mlPrediction.overloadRisk}` : 'Expected at 19:45 Today';

  return (
    <div className="layout-col page-shell" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      <div className="layout-row forecast-layout">
        {/* Sidebar: Zone Selection */}
        <div className="forecast-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontFamily: 'Space Grotesk', fontSize: '12px', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Select Distribution Zone</h4>
          {zones.map(zone => (
            <button
              key={zone.id}
              onClick={() => setSelectedZone(zone)}
              style={{
                padding: '12px 16px',
                textAlign: 'left',
                background: selectedZone.id === zone.id ? 'var(--bg-elevated)' : 'transparent',
                border: selectedZone.id === zone.id ? '1px solid var(--cyan-bright)' : '1px solid var(--border-subtle)',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: selectedZone.id === zone.id ? 'var(--cyan-bright)' : 'var(--text-primary)' }}>{zone.name}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{zone.type} Corridor</div>
              </div>
              <div style={{ fontSize: '12px', fontFamily: 'JetBrains Mono', color: 'var(--text-mono)' }}>{zone.demand}MW</div>
            </button>
          ))}
        </div>

        {/* Main: Forecast Visualization */}
        <div className="layout-col forecast-main" style={{ flex: 1 }}>
          <div className="kpi-grid">
            <Card title="Predicted Peak" style={{ padding: '16px' }}>
              <div style={{ fontSize: '24px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--cyan-bright)' }}>
                {predictedPeak} MW
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{peakSubtitle}</div>
            </Card>
            <Card title="Risk Windows" style={{ padding: '16px' }}>
              <div style={{ fontSize: '24px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: riskHours > 5 ? 'var(--red-bright)' : 'var(--amber)' }}>
                {riskHours} Hours
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Above 85% Rated Capacity</div>
            </Card>
            <Card title="EV Load Factor" style={{ padding: '16px' }}>
              <div style={{ fontSize: '24px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--violet-bright)' }}>
                {selectedZone.evGrowth}%
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>Projected 12mo CAGR</div>
            </Card>
          </div>

          <Card title={`${selectedZone.name} — 72-Hour Demand Projection`} subtitle="AI-driven load forecasting with confidence intervals">
            <div style={{ height: '400px', marginTop: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="colorPred" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--cyan-bright)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--cyan-bright)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
                  <XAxis 
                    dataKey="hour" 
                    stroke="var(--text-dim)" 
                    fontSize={10} 
                    tickFormatter={(tick) => `${tick % 24}:00`}
                    interval={5}
                  />
                  <YAxis stroke="var(--text-dim)" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area type="monotone" dataKey="upper" stroke="none" fill="var(--cyan-dim)" fillOpacity={0.1} name="95% Confidence Upper" />
                  <Area type="monotone" dataKey="lower" stroke="none" fill="var(--cyan-dim)" fillOpacity={0.1} name="95% Confidence Lower" />
                  <Area type="monotone" dataKey="predicted" stroke="var(--cyan-bright)" strokeWidth={2} fillOpacity={1} fill="url(#colorPred)" name="Predicted Load (MW)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function buildPredictPayload(zone, hour, day) {
  const tierDensity = zone.tier === 1 ? 0.55 : zone.tier === 2 ? 0.65 : zone.tier === 3 ? 0.75 : 0.82;
  const itScore = zone.type === 'IT' ? 0.92 : zone.type === 'Mixed' ? 0.72 : zone.type === 'Commercial' ? 0.6 : 0.4;
  const traffic = hour >= 18 && hour <= 21 ? 0.8 : hour >= 8 && hour <= 10 ? 0.65 : 0.5;

  return {
    zone: zone.name,
    hour,
    day_of_week: day,
    temperature: 30 + Math.sin(hour / 3) * 3,
    traffic_index: traffic,
    EV_growth_rate: Math.min(1, zone.evGrowth / 100),
    residential_density: tierDensity,
    IT_corridor_score: itScore
  };
}
