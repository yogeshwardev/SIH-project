from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database.database import Base

class Artisan(Base):
    __tablename__ = "artisans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False, index=True)
    store_name = Column(String, nullable=True, index=True)
    email = Column(String, nullable=True, index=True)
    phone = Column(String, nullable=True)
    language = Column(String, default="Hindi")
    region = Column(String, nullable=False)
    craft_category = Column(String, default="Handloom & Textiles")
    pan_or_gst = Column(String, nullable=True)
    artisan_card_number = Column(String, nullable=True)
    bank_account = Column(String, nullable=True)
    ifsc_code = Column(String, nullable=True)
    kyc_status = Column(String, default="Verified")
    address = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    contact = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    products = relationship("Product", back_populates="artisan", cascade="all, delete-orphan")
