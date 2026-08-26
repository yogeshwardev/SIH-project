from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime
from backend.app.database.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    artisan_id = Column(Integer, ForeignKey("artisans.id"), nullable=True)
    
    # Media & Multimodal Inputs
    original_image = Column(String, nullable=True)
    enhanced_image = Column(String, nullable=True)
    audio_file = Column(String, nullable=True)
    transcript = Column(Text, nullable=True)
    detected_language = Column(String, default="Hindi")

    # Structured Product Attributes
    product_name = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    material = Column(String, nullable=True)
    craft_type = Column(String, nullable=True, index=True)
    color = Column(String, nullable=True)
    technique = Column(String, nullable=True)
    dimensions = Column(String, nullable=True)
    weight = Column(String, nullable=True)
    production_time = Column(String, nullable=True)
    region = Column(String, nullable=True)

    # Generated Multilingual Listings
    title = Column(String, nullable=True)
    title_hindi = Column(String, nullable=True)
    short_description = Column(Text, nullable=True)
    short_description_hindi = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    description_hindi = Column(Text, nullable=True)
    specifications = Column(Text, nullable=True)  # JSON-serialized list of strings
    keywords = Column(Text, nullable=True)        # JSON-serialized list of strings

    # Smart Pricing Economics (All in INR ₹)
    material_cost = Column(Float, default=0.0)
    labor_cost = Column(Float, default=0.0)
    packaging_cost = Column(Float, default=0.0)
    total_cost = Column(Float, default=0.0)

    minimum_price = Column(Float, default=0.0)
    recommended_min_price = Column(Float, default=0.0)
    recommended_max_price = Column(Float, default=0.0)
    suggested_price = Column(Float, default=0.0)
    
    pricing_explanation = Column(Text, nullable=True)  # JSON-serialized explanation breakdown
    ai_confidence = Column(Text, nullable=True)         # JSON-serialized confidence metrics

    # E-Commerce & Marketplace Governance Fields
    status = Column(String, default="Pending Approval", index=True)  # 'Pending Approval', 'Published', 'Rejected', 'Draft'
    admin_notes = Column(Text, nullable=True)
    admin_reviewed_at = Column(DateTime, nullable=True)
    rating = Column(Float, default=4.9)
    review_count = Column(Integer, default=18)
    stock_quantity = Column(Integer, default=5)
    is_featured = Column(Boolean, default=False)
    badge = Column(String, default="GI Certified")  # "GI Certified", "Master Artisan", "Heritage", "Bestseller"

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    artisan = relationship("Artisan", back_populates="products")
    inquiries = relationship("OrderInquiry", back_populates="product", cascade="all, delete-orphan")
