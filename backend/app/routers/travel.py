from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.travel import TravelRequest
from app.models.user import User
from app.schemas.travel import TravelRequestCreate, TravelRequestUpdate, TravelRequestOut, TravelReviewRequest
from app.auth.dependencies import get_current_user
from app.services import notification_service
from typing import List, Optional

router = APIRouter(prefix="/travel", tags=["travel"])


@router.get("", response_model=List[TravelRequestOut])
def list_travel(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    q = db.query(TravelRequest)
    if current_user.role == "employee":
        q = q.filter(TravelRequest.employee_id == current_user.id)
    elif current_user.role == "manager":
        team_ids = [u.id for u in current_user.direct_reports] + [current_user.id]
        q = q.filter(TravelRequest.employee_id.in_(team_ids))
    if status:
        q = q.filter(TravelRequest.status == status)
    return q.order_by(TravelRequest.created_at.desc()).all()


@router.post("", response_model=TravelRequestOut, status_code=status.HTTP_201_CREATED)
def create_travel(data: TravelRequestCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tr = TravelRequest(employee_id=current_user.id, **data.model_dump())
    db.add(tr)
    db.commit()
    db.refresh(tr)
    return tr


@router.get("/{tr_id}", response_model=TravelRequestOut)
def get_travel(tr_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tr = _get_accessible(tr_id, db, current_user)
    return tr


@router.put("/{tr_id}", response_model=TravelRequestOut)
def update_travel(tr_id: str, data: TravelRequestUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tr = _get_own_draft(tr_id, db, current_user)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(tr, field, value)
    db.commit()
    db.refresh(tr)
    return tr


@router.delete("/{tr_id}", status_code=204)
def delete_travel(tr_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tr = _get_own_draft(tr_id, db, current_user)
    db.delete(tr)
    db.commit()


@router.post("/{tr_id}/submit", response_model=TravelRequestOut)
def submit_travel(tr_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    tr = _get_own_draft(tr_id, db, current_user)
    tr.status = "submitted"
    tr.submitted_at = datetime.utcnow()
    from app.models.user import User as UserModel
    managers = db.query(UserModel).filter(UserModel.role.in_(["manager", "finance"])).all()
    for mgr in managers:
        notification_service.create(
            db, mgr.id, "travel_submitted",
            "New travel request submitted",
            f"{current_user.full_name} submitted a travel request to {tr.destination}",
            ref_id=tr.id, ref_type="travel",
        )
    db.commit()
    db.refresh(tr)
    return tr


@router.post("/{tr_id}/review", response_model=TravelRequestOut)
def review_travel(
    tr_id: str,
    data: TravelReviewRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("manager", "finance"):
        raise HTTPException(status_code=403, detail="Only managers and finance can review travel requests")
    tr = db.query(TravelRequest).filter(TravelRequest.id == tr_id).first()
    if not tr:
        raise HTTPException(status_code=404, detail="Travel request not found")
    if tr.status != "submitted":
        raise HTTPException(status_code=400, detail=f"Cannot review a request with status '{tr.status}'")
    if data.action == "approve":
        tr.status = "approved"
    elif data.action == "reject":
        tr.status = "rejected"
    else:
        raise HTTPException(status_code=400, detail="action must be 'approve' or 'reject'")
    tr.reviewed_by = current_user.id
    tr.review_note = data.review_note
    action_label = "approved" if data.action == "approve" else "rejected"
    notification_service.create(
        db, tr.employee_id, f"travel_{action_label}",
        f"Travel request {action_label}",
        f'Your trip to {tr.destination} was {action_label} by {current_user.full_name}' + (f': {data.review_note}' if data.review_note else ''),
        ref_id=tr.id, ref_type="travel",
    )
    db.commit()
    db.refresh(tr)
    return tr


def _get_accessible(tr_id: str, db: Session, user: User) -> TravelRequest:
    tr = db.query(TravelRequest).filter(TravelRequest.id == tr_id).first()
    if not tr:
        raise HTTPException(status_code=404, detail="Travel request not found")
    if user.role == "finance":
        return tr
    if user.role == "manager":
        team_ids = {u.id for u in user.direct_reports} | {user.id}
        if tr.employee_id not in team_ids:
            raise HTTPException(status_code=403, detail="Access denied")
    elif tr.employee_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return tr


def _get_own_draft(tr_id: str, db: Session, user: User) -> TravelRequest:
    tr = db.query(TravelRequest).filter(TravelRequest.id == tr_id).first()
    if not tr:
        raise HTTPException(status_code=404, detail="Travel request not found")
    if tr.employee_id != user.id and user.role != "finance":
        raise HTTPException(status_code=403, detail="Access denied")
    if tr.status != "draft":
        raise HTTPException(status_code=400, detail="Only draft requests can be modified")
    return tr
