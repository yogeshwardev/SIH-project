from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ArtisanBase(BaseModel):
    name: str
    language: Optional[str] = "Hindi"
    region: str
    contact: Optional[str] = None

class ArtisanCreate(ArtisanBase):
    pass

class ArtisanResponse(ArtisanBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
