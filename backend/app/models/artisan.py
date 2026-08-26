from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database.database import Base

class Artisan(Base):
    __tablename__ = "artisans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False, index=True)
    language = Column(String, default="Hindi")
    region = Column(String, nullable=False)
    contact = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    products = relationship("Product", back_populates="artisan", cascade="all, delete-orphan")
