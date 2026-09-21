from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from backend.app.database.database import Base


class BulkRequest(Base):
    """A B2B / institutional buyer asking an artisan for a bulk quotation.

    This is the market-linkage path that physical exhibitions provide today:
    an exporter, retail chain, government emporium or gifting buyer asks for a
    quantity and a delivery date, and the artisan answers with a price.
    """

    __tablename__ = "bulk_requests"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    reference = Column(String, unique=True, nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False, index=True)
    artisan_id = Column(Integer, ForeignKey("artisans.id"), nullable=True, index=True)

    # Buyer organisation
    buyer_name = Column(String, nullable=False)
    organisation = Column(String, nullable=False)
    buyer_type = Column(String, nullable=False, default="Retailer")  # Retailer, Exporter, Government emporium, Corporate gifting, NGO / SHG
    buyer_email = Column(String, nullable=False, index=True)
    buyer_phone = Column(String, nullable=False)
    gstin = Column(String, nullable=True)
    delivery_city = Column(String, nullable=True)
    delivery_state = Column(String, nullable=True)

    # Requirement
    quantity = Column(Integer, nullable=False, default=1)
    target_price = Column(Float, nullable=True)
    needed_by = Column(String, nullable=True)
    message = Column(Text, nullable=True)

    # Artisan response
    status = Column(String, nullable=False, default="Open", index=True)  # Open, Quoted, Accepted, Declined, Closed
    quoted_unit_price = Column(Float, nullable=True)
    quoted_lead_time = Column(String, nullable=True)
    quote_note = Column(Text, nullable=True)
    quoted_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    product = relationship("Product")
    artisan = relationship("Artisan")
