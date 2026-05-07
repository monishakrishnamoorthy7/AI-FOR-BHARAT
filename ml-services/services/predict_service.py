import numpy as np
import pandas as pd


def predict_demand(model, payload):
    df = pd.DataFrame([payload])
    prediction = float(model.predict(df)[0])

    load = prediction
    overload_risk = "LOW"
    if load >= 9.5:
        overload_risk = "HIGH"
    elif load >= 7.5:
        overload_risk = "MEDIUM"

    confidence = float(np.clip(0.78 + (1.0 - (abs(load - 7.5) / 12.0)) * 0.18, 0.72, 0.95))

    return {
        "zone": payload.get("zone"),
        "predictedLoadMW": round(load, 2),
        "overloadRisk": overload_risk,
        "confidenceScore": round(confidence, 2),
    }
