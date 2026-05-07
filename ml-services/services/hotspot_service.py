import numpy as np
import pandas as pd


def score_hotspot(payload):
    ev_density = payload["ev_density"]
    feeder_capacity = payload["feeder_capacity"]
    traffic_flow = payload["traffic_flow"]
    station_density = payload["station_density"]
    residential_demand = payload["residential_demand"]

    score = (
        0.32 * ev_density
        + 0.22 * traffic_flow
        + 0.20 * residential_demand
        + 0.18 * (1 - feeder_capacity)
        + 0.08 * (1 - station_density)
    )
    score = float(np.clip(score * 100, 0, 100))

    priority = "MEDIUM"
    if score >= 72:
        priority = "HIGH"
    elif score <= 45:
        priority = "LOW"

    recommended = int(np.clip(round(2 + score / 18), 1, 8))
    return score, priority, recommended


def cluster_hotspots(model, payloads):
    df = pd.DataFrame(payloads)
    clusters = model.predict(df)
    enriched = []
    for idx, row in df.iterrows():
        score, priority, recommended = score_hotspot(row.to_dict())
        enriched.append({
            **row.to_dict(),
            "cluster": int(clusters[idx]),
            "hotspotScore": round(score, 1),
            "infrastructurePriority": priority,
            "recommendedStations": recommended,
        })
    return enriched
