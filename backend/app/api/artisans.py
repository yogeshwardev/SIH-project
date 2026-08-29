from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.artisan import Artisan
from backend.app.schemas.artisan import ArtisanCreate, ArtisanResponse

router = APIRouter(prefix="/artisans", tags=["Artisans & Sellers"])


@router.get("", response_model=List[ArtisanResponse])
def list_artisans(db: Session = Depends(get_db)):
    return db.query(Artisan).order_by(Artisan.created_at.desc()).all()


@router.get("/{artisan_id}", response_model=ArtisanResponse)
def get_artisan(artisan_id: int, db: Session = Depends(get_db)):
    artisan = db.query(Artisan).filter(Artisan.id == artisan_id).first()
    if not artisan:
        raise HTTPException(status_code=404, detail="Seller profile not found")
    return artisan


@router.post("", response_model=ArtisanResponse, status_code=status.HTTP_201_CREATED)
def create_artisan(payload: ArtisanCreate, db: Session = Depends(get_db)):
    artisan = Artisan(
        name=payload.name.strip(),
        store_name=payload.store_name.strip() if payload.store_name else payload.name.strip() + " Craft Studio",
        email=payload.email.strip() if payload.email else None,
        phone=payload.phone.strip() if payload.phone else None,
        language=payload.language.strip() if payload.language else "Hindi",
        region=payload.region.strip() if payload.region else "India",
        craft_category=payload.craft_category.strip() if payload.craft_category else "Handloom & Textiles",
        pan_or_gst=payload.pan_or_gst.strip() if payload.pan_or_gst else None,
        artisan_card_number=payload.artisan_card_number.strip() if payload.artisan_card_number else None,
        bank_account=payload.bank_account.strip() if payload.bank_account else None,
        ifsc_code=payload.ifsc_code.strip() if payload.ifsc_code else None,
        kyc_status="Verified",
        address=payload.address.strip() if payload.address else None,
        pincode=payload.pincode.strip() if payload.pincode else None,
        contact=payload.contact.strip() if payload.contact else (payload.phone.strip() if payload.phone else None),
    )
    db.add(artisan)
    db.commit()
    db.refresh(artisan)
    return artisan


@router.put("/{artisan_id}/verify", response_model=ArtisanResponse)
def verify_artisan_kyc(artisan_id: int, kyc_status: str = "Verified", db: Session = Depends(get_db)):
    artisan = db.query(Artisan).filter(Artisan.id == artisan_id).first()
    if not artisan:
        raise HTTPException(status_code=404, detail="Seller profile not found")
    artisan.kyc_status = kyc_status
    db.commit()
    db.refresh(artisan)
    return artisan
