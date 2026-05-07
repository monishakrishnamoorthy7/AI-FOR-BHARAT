const API_BASE = import.meta.env.VITE_API_BASE || '/api';

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

async function apiPost(path, payload) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function getOverview() {
  return apiGet('/overview');
}

export async function getForecasts() {
  return apiGet('/forecast');
}

export async function getScheduler() {
  return apiGet('/scheduler');
}

export async function getSiting(zoneId) {
  const query = zoneId ? `?zoneId=${encodeURIComponent(zoneId)}` : '';
  return apiGet(`/siting${query}`);
}

export async function getDigitalTwin() {
  return apiGet('/digitalTwin');
}

export async function getAlerts() {
  return apiGet('/alerts');
}

export async function mlPredict(payload) {
  return apiPost('/ml/predict', payload);
}

export async function mlOptimize(payload) {
  return apiPost('/ml/optimize', payload);
}

export async function mlHotspots(payload) {
  return apiPost('/ml/hotspots', payload);
}

export async function mlRisk(payload) {
  return apiPost('/ml/risk', payload);
}
