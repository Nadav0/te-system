from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.expense import ExpenseReport, ExpenseItem
from app.models.travel import TravelRequest
from app.models.user import User
from datetime import datetime, timedelta


def get_summary(db: Session, current_user: User) -> dict:
    q = db.query(ExpenseReport)
    if current_user.role == "employee":
        q = q.filter(ExpenseReport.employee_id == current_user.id)
    elif current_user.role == "manager":
        team_ids = [u.id for u in current_user.direct_reports] + [current_user.id]
        q = q.filter(ExpenseReport.employee_id.in_(team_ids))

    reports = q.all()
    total = sum(r.total_amount for r in reports)
    by_status = {}
    for r in reports:
        by_status[r.status] = by_status.get(r.status, 0) + 1

    # Category totals
    items_q = db.query(ExpenseItem.category, func.sum(ExpenseItem.amount).label("total")).join(
        ExpenseReport, ExpenseReport.id == ExpenseItem.report_id
    )
    if current_user.role == "employee":
        items_q = items_q.filter(ExpenseReport.employee_id == current_user.id)
    elif current_user.role == "manager":
        team_ids = [u.id for u in current_user.direct_reports] + [current_user.id]
        items_q = items_q.filter(ExpenseReport.employee_id.in_(team_ids))
    by_category = {row.category: float(row.total) for row in items_q.group_by(ExpenseItem.category).all()}

    violations = sum(1 for r in reports for item in r.items if item.policy_violation)

    return {
        "total_spend": float(total),
        "report_count": len(reports),
        "by_status": by_status,
        "by_category": by_category,
        "violation_count": violations,
    }


def get_by_employee(db: Session, current_user: User) -> list[dict]:
    q = db.query(
        User.id,
        User.full_name,
        User.department,
        func.coalesce(func.sum(ExpenseItem.amount), 0).label("total_spend"),
        func.count(ExpenseReport.id.distinct()).label("report_count"),
    ).outerjoin(ExpenseReport, ExpenseReport.employee_id == User.id).outerjoin(
        ExpenseItem, ExpenseItem.report_id == ExpenseReport.id
    )

    if current_user.role == "manager":
        team_ids = [u.id for u in current_user.direct_reports] + [current_user.id]
        q = q.filter(User.id.in_(team_ids))

    rows = q.group_by(User.id, User.full_name, User.department).order_by(func.sum(ExpenseItem.amount).desc().nullslast()).all()
    return [{"id": r.id, "name": r.full_name, "department": r.department, "total_spend": float(r.total_spend), "report_count": r.report_count} for r in rows]


def get_by_department(db: Session) -> list[dict]:
    rows = db.query(
        User.department,
        func.coalesce(func.sum(ExpenseItem.amount), 0).label("total"),
    ).outerjoin(ExpenseReport, ExpenseReport.employee_id == User.id).outerjoin(
        ExpenseItem, ExpenseItem.report_id == ExpenseReport.id
    ).group_by(User.department).order_by(func.sum(ExpenseItem.amount).desc().nullslast()).all()
    return [{"department": r.department or "Unassigned", "total": float(r.total)} for r in rows]


def get_monthly_trend(db: Session, current_user: User) -> list[dict]:
    q = db.query(
        extract("year", ExpenseItem.date).label("year"),
        extract("month", ExpenseItem.date).label("month"),
        func.sum(ExpenseItem.amount).label("total"),
    ).join(ExpenseReport, ExpenseReport.id == ExpenseItem.report_id)

    if current_user.role == "employee":
        q = q.filter(ExpenseReport.employee_id == current_user.id)
    elif current_user.role == "manager":
        team_ids = [u.id for u in current_user.direct_reports] + [current_user.id]
        q = q.filter(ExpenseReport.employee_id.in_(team_ids))

    rows = q.group_by("year", "month").order_by("year", "month").all()
    return [{"year": int(r.year), "month": int(r.month), "total": float(r.total)} for r in rows]


def get_violations_summary(db: Session, current_user: User) -> list[dict]:
    q = db.query(
        ExpenseItem.category,
        func.count(ExpenseItem.id).label("violation_count"),
        func.sum(ExpenseItem.amount).label("total_amount"),
    ).filter(ExpenseItem.policy_violation == True).join(
        ExpenseReport, ExpenseReport.id == ExpenseItem.report_id
    )

    if current_user.role == "employee":
        q = q.filter(ExpenseReport.employee_id == current_user.id)
    elif current_user.role == "manager":
        team_ids = [u.id for u in current_user.direct_reports] + [current_user.id]
        q = q.filter(ExpenseReport.employee_id.in_(team_ids))

    rows = q.group_by(ExpenseItem.category).all()
    return [{"category": r.category, "count": r.violation_count, "total": float(r.total_amount)} for r in rows]


def get_recent_activity(db: Session, current_user: User, limit: int = 10) -> list[dict]:
    """Returns recent expense and travel events, role-filtered."""
    events = []

    eq = db.query(ExpenseReport)
    if current_user.role == "employee":
        eq = eq.filter(ExpenseReport.employee_id == current_user.id)
    elif current_user.role == "manager":
        team_ids = [u.id for u in current_user.direct_reports] + [current_user.id]
        eq = eq.filter(ExpenseReport.employee_id.in_(team_ids))
    for r in eq.order_by(ExpenseReport.updated_at.desc()).limit(limit).all():
        actor = r.employee.full_name if r.employee else "Unknown"
        events.append({
            "id": f"exp-{r.id}",
            "type": "expense",
            "title": _expense_event_title(r.status),
            "sub": f"{actor} · {r.title} ({r.currency} {r.total_amount:,.2f})",
            "time": r.updated_at.isoformat(),
            "status": r.status,
            "ref_id": r.id,
        })

    tq = db.query(TravelRequest)
    if current_user.role == "employee":
        tq = tq.filter(TravelRequest.employee_id == current_user.id)
    elif current_user.role == "manager":
        team_ids = [u.id for u in current_user.direct_reports] + [current_user.id]
        tq = tq.filter(TravelRequest.employee_id.in_(team_ids))
    for t in tq.order_by(TravelRequest.created_at.desc()).limit(limit).all():
        actor = t.employee.full_name if t.employee else "Unknown"
        events.append({
            "id": f"trv-{t.id}",
            "type": "travel",
            "title": _travel_event_title(t.status),
            "sub": f"{actor} · {t.destination}",
            "time": t.created_at.isoformat(),
            "status": t.status,
            "ref_id": t.id,
        })

    events.sort(key=lambda e: e["time"], reverse=True)
    return events[:limit]


def _expense_event_title(status: str) -> str:
    return {
        "draft": "Expense draft created",
        "submitted": "Expense report submitted",
        "under_review": "Expense under review",
        "approved": "Expense report approved",
        "rejected": "Expense report rejected",
    }.get(status, "Expense updated")


def _travel_event_title(status: str) -> str:
    return {
        "draft": "Travel request drafted",
        "submitted": "Travel request submitted",
        "approved": "Travel request approved",
        "rejected": "Travel request rejected",
    }.get(status, "Travel request updated")
