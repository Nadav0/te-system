from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.expense import ExpenseReport
from app.models.travel import TravelRequest
from app.models.user import User
from app.auth.dependencies import get_current_user

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def search(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    term = f"%{q.lower()}%"
    results = []

    # Expenses
    eq = db.query(ExpenseReport).filter(ExpenseReport.title.ilike(term))
    if current_user.role == "employee":
        eq = eq.filter(ExpenseReport.employee_id == current_user.id)
    elif current_user.role == "manager":
        team_ids = [u.id for u in current_user.direct_reports] + [current_user.id]
        eq = eq.filter(ExpenseReport.employee_id.in_(team_ids))
    for r in eq.limit(5).all():
        results.append({
            "type": "expense",
            "id": r.id,
            "title": r.title,
            "sub": f"{r.employee.full_name if r.employee else ''} · {r.status}",
            "url": f"/expenses/{r.id}",
        })

    # Travel
    tq = db.query(TravelRequest).filter(TravelRequest.destination.ilike(term))
    if current_user.role == "employee":
        tq = tq.filter(TravelRequest.employee_id == current_user.id)
    elif current_user.role == "manager":
        team_ids = [u.id for u in current_user.direct_reports] + [current_user.id]
        tq = tq.filter(TravelRequest.employee_id.in_(team_ids))
    for t in tq.limit(5).all():
        results.append({
            "type": "travel",
            "id": t.id,
            "title": t.destination,
            "sub": f"{t.employee.full_name if t.employee else ''} · {t.departure_date}",
            "url": f"/travel/{t.id}",
        })

    # Users (manager/finance only)
    if current_user.role in ("manager", "finance"):
        uq = db.query(User).filter(
            or_(User.full_name.ilike(term), User.email.ilike(term))
        )
        for u in uq.limit(5).all():
            results.append({
                "type": "user",
                "id": u.id,
                "title": u.full_name,
                "sub": f"{u.email} · {u.role}",
                "url": None,
            })

    return results[:12]
