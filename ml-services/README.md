# EVOS ML Services

Lightweight FastAPI ML services for hackathon-grade smart-grid intelligence.

## Features
- Demand forecasting (XGBoost regressor)
- Hotspot detection (KMeans + weighted scoring)
- Charging optimization (rule-based)
- Overload risk detection (RandomForest classifier + thresholds)

## Setup

```bash
cd ml-services
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
```

## Train Models (optional)
Models auto-train on first startup if missing, but you can pre-train:

```bash
python utils\train_models.py
```

## Run the API

```bash
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Endpoints
- POST /predict
- POST /optimize
- POST /hotspots
- POST /risk

## Sample Requests

### /predict
```json
{
  "zone": "Whitefield",
  "hour": 19,
  "day_of_week": 2,
  "temperature": 32.5,
  "traffic_index": 0.72,
  "EV_growth_rate": 0.42,
  "residential_density": 0.55,
  "IT_corridor_score": 0.92
}
```

### /hotspots
```json
[
  {
    "ev_density": 0.75,
    "feeder_capacity": 0.62,
    "traffic_flow": 0.7,
    "station_density": 0.25,
    "residential_demand": 0.68
  }
]
```

### /optimize
```json
{
  "peakLoadMW": 9.3,
  "baseLoadMW": 6.6,
  "activeSessions": 420,
  "eveningPeak": true
}
```

### /risk
```json
{
  "load_percent": 94,
  "temperature": 33.2,
  "traffic_index": 0.7,
  "feeder_health": 0.65
}
```
