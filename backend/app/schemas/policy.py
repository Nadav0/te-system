from pydantic import BaseModel
from typing import Optional


class PolicyRuleBase(BaseModel):
    category: str
    max_amount_per_item: Optional[float] = None
    max_amount_per_day: Optional[float] = None
    requires_receipt_above: Optional[float] = None
    description: str
    active: bool = True


class PolicyRuleCreate(PolicyRuleBase):
    pass


class PolicyRuleUpdate(BaseModel):
    category: Optional[str] = None
    max_amount_per_item: Optional[float] = None
    max_amount_per_day: Optional[float] = None
    requires_receipt_above: Optional[float] = None
    description: Optional[str] = None
    active: Optional[bool] = None


class PolicyRuleOut(PolicyRuleBase):
    id: str

    model_config = {"from_attributes": True}
