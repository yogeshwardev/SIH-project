from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ArtisanCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    store_name: Optional[str] = Field(default=None, max_length=150)
    email: Optional[str] = Field(default=None, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=30)
    language: str = Field(default="Hindi", min_length=2, max_length=60)
    region: str = Field(min_length=2, max_length=160)
    craft_category: Optional[str] = Field(default="Handloom & Textiles", max_length=120)
    pan_or_gst: Optional[str] = Field(default=None, max_length=50)
    artisan_card_number: Optional[str] = Field(default=None, max_length=60)
    bank_account: Optional[str] = Field(default=None, max_length=50)
    ifsc_code: Optional[str] = Field(default=None, max_length=30)
    address: Optional[str] = Field(default=None, max_length=250)
    pincode: Optional[str] = Field(default=None, max_length=20)
    contact: Optional[str] = Field(default=None, max_length=120)


class ArtisanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    store_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    language: str
    region: str
    craft_category: Optional[str] = None
    pan_or_gst: Optional[str] = None
    artisan_card_number: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = None
    kyc_status: Optional[str] = "Verified"
    address: Optional[str] = None
    pincode: Optional[str] = None
    contact: Optional[str] = None
    created_at: datetime
