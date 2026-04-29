from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.policy import PolicyRule
from app.models.user import User
from app.schemas.policy import PolicyRuleCreate, PolicyRuleUpdate, PolicyRuleOut
from app.auth.dependencies import get_current_user, require_finance
from typing import List

router = APIRouter(prefix="/policy", tags=["policy"])


@router.get("", response_model=List[PolicyRuleOut])
def list_rules(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(PolicyRule).order_by(PolicyRule.category).all()


@router.post("", response_model=PolicyRuleOut, status_code=status.HTTP_201_CREATED)
def create_rule(data: PolicyRuleCreate, db: Session = Depends(get_db), _: User = Depends(require_finance)):
    rule = PolicyRule(**data.model_dump())
    db.add(rule)
    db.commit()
    db.refresh(rule)
    return rule


@router.put("/{rule_id}", response_model=PolicyRuleOut)
def update_rule(rule_id: str, data: PolicyRuleUpdate, db: Session = Depends(get_db), _: User = Depends(require_finance)):
    rule = db.query(PolicyRule).filter(PolicyRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Policy rule not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(rule, field, value)
    db.commit()
    db.refresh(rule)
    return rule


@router.delete("/{rule_id}", status_code=204)
def delete_rule(rule_id: str, db: Session = Depends(get_db), _: User = Depends(require_finance)):
    rule = db.query(PolicyRule).filter(PolicyRule.id == rule_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Policy rule not found")
    rule.active = False
    db.commit()
