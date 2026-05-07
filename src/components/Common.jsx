import React from 'react';

export const Card = ({ title, subtitle, children, className = "", style = {} }) => (
  <div style={{
    background: 'rgba(9, 21, 37, 0.4)',
    backdropFilter: 'blur(12px)',
    border: '1px solid var(--border-subtle)',
    borderRadius: '8px',
    padding: 'var(--space-card)',
    position: 'relative',
    overflow: 'hidden',
    ...style
  }} className={`cyber-card ${className}`}>
    <div style={{ 
      position: 'absolute', 
      top: 0, left: 0, 
      width: '100%', height: '2px', 
      background: 'linear-gradient(90deg, transparent, var(--cyan-bright), transparent)',
      opacity: 0.22
    }} />
    {(title || subtitle) && (
      <div style={{ marginBottom: '18px' }}>
        {title && <h3 style={{ fontFamily: 'Space Grotesk', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{title}</h3>}
        {subtitle && <p style={{ fontFamily: 'Inter', fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{subtitle}</p>}
      </div>
    )}
    {children}
  </div>
);

export const Badge = ({ children, color = 'var(--cyan-bright)', bg = 'var(--cyan-ghost)' }) => (
  <span style={{
    background: bg,
    border: `1px solid ${color}40`,
    color: color,
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '4px',
    fontFamily: 'Space Grotesk',
    letterSpacing: '0.05em',
    textTransform: 'uppercase'
  }}>
    {children}
  </span>
);

export const LoadGauge = ({ value, label, size = 120 }) => {
  const radius = (size / 2) - 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;
  const color = value > 90 ? 'var(--red-bright)' : value > 75 ? 'var(--amber)' : 'var(--cyan-bright)';

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke="var(--bg-elevated)" strokeWidth="8" fill="transparent"
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth="8" fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease-in-out, stroke 0.3s' }}
        />
      </svg>
      <div style={{ position: 'absolute', textAlign: 'center' }}>
        <div style={{ fontFamily: 'JetBrains Mono', fontSize: size * 0.18, fontWeight: 700, color }}>{value}%</div>
        <div style={{ fontFamily: 'Space Grotesk', fontSize: size * 0.08, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
      </div>
    </div>
  );
};
