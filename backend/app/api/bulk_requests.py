"""B2B market linkage: bulk quotation requests between buyers and artisans.

Physical fairs connect artisans to wholesale buyers a few days a year. These
endpoints keep that channel open all year: a buyer asks for a quantity, the
artisan answers with a price and lead time, and the buyer accepts or declines.
"""
import secrets
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from backend.app.database.database import get_db
from backend.app.models.bulk_request import BulkRequest
from backend.app.models.product import Product
from backend.app.schemas.bulk_request import (
    BulkDecision,
    BulkQuoteCreate,
    BulkRequestCreate,
    BulkRequestResponse,
)

router = APIRouter(prefix="/bulk-requests", tags=["B2B Market Linkage"])


def _reference() -> str:
    return f"RFQ-{datetime.utcnow().strftime('%y%m%d')}-{secrets.token_hex(3).upper()}"


def _format(request: BulkRequest) -> BulkRequestResponse:
    product = request.product
    artisan = request.artisan
    quote_total = (
        round(float(request.quoted_unit_price) * int(request.quantity), 2)
        if request.quoted_unit_price is not None
        else None
    )
    return BulkRequestResponse(
        id=request.id,
        reference=request.reference,
        product_id=request.product_id,
        product_name=product.product_name if product else None,
        product_image=(product.enhanced_image or product.original_image) if product else None,
        unit_price=float(product.suggested_price) if product else None,
        artisan_id=request.artisan_id,
        artisan_name=artisan.name if artisan else None,
        store_name=artisan.store_name if artisan else None,
        region=artisan.region if artisan else (product.region if product else None),
        buyer_name=request.buyer_name,
        organisation=request.organisation,
        buyer_type=request.buyer_type,
        buyer_email=request.buyer_email,
        buyer_phone=request.buyer_phone,
        gstin=request.gstin,
        delivery_city=request.delivery_city,
        delivery_state=request.delivery_state,
        quantity=request.quantity,
        target_price=request.target_price,
        needed_by=request.needed_by,
        message=request.message,
        status=request.status,
        quoted_unit_price=request.quoted_unit_price,
        quoted_lead_time=request.quoted_lead_time,
        quote_note=request.quote_note,
        quoted_at=request.quoted_at,
        quote_total=quote_total,
        created_at=request.created_at,
        updated_at=request.updated_at,
    )


def _load(db: Session, reference: str) -> BulkRequest:
    request = (
        db.query(BulkRequest)
        .options(joinedload(BulkRequest.product), joinedload(BulkRequest.artisan))
        .filter(BulkRequest.reference == reference.strip().upper())
        .first()
    )
    if not request:
        raise HTTPException(status_code=404, detail="Bulk request not found.")
    return request


@router.post("", response_model=BulkRequestResponse, status_code=status.HTTP_201_CREATED)
def create_bulk_request(payload: BulkRequestCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found.")
    if product.status != "Published":
        raise HTTPException(status_code=409, detail="This product is not available for bulk orders yet.")

    request = BulkRequest(
        reference=_reference(),
        product_id=product.id,
        artisan_id=product.artisan_id,
        buyer_name=payload.buyer_name,
        organisation=payload.organisation,
        buyer_type=payload.buyer_type,
        buyer_email=str(payload.buyer_email).lower(),
        buyer_phone=payload.buyer_phone,
        gstin=(payload.gstin or "").strip().upper() or None,
        delivery_city=payload.delivery_city,
        delivery_state=payload.delivery_state,
        quantity=payload.quantity,
        target_price=payload.target_price,
        needed_by=payload.needed_by,
        message=payload.message,
        status="Open",
    )
    db.add(request)
    db.commit()
    db.refresh(request)
    return _format(request)


@router.get("", response_model=List[BulkRequestResponse])
def list_bulk_requests(
    artisan_id: Optional[int] = Query(None),
    buyer_email: Optional[str] = Query(None),
    request_status: Optional[str] = Query(None, alias="status"),
    db: Session = Depends(get_db),
):
    query = db.query(BulkRequest).options(joinedload(BulkRequest.product), joinedload(BulkRequest.artisan))
    if artisan_id is not None:
        query = query.filter(BulkRequest.artisan_id == artisan_id)
    if buyer_email:
        query = query.filter(BulkRequest.buyer_email == buyer_email.strip().lower())
    if request_status:
        query = query.filter(BulkRequest.status == request_status)
    return [_format(item) for item in query.order_by(BulkRequest.created_at.desc()).all()]


@router.get("/{reference}", response_model=BulkRequestResponse)
def get_bulk_request(reference: str, db: Session = Depends(get_db)):
    return _format(_load(db, reference))


@router.post("/{reference}/quote", response_model=BulkRequestResponse)
def quote_bulk_request(reference: str, payload: BulkQuoteCreate, db: Session = Depends(get_db)):
    request = _load(db, reference)
    if request.status in {"Accepted", "Declined", "Closed"}:
        raise HTTPException(status_code=409, detail=f"This request is already {request.status.lower()}.")
    request.quoted_unit_price = round(float(payload.quoted_unit_price), 2)
    request.quoted_lead_time = payload.quoted_lead_time.strip()
    request.quote_note = (payload.quote_note or "").strip() or None
    request.quoted_at = datetime.utcnow()
    request.status = "Quoted"
    db.commit()
    db.refresh(request)
    return _format(request)


@router.post("/{reference}/decision", response_model=BulkRequestResponse)
def decide_bulk_request(reference: str, payload: BulkDecision, db: Session = Depends(get_db)):
    request = _load(db, reference)
    if request.buyer_email != str(payload.buyer_email).lower():
        raise HTTPException(status_code=403, detail="This request belongs to a different buyer email.")
    if request.status != "Quoted":
        raise HTTPException(status_code=409, detail="Only a quoted request can be accepted or declined.")
    request.status = payload.decision
    db.commit()
    db.refresh(request)
    return _format(request)
