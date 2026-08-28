from datetime import datetime
from typing import List, Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class CheckoutItem(BaseModel):
    product_id: int
    quantity: int = Field(ge=1, le=25)


class CheckoutCreate(BaseModel):
    buyer_name: str = Field(min_length=2, max_length=120)
    buyer_email: EmailStr
    buyer_phone: str = Field(min_length=8, max_length=24)
    address_line1: str = Field(min_length=5, max_length=200)
    address_line2: Optional[str] = Field(default=None, max_length=200)
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    postal_code: str = Field(min_length=6, max_length=6)
    payment_method: Literal["cod"] = "cod"
    items: List[CheckoutItem] = Field(min_length=1, max_length=25)

    @field_validator("postal_code")
    @classmethod
    def validate_postal_code(cls, value: str) -> str:
        clean = value.strip()
        if not clean.isdigit():
            raise ValueError("Postal code must contain exactly 6 digits.")
        return clean

    @field_validator("buyer_name", "buyer_phone", "address_line1", "city", "state")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        return value.strip()


class OrderItemResponse(BaseModel):
    product_id: int
    artisan_id: Optional[int] = None
    product_name: str
    product_image: Optional[str] = None
    unit_price: float
    quantity: int
    line_total: float


class OrderResponse(BaseModel):
    id: int
    order_number: str
    buyer_name: str
    buyer_email: str
    buyer_phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    postal_code: str
    payment_method: str
    payment_status: str
    status: str
    subtotal: float
    shipping_amount: float
    tax_amount: float
    total_amount: float
    items: List[OrderItemResponse]
    created_at: datetime
    updated_at: datetime


class OrderStatusUpdate(BaseModel):
    status: Literal["Placed", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"]

