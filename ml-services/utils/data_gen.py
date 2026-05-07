import numpy as np
import pandas as pd

ZONES = [
    "Whitefield",
    "HSR Layout",
    "Electronic City",
    "Koramangala",
    "Marathahalli",
    "JP Nagar",
    "Indiranagar",
]

ZONE_PROFILES = {
    "Whitefield": {"ev_growth": 0.42, "res_density": 0.55, "it_score": 0.92},
    "HSR Layout": {"ev_growth": 0.38, "res_density": 0.62, "it_score": 0.72},
    "Electronic City": {"ev_growth": 0.35, "res_density": 0.45, "it_score": 0.95},
    "Koramangala": {"ev_growth": 0.28, "res_density": 0.70, "it_score": 0.60},
    "Marathahalli": {"ev_growth": 0.33, "res_density": 0.58, "it_score": 0.78},
    "JP Nagar": {"ev_growth": 0.20, "res_density": 0.80, "it_score": 0.30},
    "Indiranagar": {"ev_growth": 0.25, "res_density": 0.68, "it_score": 0.55},
}


def _hour_shape(hour):
    # Evening peak, smaller morning bump
    peak = np.exp(-0.5 * ((hour - 20) / 3.0) ** 2)
    morning = 0.5 * np.exp(-0.5 * ((hour - 9) / 2.5) ** 2)
    return 0.6 + 1.1 * peak + 0.4 * morning


def _weekend_factor(day_of_week):
    return 0.9 if day_of_week >= 5 else 1.0


def generate_demand_data(rows=3000, seed=42):
    rng = np.random.default_rng(seed)
    data = []
    for _ in range(rows):
        zone = rng.choice(ZONES)
        hour = int(rng.integers(0, 24))
        day = int(rng.integers(0, 7))
        temp = float(rng.normal(30, 4))
        traffic = float(np.clip(rng.normal(0.6, 0.15), 0.1, 1.0))
        profile = ZONE_PROFILES[zone]

        base = 4.5 + 3.5 * profile["ev_growth"] + 2.0 * profile["it_score"]
        load = base * _hour_shape(hour) * _weekend_factor(day)
        load += 0.08 * (temp - 28) + 1.8 * traffic + 2.2 * profile["res_density"]
        load += rng.normal(0, 0.4)
        load = max(1.5, load)

        data.append({
            "zone": zone,
            "hour": hour,
            "day_of_week": day,
            "temperature": round(temp, 2),
            "traffic_index": round(traffic, 2),
            "EV_growth_rate": round(profile["ev_growth"], 2),
            "residential_density": round(profile["res_density"], 2),
            "IT_corridor_score": round(profile["it_score"], 2),
            "predictedLoadMW": round(load, 2),
        })
    return pd.DataFrame(data)


def generate_risk_data(rows=3000, seed=99):
    rng = np.random.default_rng(seed)
    data = []
    for _ in range(rows):
        load_pct = float(np.clip(rng.normal(75, 12), 30, 110))
        temp = float(np.clip(rng.normal(31, 5), 20, 45))
        traffic = float(np.clip(rng.normal(0.6, 0.2), 0.1, 1.0))
        feeder_health = float(np.clip(rng.normal(0.8, 0.12), 0.4, 1.0))
        risk_score = 0.55 * (load_pct / 100) + 0.25 * (temp / 45) + 0.15 * traffic + 0.2 * (1 - feeder_health)
        risk_level = "LOW"
        if risk_score >= 0.85 or load_pct > 95:
            risk_level = "CRITICAL"
        elif risk_score >= 0.7:
            risk_level = "HIGH"
        elif risk_score >= 0.55:
            risk_level = "MEDIUM"
        data.append({
            "load_percent": round(load_pct, 1),
            "temperature": round(temp, 1),
            "traffic_index": round(traffic, 2),
            "feeder_health": round(feeder_health, 2),
            "risk_level": risk_level,
        })
    return pd.DataFrame(data)


def generate_hotspot_data(rows=800, seed=7):
    rng = np.random.default_rng(seed)
    data = []
    for _ in range(rows):
        ev_density = float(np.clip(rng.normal(0.65, 0.2), 0.1, 1.0))
        feeder_capacity = float(np.clip(rng.normal(0.7, 0.15), 0.2, 1.0))
        traffic_flow = float(np.clip(rng.normal(0.6, 0.2), 0.1, 1.0))
        station_density = float(np.clip(rng.normal(0.5, 0.2), 0.05, 1.0))
        residential_demand = float(np.clip(rng.normal(0.6, 0.2), 0.1, 1.0))

        hotspot_score = (
            0.32 * ev_density
            + 0.22 * traffic_flow
            + 0.20 * residential_demand
            + 0.18 * (1 - feeder_capacity)
            + 0.08 * (1 - station_density)
        )
        data.append({
            "ev_density": round(ev_density, 2),
            "feeder_capacity": round(feeder_capacity, 2),
            "traffic_flow": round(traffic_flow, 2),
            "station_density": round(station_density, 2),
            "residential_demand": round(residential_demand, 2),
            "hotspot_score": round(hotspot_score * 100, 1),
        })
    return pd.DataFrame(data)
