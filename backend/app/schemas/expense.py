from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime
from app.schemas.user import UserShort


class ExpenseItemCreate(BaseModel):
    date: date
    category: str
    description: str
    amount: float


class ExpenseItemUpdate(BaseModel):
    date: Optional[date] = None
    category: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None


class ExpenseItemOut(BaseModel):
    id: str
    report_id: str
    date: date
    category: str
    description: str
    amount: float
    receipt_url: Optional[str] = None
    policy_violation: bool
    violation_detail: Optional[str] = None

    model_config = {"from_attributes": True}


class ExpenseReportCreate(BaseModel):
    title: str
    travel_request_id: Optional[str] = None
    currency: str = "USD"


class ExpenseReportUpdate(BaseModel):
    title: Optional[str] = None
    travel_request_id: Optional[str] = None
    currency: Optional[str] = None


class ExpenseReviewRequest(BaseModel):
    action: str  # "approve" or "reject"
    review_note: Optional[str] = None


class ExpenseReportOut(BaseModel):
    id: str
    employee_id: str
    travel_request_id: Optional[str] = None
    title: str
    status: str
    currency: str
    total_amount: float
    has_violations: bool
    submitted_at: Optional[datetime] = None
    reviewed_by: Optional[str] = None
    review_note: Optional[str] = None
    paid_at: Optional[datetime] = None
    created_at: datetime
    employee: Optional[UserShort] = None
    reviewer: Optional[UserShort] = None
    items: List[ExpenseItemOut] = []

    model_config = {"from_attributes": True}
