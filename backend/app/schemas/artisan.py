from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class ArtisanCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    language: str = Field(default="Hindi", min_length=2, max_length=60)
    region: str = Field(min_length=2, max_length=160)
    contact: Optional[str] = Field(default=None, max_length=120)


class ArtisanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    language: str
    region: str
    contact: Optional[str]
    created_at: datetime
