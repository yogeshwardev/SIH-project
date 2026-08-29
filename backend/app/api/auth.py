from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from backend.app.database.database import get_db
from backend.app.models.artisan import Artisan

router = APIRouter(prefix="/auth", tags=["Authentication & User Accounts"])

# In-memory session / user registry for instant zero-dependency auth
DEMO_BUYER_USERS = {
    "buyer@craftlink.in": {
        "id": 1,
        "name": "Priya Sharma",
        "email": "buyer@craftlink.in",
        "phone": "+91 98765 43210",
        "role": "buyer",
        "default_pincode": "110001",
        "default_city": "New Delhi",
        "created_at": "2026-01-15T10:00:00Z"
    }
}

class LoginRequest(BaseModel):
    email_or_phone: str
    password: Optional[str] = "password"
    role: str = "buyer" # buyer, seller, admin

class RegisterBuyerRequest(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    email: str = Field(min_length=3, max_length=120)
    phone: str = Field(min_length=10, max_length=20)
    password: Optional[str] = "password"
    pincode: Optional[str] = "110001"
    city: Optional[str] = "New Delhi"

class RegisterSellerRequest(BaseModel):
    owner_name: str = Field(min_length=2, max_length=120)
    store_name: str = Field(min_length=2, max_length=150)
    email: str = Field(min_length=3, max_length=120)
    phone: str = Field(min_length=10, max_length=20)
    craft_category: str = Field(default="Handloom & Textiles")
    region: str = Field(default="Varanasi, Uttar Pradesh")
    artisan_card_number: Optional[str] = None
    pan_or_gst: Optional[str] = None
    bank_account: Optional[str] = None
    ifsc_code: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None

class AdminLoginRequest(BaseModel):
    admin_id: str
    access_key: str
    officer_name: Optional[str] = "Govt. Officer - Quality & Governance"


@router.post("/login")
def login_user(payload: LoginRequest, db: Session = Depends(get_db)):
    identifier = payload.email_or_phone.strip().lower()
    
    if payload.role == "seller":
        # Look up or create seller profile
        artisan = db.query(Artisan).filter(
            (Artisan.email == identifier) | (Artisan.phone == identifier) | (Artisan.name.ilike(f"%{identifier}%")) | (Artisan.store_name.ilike(f"%{identifier}%"))
        ).first()
        
        if not artisan:
            # Create a default active seller profile if logging in for the first time
            artisan = Artisan(
                name=payload.email_or_phone.split("@")[0].title() if "@" in payload.email_or_phone else "Master Artisan",
                store_name=f"{payload.email_or_phone.split('@')[0].title()} Studio",
                email=payload.email_or_phone if "@" in payload.email_or_phone else None,
                phone=payload.email_or_phone if "@" not in payload.email_or_phone else "+91 98765 00000",
                language="Hindi",
                region="Varanasi, Uttar Pradesh",
                craft_category="Handloom & Textiles",
                kyc_status="Verified"
            )
            db.add(artisan)
            db.commit()
            db.refresh(artisan)
            
        return {
            "status": "success",
            "token": f"seller_token_{artisan.id}",
            "user": {
                "id": artisan.id,
                "name": artisan.name,
                "store_name": artisan.store_name,
                "email": artisan.email,
                "phone": artisan.phone,
                "role": "seller",
                "craft_category": artisan.craft_category,
                "region": artisan.region,
                "kyc_status": artisan.kyc_status,
                "bank_account": artisan.bank_account,
                "ifsc_code": artisan.ifsc_code
            }
        }
        
    elif payload.role == "admin":
        return {
            "status": "success",
            "token": "admin_master_token_secure",
            "user": {
                "id": 999,
                "name": "National Compliance Officer",
                "designation": "Director of GI & Artisan Standards",
                "department": "Handloom & Handicrafts Producer Gateway",
                "role": "admin"
            }
        }
        
    else: # buyer
        user = DEMO_BUYER_USERS.get(identifier, {
            "id": int(datetime.utcnow().timestamp()),
            "name": payload.email_or_phone.split("@")[0].title(),
            "email": payload.email_or_phone if "@" in payload.email_or_phone else f"{payload.email_or_phone}@craftlink.in",
            "phone": payload.email_or_phone if "@" not in payload.email_or_phone else "+91 98765 43210",
            "role": "buyer",
            "default_pincode": "110001",
            "default_city": "New Delhi"
        })
        return {
            "status": "success",
            "token": f"buyer_token_{user['id']}",
            "user": user
        }


@router.post("/buyer/register", status_code=status.HTTP_201_CREATED)
def register_buyer(payload: RegisterBuyerRequest):
    user_id = int(datetime.utcnow().timestamp())
    user = {
        "id": user_id,
        "name": payload.name.strip(),
        "email": payload.email.strip().lower(),
        "phone": payload.phone.strip(),
        "role": "buyer",
        "default_pincode": payload.pincode or "110001",
        "default_city": payload.city or "New Delhi",
        "created_at": datetime.utcnow().isoformat()
    }
    DEMO_BUYER_USERS[user["email"]] = user
    return {
        "status": "success",
        "message": "Buyer account registered successfully",
        "token": f"buyer_token_{user_id}",
        "user": user
    }


@router.post("/seller/register", status_code=status.HTTP_201_CREATED)
def register_seller(payload: RegisterSellerRequest, db: Session = Depends(get_db)):
    artisan = Artisan(
        name=payload.owner_name.strip(),
        store_name=payload.store_name.strip(),
        email=payload.email.strip().lower(),
        phone=payload.phone.strip(),
        craft_category=payload.craft_category.strip(),
        region=payload.region.strip(),
        artisan_card_number=payload.artisan_card_number.strip() if payload.artisan_card_number else None,
        pan_or_gst=payload.pan_or_gst.strip() if payload.pan_or_gst else None,
        bank_account=payload.bank_account.strip() if payload.bank_account else None,
        ifsc_code=payload.ifsc_code.strip() if payload.ifsc_code else None,
        address=payload.address.strip() if payload.address else None,
        pincode=payload.pincode.strip() if payload.pincode else None,
        contact=payload.phone.strip(),
        kyc_status="Verified" # Instant activation on national portal
    )
    db.add(artisan)
    db.commit()
    db.refresh(artisan)
    
    return {
        "status": "success",
        "message": "Seller store registered and verified on CraftLink Producer Network",
        "token": f"seller_token_{artisan.id}",
        "user": {
            "id": artisan.id,
            "name": artisan.name,
            "store_name": artisan.store_name,
            "email": artisan.email,
            "phone": artisan.phone,
            "role": "seller",
            "craft_category": artisan.craft_category,
            "region": artisan.region,
            "kyc_status": artisan.kyc_status,
            "bank_account": artisan.bank_account,
            "ifsc_code": artisan.ifsc_code
        }
    }


@router.post("/admin/login")
def admin_login(payload: AdminLoginRequest):
    return {
        "status": "success",
        "token": "admin_gov_secure_token",
        "user": {
            "id": 101,
            "name": payload.officer_name or "National Governance Director",
            "admin_id": payload.admin_id,
            "role": "admin",
            "department": "National Handicrafts & Handlooms Regulatory Directorate",
            "access_level": "SuperAdmin / Full Governance Clearance"
        }
    }
