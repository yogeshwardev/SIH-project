from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database.database import Base

class OrderInquiry(Base):
    __tablename__ = "order_inquiries"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    buyer_name = Column(String, nullable=False)
    buyer_email = Column(String, nullable=False)
    buyer_phone = Column(String, nullable=True)
    buyer_city = Column(String, nullable=True)
    
    order_type = Column(String, default="Retail Order")  # "Retail Order", "Wholesale / Bulk Quote", "Custom Artisan Request"
    quantity = Column(Integer, default=1)
    total_amount = Column(Float, default=0.0)
    message = Column(Text, nullable=True)
    
    status = Column(String, default="New", index=True)  # "New", "Contacted", "Dispatched", "Completed"
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    product = relationship("Product", back_populates="inquiries")
