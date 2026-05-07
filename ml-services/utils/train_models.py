import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import r2_score
from sklearn.cluster import KMeans
from xgboost import XGBRegressor
from sklearn.ensemble import RandomForestClassifier

from utils.data_gen import generate_demand_data, generate_risk_data, generate_hotspot_data

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
MODEL_DIR = os.path.join(BASE_DIR, "trained_models")


def train_forecast_model():
    df = generate_demand_data()
    X = df.drop(columns=["predictedLoadMW"])
    y = df["predictedLoadMW"]

    cat_cols = ["zone"]
    num_cols = [col for col in X.columns if col not in cat_cols]

    preprocessor = ColumnTransformer(
        [("cat", OneHotEncoder(handle_unknown="ignore"), cat_cols),
         ("num", "passthrough", num_cols)]
    )

    model = XGBRegressor(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.9,
        colsample_bytree=0.9,
        reg_lambda=1.0,
        objective="reg:squarederror",
        n_jobs=2,
        random_state=42,
    )

    pipeline = Pipeline([
        ("prep", preprocessor),
        ("model", model)
    ])

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    pipeline.fit(X_train, y_train)
    score = r2_score(y_test, pipeline.predict(X_test))

    joblib.dump(pipeline, os.path.join(MODEL_DIR, "forecast_model.joblib"))
    return score


def train_risk_model():
    df = generate_risk_data()
    X = df.drop(columns=["risk_level"])
    y = df["risk_level"]

    model = RandomForestClassifier(
        n_estimators=120,
        max_depth=6,
        random_state=42,
        n_jobs=2
    )

    model.fit(X, y)
    joblib.dump(model, os.path.join(MODEL_DIR, "risk_model.joblib"))
    return model


def train_hotspot_model():
    df = generate_hotspot_data()
    X = df.drop(columns=["hotspot_score"])

    model = KMeans(n_clusters=3, n_init=10, random_state=42)
    model.fit(X)
    joblib.dump(model, os.path.join(MODEL_DIR, "hotspot_model.joblib"))
    return model


if __name__ == "__main__":
    os.makedirs(MODEL_DIR, exist_ok=True)
    forecast_score = train_forecast_model()
    train_risk_model()
    train_hotspot_model()
    print(f"Forecast model trained (R2={forecast_score:.2f})")
