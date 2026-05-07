import React, { useEffect, useState } from 'react';
import { Card, Badge } from './Common';
import { ZONES, generateSiteLocations } from '../data';
import { MapPin, Search, PlusCircle, Building2 } from 'lucide-react';
import IntelligenceMap from './IntelligenceMap';
import { getSiting, mlHotspots } from '../api/evosApi';

export default function SitingTab() {
  const [zones, setZones] = useState(ZONES);
  const [corridors, setCorridors] = useState([]);
  const [selectedZone, setSelectedZone] = useState(ZONES[0]);
  const [sites, setSites] = useState(generateSiteLocations(ZONES[0]));
  const [mlHotspot, setMlHotspot] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadInitial = async () => {
      try {
        const res = await getSiting();
        if (!mounted) return;
        const nextZones = res?.data?.zones?.length ? res.data.zones : ZONES;
        setZones(nextZones);
        setCorridors(res?.data?.corridors || []);
        setSelectedZone((prev) => nextZones.find((z) => z.id === prev.id) || nextZones[0]);
      } catch (error) {
        // Keep local synthetic data as fallback.
      }
    };
    loadInitial();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedZone?.id) return;
    let mounted = true;
    const loadSites = async () => {
      try {
        const res = await getSiting(selectedZone.id);
        if (!mounted) return;
        if (res?.data?.sites?.length) {
          setSites(res.data.sites);
          return;
        }
      } catch (error) {
        // Fallback below.
      }
      if (mounted) {
        setSites(generateSiteLocations(selectedZone));
      }
    };
    loadSites();
    return () => { mounted = false; };
  }, [selectedZone]);

  useEffect(() => {
    if (!selectedZone?.id) return;
    let mounted = true;
    const loadHotspot = async () => {
      try {
        const payload = [buildHotspotPayload(selectedZone)];
        const res = await mlHotspots(payload);
        if (!mounted) return;
        const result = res?.data?.results?.[0];
        if (result?.hotspotScore) {
          setMlHotspot(result);
          return;
        }
      } catch (error) {
        // Fallback below.
      }
      if (mounted) setMlHotspot(null);
    };
    loadHotspot();
    return () => { mounted = false; };
  }, [selectedZone]);

  return (
    <div className="layout-col page-shell" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      
      <div className="layout-grid-12">
        
        {/* Left: Zone Metrics */}
        <div className="span-4 layout-col">
          <Card title="Siting Analysis Parameters" subtitle="AI weighting for location scoring">
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                { label: 'EV Density', weight: 45, icon: <MapPin size={14}/> },
                { label: 'Grid Headroom', weight: 30, icon: <Search size={14}/> },
                { label: 'Commercial Proximity', weight: 15, icon: <Building2 size={14}/> },
                { label: 'Land Availability', weight: 10, icon: <PlusCircle size={14}/> },
              ].map(param => (
                <div key={param.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)' }}>{param.icon} {param.label}</span>
                    <span style={{ fontWeight: 700, color: 'var(--cyan-bright)' }}>{param.weight}%</span>
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ width: `${param.weight}%`, height: '100%', background: 'var(--cyan-bright)' }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h4 style={{ fontFamily: 'Space Grotesk', fontSize: '12px', color: 'var(--text-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Select Zone for Siting</h4>
            {zones.map(zone => (
              <button
                key={zone.id}
                className="cyber-button-hover"
                onClick={() => setSelectedZone(zone)}
                style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  background: selectedZone.id === zone.id ? 'rgba(0,229,255,0.1)' : 'transparent',
                  border: `1px solid ${selectedZone.id === zone.id ? 'var(--cyan-bright)' : 'var(--border-subtle)'}`,
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: selectedZone.id === zone.id ? 'var(--cyan-bright)' : 'var(--text-primary)'
                }}
              >
                {zone.name}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Map & Site Recommendations */}
        <div className="span-8 layout-col">
          <IntelligenceMap 
            center={[selectedZone.lat, selectedZone.lng]} 
            zoom={14} 
            recommendations={sites.map((s, i) => ({ ...s, lat: selectedZone.lat + (i+1)*0.005, lng: selectedZone.lng + (i-1)*0.005 }))} 
            corridors={corridors}
            height="360px"
          />
          
          <Card title={`Site Recommendations: ${selectedZone.name}`} subtitle="Ranked locations based on grid impact and demand potential">
            <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sites.map(site => (
                <div key={site.rank} className="cyber-button-hover" style={{ 
                  padding: '20px', 
                  background: 'rgba(5, 13, 26, 0.6)', 
                  border: '1px solid var(--border-subtle)', 
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ 
                      width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--cyan-bright)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', 
                      fontSize: '18px', fontWeight: 800, color: 'var(--cyan-bright)',
                      boxShadow: '0 0 15px rgba(0,229,255,0.2)'
                    }}>
                      #{site.rank}
                    </div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{site.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>Feeder: {site.feeder} • Capacity: {site.chargers} Chargers</div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <Badge color="var(--emerald)">{site.driver}</Badge>
                        {mlHotspot?.infrastructurePriority && (
                          <Badge color={mlHotspot.infrastructurePriority === 'HIGH' ? 'var(--red-bright)' : mlHotspot.infrastructurePriority === 'LOW' ? 'var(--text-secondary)' : 'var(--amber)'}>
                            ML {mlHotspot.infrastructurePriority}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Suitability Score</div>
                    <div style={{ fontSize: '28px', fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--cyan-bright)' }}>
                      {mlHotspot?.hotspotScore ? Math.round(site.score + mlHotspot.hotspotScore * 0.08) : site.score}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Grid Headroom: {site.headroom}</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}

function buildHotspotPayload(zone) {
  return {
    ev_density: Math.min(1, zone.evGrowth / 60),
    feeder_capacity: Math.min(1, Math.max(0.2, zone.feederHealth || 0.7)),
    traffic_flow: zone.type === 'IT' ? 0.82 : zone.type === 'Commercial' ? 0.7 : 0.6,
    station_density: Math.min(1, (zone.stations || 0) / 8),
    residential_demand: zone.type === 'Residential' ? 0.8 : zone.type === 'Mixed' ? 0.7 : 0.55
  };
}
