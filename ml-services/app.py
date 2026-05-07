from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import List
from services.model_loader import registry
from services.predict_service import predict_demand
from services.hotspot_service import cluster_hotspots
from services.optimize_service import optimize_charging
from services.risk_service import predict_risk

app = FastAPI(title="EVOS ML Services", version="0.1.0")


class PredictRequest(BaseModel):
    zone: str
    hour: int = Field(ge=0, le=23)
    day_of_week: int = Field(ge=0, le=6)
    temperature: float
    traffic_index: float = Field(ge=0.0, le=1.0)
    EV_growth_rate: float = Field(ge=0.0, le=1.0)
    residential_density: float = Field(ge=0.0, le=1.0)
    IT_corridor_score: float = Field(ge=0.0, le=1.0)


class HotspotItem(BaseModel):
    ev_density: float = Field(ge=0.0, le=1.0)
    feeder_capacity: float = Field(ge=0.0, le=1.0)
    traffic_flow: float = Field(ge=0.0, le=1.0)
    station_density: float = Field(ge=0.0, le=1.0)
    residential_demand: float = Field(ge=0.0, le=1.0)


class OptimizeRequest(BaseModel):
    peakLoadMW: float
    baseLoadMW: float | None = None
    activeSessions: int | None = None
    eveningPeak: bool | None = True


class RiskRequest(BaseModel):
    load_percent: float
    temperature: float
    traffic_index: float
    feeder_health: float


@app.on_event("startup")
def startup():
    registry.load_models()


@app.post("/predict")
def predict(request: PredictRequest):
    return predict_demand(registry.forecast_model, request.model_dump())


@app.post("/hotspots")
def hotspots(items: List[HotspotItem]):
    payloads = [item.model_dump() for item in items]
    return {"results": cluster_hotspots(registry.hotspot_model, payloads)}


@app.post("/optimize")
def optimize(request: OptimizeRequest):
    return optimize_charging(request.model_dump())


@app.post("/risk")
def risk(request: RiskRequest):
    return predict_risk(registry.risk_model, request.model_dump())
