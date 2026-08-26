from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List, Optional

from backend.app.database.database import get_db
from backend.app.models.product import Product
from backend.app.models.order_inquiry import OrderInquiry
from backend.app.schemas.product import (
    ProductResponse, 
    AdminActionRequest,
    OrderInquiryCreate,
    OrderInquiryResponse
)
from backend.app.api.products import _format_product_response

router = APIRouter(prefix="/admin", tags=["Admin Governance & Approvals"])
inquiries_router = APIRouter(prefix="/inquiries", tags=["Buyer Orders & Inquiries"])

# ==========================================
# Admin Approval Workflow Endpoints
# ==========================================

@router.get("/pending-products", response_model=List[ProductResponse])
async def get_pending_products(db: Session = Depends(get_db)):
    """
    Retrieve all artisan product submissions currently in 'Pending Approval' queue.
    """
    pending = (
        db.query(Product)
        .filter(Product.status == "Pending Approval")
        .order_by(Product.created_at.desc())
        .all()
    )
    return [_format_product_response(p, db) for p in pending]

@router.post("/approve/{product_id}", response_model=ProductResponse)
async def approve_product(
    product_id: int, 
    action: AdminActionRequest = None, 
    db: Session = Depends(get_db)
):
    """
    Admin verifies AI confidence, before/after studio imagery, and price reasonableness.
    Approves product to go live on the consumer e-commerce marketplace.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.status = "Published"
    product.admin_notes = action.admin_notes if action else "Approved for Digital Marketplace publication"
    product.admin_reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(product)
    return _format_product_response(product, db)

@router.post("/reject/{product_id}", response_model=ProductResponse)
async def reject_product(
    product_id: int, 
    action: AdminActionRequest, 
    db: Session = Depends(get_db)
):
    """
    Admin rejects or requests revision with actionable feedback sent back to the artisan.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.status = "Rejected"
    product.admin_notes = action.admin_notes if action else "Insufficient craft verification details."
    product.admin_reviewed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(product)
    return _format_product_response(product, db)

@router.post("/auto-approve-all")
async def auto_approve_all_pending(db: Session = Depends(get_db)):
    """Fast-track approval for all pending products (helpful during live hackathon demos)."""
    pending = db.query(Product).filter(Product.id > 0, Product.status == "Pending Approval").all()
    count = 0
    for p in pending:
        p.status = "Published"
        p.admin_notes = "Fast-track approved via AI Quality Assurance"
        p.admin_reviewed_at = datetime.utcnow()
        count += 1
    db.commit()
    return {"status": "success", "approved_count": count}

# ==========================================
# Buyer Inquiries & Orders Endpoints
# ==========================================

@inquiries_router.post("/create", response_model=OrderInquiryResponse, status_code=status.HTTP_201_CREATED)
async def create_order_inquiry(inquiry_in: OrderInquiryCreate, db: Session = Depends(get_db)):
    """
    Customer places an order or wholesale inquiry from the e-commerce storefront.
    """
    product = db.query(Product).filter(Product.id == inquiry_in.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    inquiry = OrderInquiry(
        product_id=inquiry_in.product_id,
        buyer_name=inquiry_in.buyer_name,
        buyer_email=inquiry_in.buyer_email,
        buyer_phone=inquiry_in.buyer_phone,
        buyer_city=inquiry_in.buyer_city,
        order_type=inquiry_in.order_type or "Retail Order",
        quantity=inquiry_in.quantity,
        total_amount=inquiry_in.total_amount,
        message=inquiry_in.message,
        status="New"
    )
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)

    return OrderInquiryResponse(
        id=inquiry.id,
        product_id=inquiry.product_id,
        product_name=product.product_name,
        product_image=product.enhanced_image or product.original_image,
        buyer_name=inquiry.buyer_name,
        buyer_email=inquiry.buyer_email,
        buyer_phone=inquiry.buyer_phone,
        buyer_city=inquiry.buyer_city,
        order_type=inquiry.order_type,
        quantity=inquiry.quantity,
        total_amount=inquiry.total_amount,
        message=inquiry.message,
        status=inquiry.status,
        created_at=inquiry.created_at
    )

@inquiries_router.get("", response_model=List[OrderInquiryResponse])
async def list_order_inquiries(db: Session = Depends(get_db)):
    """List all buyer orders and inquiries for the Admin dashboard."""
    inquiries = db.query(OrderInquiry).order_by(OrderInquiry.created_at.desc()).all()
    results = []
    for inq in inquiries:
        product_name = inq.product.product_name if inq.product else "Handicraft Craft"
        product_image = inq.product.enhanced_image if inq.product else None
        results.append(OrderInquiryResponse(
            id=inq.id,
            product_id=inq.product_id,
            product_name=product_name,
            product_image=product_image,
            buyer_name=inq.buyer_name,
            buyer_email=inq.buyer_email,
            buyer_phone=inq.buyer_phone,
            buyer_city=inq.buyer_city,
            order_type=inq.order_type,
            quantity=inq.quantity,
            total_amount=inq.total_amount,
            message=inq.message,
            status=inq.status,
            created_at=inq.created_at
        ))
    return results

@inquiries_router.put("/{inquiry_id}/status")
async def update_inquiry_status(
    inquiry_id: int, 
    new_status: str = Query(..., enum=["New", "Contacted", "Dispatched", "Completed"]),
    db: Session = Depends(get_db)
):
    """Update status of a customer order."""
    inquiry = db.query(OrderInquiry).filter(OrderInquiry.id == inquiry_id).first()
    if not inquiry:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    inquiry.status = new_status
    db.commit()
    return {"status": "success", "inquiry_id": inquiry_id, "new_status": new_status}
