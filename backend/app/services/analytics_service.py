from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from app.models.expense import ExpenseReport, ExpenseItem
from app.models.user import User


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
