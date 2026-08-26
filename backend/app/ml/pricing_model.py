import os
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple
import joblib
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from backend.app.config import settings

class CraftPricingMLModel:
    def __init__(self):
        self.model_path = settings.MODELS_DIR / "craft_pricing_rf.joblib"
        self.pipeline: Pipeline = None
        self._load_or_train_model()

    def _load_or_train_model(self):
        """Load trained scikit-learn model or train on reference dataset."""
        if self.model_path.exists():
            try:
                self.pipeline = joblib.load(self.model_path)
                return
            except Exception:
                pass
        self.train_on_reference_data()

    def train_on_reference_data(self) -> Dict[str, float]:
        """Train Random Forest Regressor on authentic craft pricing dataset."""
        csv_path = settings.DATA_DIR / "reference_prices.csv"
        if not csv_path.exists():
            raise FileNotFoundError(f"Reference pricing dataset not found at {csv_path}")

        df = pd.read_csv(csv_path)

        # Features & Target
        categorical_features = ["category", "craft_type", "material"]
        numeric_features = ["production_hours", "material_cost", "labor_cost", "packaging_cost", "total_cost"]
        target = "suggested_market_price"

        X = df[categorical_features + numeric_features]
        y = df[target]

        # Pipeline: Preprocessing + Random Forest
        preprocessor = ColumnTransformer(
            transformers=[
                ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
                ("num", "passthrough", numeric_features)
            ]
        )

        model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=8)

        self.pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("regressor", model)
        ])

        self.pipeline.fit(X, y)

        # Save model
        joblib.dump(self.pipeline, self.model_path)

        # Evaluate on training data
        preds = self.pipeline.predict(X)
        mae = float(np.mean(np.abs(preds - y)))
        rmse = float(np.sqrt(np.mean((preds - y) ** 2)))
        r2 = float(self.pipeline.score(X, y))

        return {"mae": mae, "rmse": rmse, "r2": r2, "samples": len(df)}

    def predict_market_price(
        self, 
        category: str, 
        craft_type: str, 
        material: str, 
        production_hours: float, 
        material_cost: float, 
        labor_cost: float, 
        packaging_cost: float
    ) -> float:
        """Predict market value using ML model."""
        if self.pipeline is None:
            self._load_or_train_model()

        total_cost = material_cost + labor_cost + packaging_cost
        sample = pd.DataFrame([{
            "category": category,
            "craft_type": craft_type,
            "material": material,
            "production_hours": max(2.0, production_hours),
            "material_cost": material_cost,
            "labor_cost": labor_cost,
            "packaging_cost": packaging_cost,
            "total_cost": total_cost
        }])

        predicted_price = float(self.pipeline.predict(sample)[0])
        return predicted_price

pricing_ml_model = CraftPricingMLModel()
