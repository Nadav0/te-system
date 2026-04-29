import os
import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.expense import ExpenseReport, ExpenseItem
from app.models.user import User
from app.schemas.expense import (
    ExpenseReportCreate, ExpenseReportUpdate, ExpenseReportOut,
    ExpenseItemCreate, ExpenseItemUpdate, ExpenseItemOut,
    ExpenseReviewRequest,
)
from app.auth.dependencies import get_current_user
from app.services.policy_service import check_item_violations
from app.config import settings
from typing import List, Optional
import aiofiles

router = APIRouter(prefix="/expenses", tags=["expenses"])


def _filter_reports_by_role(q, current_user: User, db: Session):
    if current_user.role == "employee":
        return q.filter(ExpenseReport.employee_id == current_user.id)
    elif current_user.role == "manager":
        team_ids = [u.id for u in current_user.direct_reports] + [current_user.id]
        return q.filter(ExpenseReport.employee_id.in_(team_ids))
    return q  # finance sees all


@router.get("", response_model=List[ExpenseReportOut])
def list_reports(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(ExpenseReport)
    q = _filter_reports_by_role(q, current_user, db)
    if status:
        q = q.filter(ExpenseReport.status == status)
    return q.order_by(ExpenseReport.created_at.desc()).all()


@router.post("", response_model=ExpenseReportOut, status_code=status.HTTP_201_CREATED)
def create_report(data: ExpenseReportCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = ExpenseReport(
        employee_id=current_user.id,
        title=data.title,
        travel_request_id=data.travel_request_id,
        currency=data.currency,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/{report_id}", response_model=ExpenseReportOut)
def get_report(report_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(ExpenseReport).filter(ExpenseReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    _check_access(report, current_user)
    return report


@router.put("/{report_id}", response_model=ExpenseReportOut)
def update_report(report_id: str, data: ExpenseReportUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = _get_own_draft(report_id, db, current_user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(report, field, value)
    db.commit()
    db.refresh(report)
    return report


@router.delete("/{report_id}", status_code=204)
def delete_report(report_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = _get_own_draft(report_id, db, current_user)
    db.delete(report)
    db.commit()


@router.post("/{report_id}/submit", response_model=ExpenseReportOut)
def submit_report(report_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = _get_own_draft(report_id, db, current_user)
    if not report.items:
        raise HTTPException(status_code=400, detail="Cannot submit a report with no expense items")
    report.status = "submitted"
    report.submitted_at = datetime.utcnow()
    db.commit()
    db.refresh(report)
    return report


@router.post("/{report_id}/review", response_model=ExpenseReportOut)
def review_report(
    report_id: str,
    data: ExpenseReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("manager", "finance"):
        raise HTTPException(status_code=403, detail="Only managers and finance can review reports")
    report = db.query(ExpenseReport).filter(ExpenseReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status not in ("submitted", "under_review"):
        raise HTTPException(status_code=400, detail=f"Cannot review a report with status '{report.status}'")
    if data.action == "approve":
        report.status = "approved"
    elif data.action == "reject":
        report.status = "rejected"
    else:
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")
    report.reviewed_by = current_user.id
    report.review_note = data.review_note
    db.commit()
    db.refresh(report)
    return report


# --- Items ---

@router.post("/{report_id}/items", response_model=ExpenseItemOut, status_code=201)
def add_item(report_id: str, data: ExpenseItemCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = _get_own_draft(report_id, db, current_user)
    item = ExpenseItem(
        report_id=report.id,
        date=data.date,
        category=data.category,
        description=data.description,
        amount=data.amount,
    )
    violated, detail = check_item_violations(db, item)
    item.policy_violation = violated
    item.violation_detail = detail
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/{report_id}/items/{item_id}", response_model=ExpenseItemOut)
def update_item(report_id: str, item_id: str, data: ExpenseItemUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = _get_own_draft(report_id, db, current_user)
    item = db.query(ExpenseItem).filter(ExpenseItem.id == item_id, ExpenseItem.report_id == report.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    violated, detail = check_item_violations(db, item)
    item.policy_violation = violated
    item.violation_detail = detail
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{report_id}/items/{item_id}", status_code=204)
def delete_item(report_id: str, item_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = _get_own_draft(report_id, db, current_user)
    item = db.query(ExpenseItem).filter(ExpenseItem.id == item_id, ExpenseItem.report_id == report.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()


@router.post("/{report_id}/items/{item_id}/receipt", response_model=ExpenseItemOut)
async def upload_receipt(
    report_id: str,
    item_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    report = _get_own_draft(report_id, db, current_user)
    item = db.query(ExpenseItem).filter(ExpenseItem.id == item_id, ExpenseItem.report_id == report.id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    ext = os.path.splitext(file.filename or "")[1]
    filename = f"{uuid.uuid4()}{ext}"
    upload_path = os.path.join(settings.UPLOAD_DIR, filename)
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    async with aiofiles.open(upload_path, "wb") as f:
        content = await file.read()
        await f.write(content)

    item.receipt_url = f"/uploads/{filename}"
    # Re-check violations after receipt upload (receipt requirement may clear)
    violated, detail = check_item_violations(db, item)
    item.policy_violation = violated
    item.violation_detail = detail
    db.commit()
    db.refresh(item)
    return item


# --- Helpers ---

def _check_access(report: ExpenseReport, user: User):
    if user.role == "finance":
        return
    if user.role == "manager":
        team_ids = {u.id for u in user.direct_reports}
        if report.employee_id not in team_ids and report.employee_id != user.id:
            raise HTTPException(status_code=403, detail="Access denied")
    elif report.employee_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")


def _get_own_draft(report_id: str, db: Session, user: User) -> ExpenseReport:
    report = db.query(ExpenseReport).filter(ExpenseReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.employee_id != user.id and user.role != "finance":
        raise HTTPException(status_code=403, detail="Access denied")
    if report.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft reports can be modified")
    return report
