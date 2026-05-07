import React, { useEffect, useMemo, useState } from 'react';
import { Card, Badge } from './Common';
import { generateRecommendations, generateSessionShifts } from '../data';
import { Brain, ArrowRight, Zap, CheckCircle2 } from 'lucide-react';
import { getScheduler, mlOptimize } from '../api/evosApi';

export default function SchedulerTab() {
  const recommendations = useMemo(() => generateRecommendations(), []);
  const [sessionShifts, setSessionShifts] = useState(generateSessionShifts());
  const [mlPlan, setMlPlan] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadShifts = async () => {
      try {
        const res = await getScheduler();
        if (!mounted) return;
        if (res?.data?.shifts?.length) {
          setSessionShifts(res.data.shifts);
        }
      } catch (error) {
        // Keep local synthetic data as fallback.
      }
    };
    loadShifts();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    let mounted = true;
    const loadMlPlan = async () => {
      try {
        const payload = buildOptimizePayload();
        const res = await mlOptimize(payload);
        if (!mounted) return;
        if (res?.data?.shiftWindow) {
          setMlPlan(res.data);
        }
      } catch (error) {
        if (mounted) setMlPlan(null);
      }
    };
    loadMlPlan();
    return () => { mounted = false; };
  }, []);

  const liveShift = mlPlan ? {
    feeder: 'ML-OPT',
    sessions: mlPlan.sessionsShifted,
    mw: Math.max(0.15, Math.round((mlPlan.peakReductionPercent / 20) * 100) / 100),
    window: mlPlan.shiftWindow
  } : null;

  return (
    <div className="layout-col page-shell" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      <div className="layout-grid-12">
        
        {/* Main: AI Strategy */}
        <div className="span-8 layout-col">
          <Card title="AI Load Optimization Strategy" subtitle="Dynamic peak shaving & valley filling recommendations">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '16px' }}>
              {recommendations.map(rec => (
                <div key={rec.id} style={{ 
                  padding: '20px', 
                  background: 'rgba(13,30,53,0.5)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--cyan-ghost)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Brain size={20} color="var(--cyan-bright)" />
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>{rec.zone} — {rec.feeder}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Confidence Score: {rec.confidence}%</div>
                      </div>
                    </div>
                    <Badge color={rec.status === 'implemented' ? 'var(--emerald)' : 'var(--amber)'}>
                      {rec.status}
                    </Badge>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>{rec.text}</p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Shift Potential</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--cyan-bright)', fontFamily: 'JetBrains Mono' }}>{rec.loadShifted}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Peak Reduction</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--violet-bright)', fontFamily: 'JetBrains Mono' }}>{rec.peakReduction}</div>
                    </div>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ fontSize: '9px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Stress Mitigation</div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--emerald)', fontFamily: 'JetBrains Mono' }}>{rec.stressReduction}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Sidebar: Session Impact */}
        <div className="span-4">
          <Card title="Session Rescheduling Log" subtitle="Real-time shift distribution">
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[liveShift, ...sessionShifts].filter(Boolean).map((shift, idx) => (
                <div key={idx} style={{ paddingBottom: '12px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>{shift.feeder}</span>
                    <span style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: 'var(--violet-bright)' }}>{shift.mw} MW</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                    <span>{shift.sessions} sessions</span>
                    <ArrowRight size={12} />
                    <span style={{ color: 'var(--cyan-bright)' }}>{shift.window}</span>
                  </div>
                </div>
              ))}
              <button style={{ 
                marginTop: '12px', 
                padding: '12px', 
                background: 'var(--cyan-bright)', 
                color: '#030812', 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: 700, 
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 0 20px rgba(0,229,255,0.3)'
              }}>
                <CheckCircle2 size={16} /> Execute Batch Optimization
              </button>
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}

function buildOptimizePayload() {
  return {
    peakLoadMW: 9.2,
    baseLoadMW: 6.5,
    activeSessions: 420,
    eveningPeak: true
  };
}
