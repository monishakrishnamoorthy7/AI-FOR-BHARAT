import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, Polyline, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Zap, Battery, Activity, ShieldCheck } from 'lucide-react';

// Fix for default marker icons in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const BANGALORE_CENTER = [12.9716, 77.5946];

function ChangeView({ center, zoom }) {
  const map = useMap();
  React.useEffect(() => {
    if (center && center.length === 2) {
      map.setView(center, zoom);
    }
  }, [center[0], center[1], zoom, map]);
  return null;
}

export default function IntelligenceMap({ 
  zones = [], 
  corridors = [], 
  recommendations = [], 
  center = BANGALORE_CENTER, 
  zoom = 12,
  height = "400px"
}) {
  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border-subtle)', position: 'relative' }}>
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', background: 'var(--bg-void)' }}
      >
        <ChangeView center={center} zoom={zoom} />
        
        {/* Futuristic Dark Matter Tiles */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Corridor Polylines (Neon Flow) */}
        {corridors.map((corridor, idx) => (
          <Polyline 
            key={`corridor-${idx}`}
            positions={corridor.path}
            pathOptions={{ 
              color: 'var(--violet-bright)', 
              weight: 4, 
              opacity: 0.6,
              dashArray: '10, 10',
              className: 'neon-polyline'
            }}
          >
            <Tooltip sticky>
              <div className="cyber-tooltip">
                <strong>{corridor.road}</strong>
                <div>{corridor.stations} Planned Stations</div>
                <div style={{ color: 'var(--violet-bright)' }}>Timeline: {corridor.timeline}</div>
              </div>
            </Tooltip>
          </Polyline>
        ))}

        {/* Zone Demand Hotspots (Pulsing Circles) */}
        {zones.map(zone => {
          const isStressed = zone.feederHealth < 0.7;
          const color = isStressed ? 'var(--red-bright)' : 'var(--cyan-bright)';
          const radius = Math.sqrt(zone.demand) * 2;

          return (
            <CircleMarker
              key={zone.id}
              center={[zone.lat, zone.lng]}
              radius={radius}
              pathOptions={{
                fillColor: color,
                color: color,
                weight: 1,
                opacity: 0.8,
                fillOpacity: 0.2,
                className: isStressed ? 'pulse-red-map' : 'pulse-cyan-map'
              }}
            >
              <Tooltip sticky>
                <div className="cyber-tooltip">
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', marginBottom: '8px', paddingBottom: '4px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{zone.name.toUpperCase()}</span>
                    <span style={{ color }}>{Math.round(zone.feederHealth * 100)}% HEALTH</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>LOAD</div>
                      <div style={{ fontSize: '14px', fontFamily: 'JetBrains Mono', color: 'var(--text-primary)' }}>{zone.demand} MW</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: 'var(--text-dim)' }}>EV GROWTH</div>
                      <div style={{ fontSize: '14px', fontFamily: 'JetBrains Mono', color: 'var(--violet-bright)' }}>+{zone.evGrowth}%</div>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Zap size={10} /> AI RECOMMENDATION: {isStressed ? 'SHIFT LOAD' : 'STABLE'}
                  </div>
                </div>
              </Tooltip>
            </CircleMarker>
          );
        })}

        {/* Recommendations (Markers) */}
        {recommendations.map((rec, idx) => (
          <Marker 
            key={`rec-${idx}`} 
            position={[rec.lat, rec.lng]}
          >
            <Popup>
              <div className="cyber-popup">
                <div style={{ color: 'var(--cyan-bright)', fontWeight: 700, marginBottom: '4px' }}>SITE RECOMMENDATION #{rec.rank}</div>
                <div style={{ fontSize: '14px', fontWeight: 600 }}>{rec.name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Score: {rec.score} | Headroom: {rec.headroom}</div>
              </div>
            </Popup>
          </Marker>
        ))}

      </MapContainer>

      {/* Map Overlays (Legend/Controls) */}
      <div style={{
        position: 'absolute', bottom: '12px', right: '12px', zIndex: 1000,
        background: 'rgba(3, 8, 18, 0.85)', backdropFilter: 'blur(8px)',
        border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '12px',
        display: 'flex', flexDirection: 'column', gap: '8px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--cyan-bright)', boxShadow: '0 0 8px var(--cyan-bright)' }} />
          <span>Optimal Grid Status</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--red-bright)', boxShadow: '0 0 8px var(--red-bright)' }} />
          <span>Feeder Stress Detected</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10px' }}>
          <div style={{ width: '20px', height: '2px', background: 'var(--violet-bright)' }} />
          <span>High-Tier EV Corridor</span>
        </div>
      </div>
    </div>
  );
}
