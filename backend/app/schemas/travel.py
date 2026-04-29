from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from app.schemas.user import UserShort


class TravelRequestCreate(BaseModel):
    destination: str
    purpose: str
    departure_date: date
    return_date: date
    estimated_budget: float


class TravelRequestUpdate(BaseModel):
    destination: Optional[str] = None
    purpose: Optional[str] = None
    departure_date: Optional[date] = None
    return_date: Optional[date] = None
    estimated_budget: Optional[float] = None


class TravelReviewRequest(BaseModel):
    action: str  # "approve" or "reject"
    review_note: Optional[str] = None


class TravelRequestOut(BaseModel):
    id: str
    employee_id: str
    destination: str
    purpose: str
    departure_date: date
    return_date: date
    estimated_budget: float
    status: str
    reviewed_by: Optional[str] = None
    review_note: Optional[str] = None
    submitted_at: Optional[datetime] = None
    created_at: datetime
    employee: Optional[UserShort] = None
    reviewer: Optional[UserShort] = None

    model_config = {"from_attributes": True}
