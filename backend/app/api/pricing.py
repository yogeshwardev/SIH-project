import pandas as pd
from fastapi import APIRouter, HTTPException
from backend.app.config import settings
from backend.app.schemas.product import PriceCalculateRequest, PriceRecommendationResponse
from backend.app.services.pricing_service import pricing_service

router = APIRouter(prefix="/pricing", tags=["Smart Pricing Engine"])

@router.post("/calculate", response_model=PriceRecommendationResponse)
async def calculate_pricing(req: PriceCalculateRequest):
    """
    Calculate fair-trade sustainable pricing, recommended min-max ranges,
    and suggested retail price.
    """
    try:
        return pricing_service.calculate_price_recommendation(req)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Price calculation error: {str(e)}")

@router.get("/reference-data")
async def get_reference_pricing_data():
    """
    Returns reference craft pricing data from authentic guild & cluster benchmark dataset.
    """
    csv_path = settings.DATA_DIR / "reference_prices.csv"
    if not csv_path.exists():
        return {"data": [], "count": 0}
    df = pd.read_csv(csv_path)
    records = df.to_dict(orient="records")
    return {"data": records, "count": len(records)}
