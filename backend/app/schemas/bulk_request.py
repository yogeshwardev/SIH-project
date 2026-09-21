from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator

BUYER_TYPES = ("Retailer", "Exporter", "Government emporium", "Corporate gifting", "NGO / SHG", "Other")


class BulkRequestCreate(BaseModel):
    product_id: int
    buyer_name: str = Field(min_length=2, max_length=120)
    organisation: str = Field(min_length=2, max_length=160)
    buyer_type: str = Field(default="Retailer", max_length=40)
    buyer_email: EmailStr
    buyer_phone: str = Field(min_length=8, max_length=24)
    gstin: Optional[str] = Field(default=None, max_length=20)
    delivery_city: Optional[str] = Field(default=None, max_length=100)
    delivery_state: Optional[str] = Field(default=None, max_length=100)
    quantity: int = Field(ge=1, le=100000)
    target_price: Optional[float] = Field(default=None, ge=0)
    needed_by: Optional[str] = Field(default=None, max_length=40)
    message: Optional[str] = Field(default=None, max_length=1200)

    @field_validator("buyer_type")
    @classmethod
    def known_buyer_type(cls, value: str) -> str:
        clean = (value or "").strip()
        return clean if clean in BUYER_TYPES else "Other"

    @field_validator("buyer_name", "organisation", "buyer_phone")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()


class BulkQuoteCreate(BaseModel):
    quoted_unit_price: float = Field(gt=0)
    quoted_lead_time: str = Field(min_length=1, max_length=60)
    quote_note: Optional[str] = Field(default=None, max_length=1200)


class BulkDecision(BaseModel):
    decision: Literal["Accepted", "Declined"]
    buyer_email: EmailStr


class BulkRequestResponse(BaseModel):
    id: int
    reference: str
    product_id: int
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    unit_price: Optional[float] = None
    artisan_id: Optional[int] = None
    artisan_name: Optional[str] = None
    store_name: Optional[str] = None
    region: Optional[str] = None

    buyer_name: str
    organisation: str
    buyer_type: str
    buyer_email: str
    buyer_phone: str
    gstin: Optional[str] = None
    delivery_city: Optional[str] = None
    delivery_state: Optional[str] = None

    quantity: int
    target_price: Optional[float] = None
    needed_by: Optional[str] = None
    message: Optional[str] = None

    status: str
    quoted_unit_price: Optional[float] = None
    quoted_lead_time: Optional[str] = None
    quote_note: Optional[str] = None
    quoted_at: Optional[datetime] = None
    quote_total: Optional[float] = None

    created_at: datetime
    updated_at: datetime
