from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.auth.dependencies import get_current_user
from app.services import analytics_service

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return analytics_service.get_summary(db, current_user)


@router.get("/by-employee")
def by_employee(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return analytics_service.get_by_employee(db, current_user)


@router.get("/by-department")
def by_department(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return analytics_service.get_by_department(db)


@router.get("/monthly-trend")
def monthly_trend(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return analytics_service.get_monthly_trend(db, current_user)


@router.get("/violations")
def violations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return analytics_service.get_violations_summary(db, current_user)
