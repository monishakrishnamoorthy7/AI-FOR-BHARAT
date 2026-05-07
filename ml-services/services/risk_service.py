import numpy as np
import pandas as pd


def predict_risk(model, payload):
    df = pd.DataFrame([payload])
    risk_level = model.predict(df)[0]

    load = float(payload["load_percent"])
    if load >= 95:
        risk_level = "CRITICAL"
    elif load >= 85 and risk_level == "LOW":
        risk_level = "MEDIUM"

    return {
        "riskLevel": str(risk_level),
        "loadPercent": round(load, 1),
    }
