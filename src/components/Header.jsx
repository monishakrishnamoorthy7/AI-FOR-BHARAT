import React from 'react';
import { Activity, TrendingUp, Clock, MapPin, Zap, Cpu } from 'lucide-react';

const TABS = [
  { id:'overview', label:'Overview', icon: Activity },
  { id:'forecast', label:'Demand Forecast', icon: TrendingUp },
  { id:'scheduler', label:'Scheduler', icon: Clock },
  { id:'siting', label:'Siting', icon: MapPin },
  { id:'twin', label:'Digital Twin', icon: Zap },
  { id:'circuit', label:'Circuit', icon: Cpu },
];

export default function Header({ activeTab, onTabChange, currentTime, gridStatus }) {
  return (
    <header className="header-shell" style={{
      background:'rgba(5,13,26,0.92)', backdropFilter:'blur(24px)',
      borderBottom:'1px solid var(--border-subtle)', position:'fixed',
      top:0, left:0, right:0, minHeight:64, zIndex:100,
      display:'flex', alignItems:'center', padding:'0 24px',
    }}>
      {/* Logo */}
      <div className="header-brand" style={{ display:'flex', alignItems:'center', gap:10, flex:'0 0 auto' }}>
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ filter:'drop-shadow(0 0 6px rgba(0,229,255,0.8))', animation:'pulseCyan 3s ease-in-out infinite' }}>
          <path d="M16 2L6 16h6l-2 10 10-14h-6l2-10z" stroke="#00E5FF" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
        </svg>
        <span style={{ fontFamily:'Space Grotesk', fontSize:22, fontWeight:700, letterSpacing:'0.12em', color:'var(--cyan-bright)' }}>
          EV<span style={{ fontSize:18, color:'rgba(0,229,255,0.6)' }}>·</span>OS
        </span>
        <div style={{ width:1, height:28, background:'var(--border-subtle)', margin:'0 16px' }}/>
        <span style={{ fontFamily:'Space Grotesk', fontSize:10, fontWeight:600, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-dim)' }}>
          BESCOM INTELLIGENCE PLATFORM
        </span>
      </div>

      {/* Nav tabs */}
      <div className="header-tabs" style={{ flex:1, display:'flex', justifyContent:'center' }}>
        <div className="header-tabs-inner" style={{
          background:'rgba(0,0,0,0.3)', border:'1px solid var(--border-subtle)',
          borderRadius:999, padding:4, display:'flex', gap:2
        }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => onTabChange(tab.id)}
                role="tab" aria-label={tab.label} aria-selected={isActive}
                style={{
                  fontFamily:'Space Grotesk', fontSize:12, fontWeight: isActive ? 700 : 600,
                  letterSpacing:'0.06em', textTransform:'uppercase', padding:'7px 18px',
                  borderRadius:999, border:'none', cursor:'pointer', transition:'all 0.2s ease',
                  whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:6,
                  background: isActive ? 'var(--cyan-bright)' : 'transparent',
                  color: isActive ? '#030812' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 0 10px rgba(0,229,255,0.28)' : 'none',
                }}>
                <Icon size={16} style={{ color: isActive ? '#030812' : 'var(--text-dim)' }}/>
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Right section */}
      <div className="header-right" style={{ flex:'0 0 auto', display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'JetBrains Mono', fontSize:13, fontWeight:500, color:'var(--text-mono)' }}>
            {currentTime}
          </div>
          <div style={{ fontFamily:'Space Grotesk', fontSize:10, fontWeight:600, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-dim)', marginTop:2 }}>
            {new Date().toLocaleDateString('en-US',{weekday:'short',day:'2-digit',month:'short',year:'numeric'}).toUpperCase()}
          </div>
        </div>

        <div style={{
          display:'flex', alignItems:'center', gap:8, padding:'6px 14px',
          background: gridStatus === 'overload' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)',
          border: `1px solid ${gridStatus === 'overload' ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}`,
          borderRadius:999,
        }}>
          <div style={{
            width:8, height:8, borderRadius:'50%',
            background: gridStatus === 'overload' ? '#EF4444' : '#10B981',
            animation: gridStatus === 'overload' ? 'pulseRed 2s ease-in-out infinite' : 'pulseEmerald 2s ease-in-out infinite',
          }}/>
          <span style={{
            fontFamily:'Space Grotesk', fontSize:11, fontWeight:600,
            letterSpacing:'0.08em', color: gridStatus === 'overload' ? '#EF4444' : '#10B981'
          }}>BLR GRID</span>
        </div>

        <span style={{ fontFamily:'Space Grotesk', fontSize:10, fontWeight:600, letterSpacing:'0.1em', color:'var(--text-dim)' }}>
          v2.1 DECISION SUPPORT
        </span>
      </div>
    </header>
  );
}
