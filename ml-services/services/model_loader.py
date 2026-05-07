import os
import joblib
from utils.train_models import train_forecast_model, train_risk_model, train_hotspot_model

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "trained_models")


class ModelRegistry:
    def __init__(self):
        self.forecast_model = None
        self.risk_model = None
        self.hotspot_model = None

    def load_models(self):
        os.makedirs(MODEL_DIR, exist_ok=True)

        forecast_path = os.path.join(MODEL_DIR, "forecast_model.joblib")
        risk_path = os.path.join(MODEL_DIR, "risk_model.joblib")
        hotspot_path = os.path.join(MODEL_DIR, "hotspot_model.joblib")

        if not os.path.exists(forecast_path):
            train_forecast_model()
        if not os.path.exists(risk_path):
            train_risk_model()
        if not os.path.exists(hotspot_path):
            train_hotspot_model()

        self.forecast_model = joblib.load(forecast_path)
        self.risk_model = joblib.load(risk_path)
        self.hotspot_model = joblib.load(hotspot_path)


registry = ModelRegistry()
