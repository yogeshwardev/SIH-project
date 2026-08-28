from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Image Enhancement Schemas ---
class ImageEnhanceResponse(BaseModel):
    original_image_url: str
    enhanced_image_url: str
    detected_objects: List[str]
    dominant_colors: List[str]
    processing_time_seconds: float
    confidence_score: float
    segmentation_engine: Optional[str] = None
    mask_quality_score: Optional[float] = None
    confidence_breakdown: Dict[str, float] = Field(default_factory=dict)
    latency_breakdown: Dict[str, float] = Field(default_factory=dict)

# --- Speech Transcription Schemas ---
class SpeechTranscribeResponse(BaseModel):
    transcript: str
    detected_language: str
    confidence: float
    audio_duration_seconds: Optional[float] = 0.0
    processing_time_seconds: Optional[float] = 0.0
    realtime_factor: Optional[float] = 0.0
    engine: Optional[str] = None
    confidence_details: Dict[str, float] = Field(default_factory=dict)

class SpeechSynthesizeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=4096)
    language: Optional[str] = "hi-IN"

class ProductInterviewRequest(BaseModel):
    # An empty utterance starts the guided interview and returns question one.
    utterance: str = Field(default="", max_length=4096)
    conversation_transcript: Optional[str] = ""
    language: Optional[str] = "Hindi"
    detected_objects: List[str] = Field(default_factory=list)
    known_attributes: Dict[str, Any] = Field(default_factory=dict)
    cost_inputs: Dict[str, Any] = Field(default_factory=dict)
    last_question_key: Optional[str] = None

class ProductInterviewResponse(BaseModel):
    status: str
    assistant_message: str
    next_question_key: Optional[str] = None
    missing_fields: List[str] = Field(default_factory=list)
    readiness_score: float
    confidence_score: float
    human_confirmed: bool = False
    attributes: Dict[str, Any] = Field(default_factory=dict)
    cost_inputs: Dict[str, Any] = Field(default_factory=dict)
    evidence: Dict[str, str] = Field(default_factory=dict)
    turn_summary: str
    question_number: int = 1
    total_questions: int = 7

# --- Product Intelligence Extraction Schemas ---
class ProductExtractRequest(BaseModel):
    transcript: str
    detected_objects: Optional[List[str]] = []
    language: Optional[str] = "Hindi"

class ProductAttributes(BaseModel):
    product_name: str
    category: str
    material: str
    craft_type: str
    color: Optional[str] = "Natural / Multi-color"
    technique: Optional[str] = "Handcrafted"
    dimensions: Optional[str] = "Not provided"
    weight: Optional[str] = "Not provided"
    production_time: Optional[str] = "Not provided"
    region: Optional[str] = "India"
    artisan_description: Optional[str] = "Not provided"
    confidence_scores: Dict[str, str] = Field(default_factory=dict)

# --- Listing Generation Schemas ---
class ListingGenerateRequest(BaseModel):
    attributes: ProductAttributes
    artisan_name: Optional[str] = "Master Artisan"
    target_languages: Optional[List[str]] = ["English", "Hindi", "Telugu"]

class MultilingualListingResponse(BaseModel):
    title_en: str
    title_hi: str
    short_desc_en: str
    short_desc_hi: str
    description_en: str
    description_hi: str
    title_te: str
    short_desc_te: str
    description_te: str
    specifications: List[str]
    keywords: List[str]
    authenticity_notes: str

# --- Pricing Schemas ---
class PriceCalculateRequest(BaseModel):
    material_cost: float = Field(..., ge=0)
    labor_cost: float = Field(..., ge=0)
    packaging_cost: float = Field(default=0.0, ge=0)
    production_time: Optional[str] = "1 day"
    category: Optional[str] = "Handloom & Textiles"
    craft_type: Optional[str] = "Handcrafted"
    material: Optional[str] = "Natural"

class PriceBreakdownItem(BaseModel):
    label: str
    amount: float
    percentage: float
    description: str

class PriceRecommendationResponse(BaseModel):
    total_cost: float
    minimum_sustainable_price: float
    recommended_min_price: float
    recommended_max_price: float
    suggested_price: float
    profit_margin_percentage: float
    market_reference_range: str
    price_breakdown: List[PriceBreakdownItem]
    explanation: str
    pricing_model_type: str
    pricing_confidence_score: float = 0.0
    confidence_level: str = "LOW"
    benchmark_sample_count: int = 0
    benchmark_similarity_score: float = 0.0
    requires_human_review: bool = True
    assumptions: List[str] = Field(default_factory=list)

# --- Product Entity CRUD Schemas ---
class ProductCreate(BaseModel):
    artisan_id: Optional[int] = None
    original_image: Optional[str] = None
    enhanced_image: Optional[str] = None
    audio_file: Optional[str] = None
    transcript: Optional[str] = None
    detected_language: Optional[str] = "Hindi"

    product_name: str
    category: str
    material: Optional[str] = None
    craft_type: Optional[str] = None
    color: Optional[str] = None
    technique: Optional[str] = None
    dimensions: Optional[str] = None
    weight: Optional[str] = None
    production_time: Optional[str] = None
    region: Optional[str] = None

    title: Optional[str] = None
    title_hindi: Optional[str] = None
    title_telugu: Optional[str] = None
    short_description: Optional[str] = None
    short_description_hindi: Optional[str] = None
    short_description_telugu: Optional[str] = None
    description: Optional[str] = None
    description_hindi: Optional[str] = None
    description_telugu: Optional[str] = None
    specifications: Optional[List[str]] = []
    keywords: Optional[List[str]] = []

    material_cost: float = 0.0
    labor_cost: float = 0.0
    packaging_cost: float = 0.0
    total_cost: float = 0.0

    minimum_price: float = 0.0
    recommended_min_price: float = 0.0
    recommended_max_price: float = 0.0
    suggested_price: float = 0.0

    pricing_explanation: Optional[Dict[str, Any]] = None
    ai_confidence: Optional[Dict[str, Any]] = None
    
    # E-commerce fields
    status: Optional[str] = "Pending Approval"
    stock_quantity: int = Field(default=1, ge=0, le=100000)
    badge: Optional[str] = None
    is_featured: Optional[bool] = False

class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    category: Optional[str] = None
    material: Optional[str] = None
    craft_type: Optional[str] = None
    color: Optional[str] = None
    technique: Optional[str] = None
    dimensions: Optional[str] = None
    weight: Optional[str] = None
    production_time: Optional[str] = None
    region: Optional[str] = None

    title: Optional[str] = None
    title_hindi: Optional[str] = None
    title_telugu: Optional[str] = None
    short_description: Optional[str] = None
    short_description_hindi: Optional[str] = None
    short_description_telugu: Optional[str] = None
    description: Optional[str] = None
    description_hindi: Optional[str] = None
    description_telugu: Optional[str] = None
    specifications: Optional[List[str]] = None
    keywords: Optional[List[str]] = None

    material_cost: Optional[float] = None
    labor_cost: Optional[float] = None
    packaging_cost: Optional[float] = None
    total_cost: Optional[float] = None

    minimum_price: Optional[float] = None
    recommended_min_price: Optional[float] = None
    recommended_max_price: Optional[float] = None
    suggested_price: Optional[float] = None
    
    status: Optional[str] = None
    admin_notes: Optional[str] = None
    stock_quantity: Optional[int] = None
    is_featured: Optional[bool] = None
    badge: Optional[str] = None

class ProductResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    artisan_id: Optional[int]
    artisan_name: Optional[str] = None
    artisan_region: Optional[str] = None
    original_image: Optional[str]
    enhanced_image: Optional[str]
    audio_file: Optional[str]
    transcript: Optional[str]
    detected_language: Optional[str]

    product_name: str
    category: str
    material: Optional[str]
    craft_type: Optional[str]
    color: Optional[str]
    technique: Optional[str]
    dimensions: Optional[str]
    weight: Optional[str]
    production_time: Optional[str]
    region: Optional[str]

    title: Optional[str]
    title_hindi: Optional[str]
    title_telugu: Optional[str]
    short_description: Optional[str]
    short_description_hindi: Optional[str]
    short_description_telugu: Optional[str]
    description: Optional[str]
    description_hindi: Optional[str]
    description_telugu: Optional[str]
    specifications: Optional[List[str]] = []
    keywords: Optional[List[str]] = []

    material_cost: float
    labor_cost: float
    packaging_cost: float
    total_cost: float

    minimum_price: float
    recommended_min_price: float
    recommended_max_price: float
    suggested_price: float

    pricing_explanation: Optional[Dict[str, Any]] = None
    ai_confidence: Optional[Dict[str, Any]] = None
    
    status: str
    admin_notes: Optional[str] = None
    admin_reviewed_at: Optional[datetime] = None
    rating: float = 0.0
    review_count: int = 0
    stock_quantity: int = 0
    is_featured: bool = False
    badge: Optional[str] = None
    
    created_at: datetime
    updated_at: datetime

# --- Order & Inquiry Schemas ---
class OrderInquiryCreate(BaseModel):
    product_id: int
    buyer_name: str
    buyer_email: str
    buyer_phone: Optional[str] = None
    buyer_city: Optional[str] = "New Delhi"
    order_type: Optional[str] = "Retail Order"
    quantity: int = 1
    total_amount: float
    message: Optional[str] = None

class OrderInquiryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    product_id: int
    product_name: Optional[str] = None
    product_image: Optional[str] = None
    buyer_name: str
    buyer_email: str
    buyer_phone: Optional[str]
    buyer_city: Optional[str]
    order_type: str
    quantity: int
    total_amount: float
    message: Optional[str]
    status: str
    created_at: datetime

class AdminActionRequest(BaseModel):
    admin_notes: Optional[str] = "Approved by CraftLink AI Quality Assurance"
