from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.artisan import Artisan
from backend.app.schemas.artisan import ArtisanCreate, ArtisanResponse


router = APIRouter(prefix="/artisans", tags=["Artisans"])


@router.get("", response_model=List[ArtisanResponse])
def list_artisans(db: Session = Depends(get_db)):
    return db.query(Artisan).order_by(Artisan.created_at.desc()).all()


@router.get("/{artisan_id}", response_model=ArtisanResponse)
def get_artisan(artisan_id: int, db: Session = Depends(get_db)):
    artisan = db.query(Artisan).filter(Artisan.id == artisan_id).first()
    if not artisan:
        raise HTTPException(status_code=404, detail="Artisan profile not found")
    return artisan


@router.post("", response_model=ArtisanResponse, status_code=status.HTTP_201_CREATED)
def create_artisan(payload: ArtisanCreate, db: Session = Depends(get_db)):
    artisan = Artisan(
        name=payload.name.strip(),
        language=payload.language.strip(),
        region=payload.region.strip(),
        contact=payload.contact.strip() if payload.contact else None,
    )
    db.add(artisan)
    db.commit()
    db.refresh(artisan)
    return artisan
