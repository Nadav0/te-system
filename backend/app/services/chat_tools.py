"""Tools the AI assistant can call.

Each tool is a thin wrapper around an existing service / query that
respects the same role-based filtering used elsewhere in the app:
- employees see only their own data
- managers see their team (direct reports + self)
- finance sees everything

The tools return JSON-serializable dicts so they can be sent straight
back to the model as `tool_result` content.
"""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any

from sqlalchemy import func, and_
from sqlalchemy.orm import Session

from app.models.expense import ExpenseItem, ExpenseReport
from app.models.travel import TravelRequest
from app.models.user import User
from app.services import analytics_service


# ---- Anthropic tool definitions (sent in every API call) ----------------

TOOL_DEFINITIONS: list[dict[str, Any]] = [
    {
        "name": "get_expense_summary",
        "description": (
            "Aggregate summary of the user's expenses: total spend, count, "
            "breakdown by status, breakdown by category, policy violation count. "
            "Use this for questions like 'how much have I spent', 'what categories "
            "do I spend most on', 'how many reports are pending'."
        ),
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "list_expenses",
        "description": (
            "List individual expense items with filters. Use for questions like "
            "'show my flights last quarter', 'expenses over $500', 'lodging in March'. "
            "Returns up to `limit` items (default 25, max 100)."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "category": {
                    "type": "string",
                    "description": "Filter by category (e.g. 'flight', 'lodging', 'meals', 'transport'). Case-insensitive partial match.",
                },
                "status": {
                    "type": "string",
                    "enum": ["draft", "submitted", "under_review", "approved", "rejected"],
                    "description": "Filter by parent report status.",
                },
                "date_from": {
                    "type": "string",
                    "description": "ISO date (YYYY-MM-DD). Items on or after this date.",
                },
                "date_to": {
                    "type": "string",
                    "description": "ISO date (YYYY-MM-DD). Items on or before this date.",
                },
                "min_amount": {"type": "number"},
                "max_amount": {"type": "number"},
                "violations_only": {
                    "type": "boolean",
                    "description": "If true, only return items flagged as policy violations.",
                },
                "limit": {"type": "integer", "minimum": 1, "maximum": 100, "default": 25},
            },
            "required": [],
        },
    },
    {
        "name": "list_travel_requests",
        "description": (
            "List travel requests. Use for questions like 'my upcoming trips', "
            "'travel to Berlin', 'pending travel approvals'."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "destination": {"type": "string", "description": "Partial match on destination."},
                "status": {
                    "type": "string",
                    "enum": ["draft", "submitted", "approved", "rejected"],
                },
                "upcoming_only": {
                    "type": "boolean",
                    "description": "If true, only return trips with departure_date >= today.",
                },
                "limit": {"type": "integer", "minimum": 1, "maximum": 50, "default": 15},
            },
            "required": [],
        },
    },
    {
        "name": "get_recent_activity",
        "description": (
            "Most recent expense / travel events across the user's scope. "
            "Use for 'what happened lately', 'any updates', 'recent activity'."
        ),
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "minimum": 1, "maximum": 25, "default": 10},
            },
            "required": [],
        },
    },
    {
        "name": "get_monthly_trend",
        "description": (
            "Monthly spend totals over time. Use for 'spending trend', "
            "'how did Q3 compare to Q2', 'monthly burn'."
        ),
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_policy_violations",
        "description": (
            "Summary of policy violations grouped by category, with counts and totals. "
            "Use for 'any compliance issues', 'where are violations happening'."
        ),
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_today",
        "description": (
            "Returns today's date (server time, ISO). Useful when the user "
            "asks about relative ranges like 'last quarter' or 'this year'."
        ),
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
]


# ---- Helpers -------------------------------------------------------------


def _scope_employee_ids(db: Session, user: User) -> list[str] | None:
    """Returns the list of employee IDs this user is allowed to query.

    None means "no restriction" (finance role).
    """
    if user.role == "finance":
        return None
    if user.role == "manager":
        return [u.id for u in user.direct_reports] + [user.id]
    # employee
    return [user.id]


def _parse_date(s: str | None) -> date | None:
    if not s:
        return None
    try:
        return datetime.fromisoformat(s).date()
    except ValueError:
        return None


# ---- Tool implementations -----------------------------------------------


def _tool_get_expense_summary(db: Session, user: User, _: dict) -> dict:
    return analytics_service.get_summary(db, user)


def _tool_list_expenses(db: Session, user: User, args: dict) -> dict:
    q = db.query(ExpenseItem).join(ExpenseReport, ExpenseReport.id == ExpenseItem.report_id)
    scope = _scope_employee_ids(db, user)
    if scope is not None:
        q = q.filter(ExpenseReport.employee_id.in_(scope))

    if args.get("category"):
        q = q.filter(ExpenseItem.category.ilike(f"%{args['category']}%"))
    if args.get("status"):
        q = q.filter(ExpenseReport.status == args["status"])

    df = _parse_date(args.get("date_from"))
    dt = _parse_date(args.get("date_to"))
    if df:
        q = q.filter(ExpenseItem.date >= df)
    if dt:
        q = q.filter(ExpenseItem.date <= dt)

    if args.get("min_amount") is not None:
        q = q.filter(ExpenseItem.amount >= float(args["min_amount"]))
    if args.get("max_amount") is not None:
        q = q.filter(ExpenseItem.amount <= float(args["max_amount"]))
    if args.get("violations_only"):
        q = q.filter(ExpenseItem.policy_violation.is_(True))

    limit = min(int(args.get("limit") or 25), 100)
    rows = q.order_by(ExpenseItem.date.desc()).limit(limit).all()

    items = [
        {
            "id": r.id,
            "report_id": r.report_id,
            "date": r.date.isoformat(),
            "category": r.category,
            "description": r.description,
            "amount": float(r.amount),
            "policy_violation": r.policy_violation,
            "violation_detail": r.violation_detail,
        }
        for r in rows
    ]
    total = sum(i["amount"] for i in items)
    return {"count": len(items), "total_amount": total, "items": items}


def _tool_list_travel(db: Session, user: User, args: dict) -> dict:
    q = db.query(TravelRequest)
    scope = _scope_employee_ids(db, user)
    if scope is not None:
        q = q.filter(TravelRequest.employee_id.in_(scope))

    if args.get("destination"):
        q = q.filter(TravelRequest.destination.ilike(f"%{args['destination']}%"))
    if args.get("status"):
        q = q.filter(TravelRequest.status == args["status"])
    if args.get("upcoming_only"):
        q = q.filter(TravelRequest.departure_date >= date.today())

    limit = min(int(args.get("limit") or 15), 50)
    rows = q.order_by(TravelRequest.departure_date.desc()).limit(limit).all()

    return {
        "count": len(rows),
        "items": [
            {
                "id": t.id,
                "destination": t.destination,
                "purpose": t.purpose,
                "departure_date": t.departure_date.isoformat(),
                "return_date": t.return_date.isoformat(),
                "estimated_budget": float(t.estimated_budget),
                "status": t.status,
            }
            for t in rows
        ],
    }


def _tool_get_recent(db: Session, user: User, args: dict) -> dict:
    limit = min(int(args.get("limit") or 10), 25)
    return {"events": analytics_service.get_recent_activity(db, user, limit=limit)}


def _tool_get_monthly_trend(db: Session, user: User, _: dict) -> dict:
    return {"trend": analytics_service.get_monthly_trend(db, user)}


def _tool_get_violations(db: Session, user: User, _: dict) -> dict:
    return {"violations": analytics_service.get_violations_summary(db, user)}


def _tool_get_today(_db: Session, _user: User, _args: dict) -> dict:
    today = date.today()
    return {
        "today": today.isoformat(),
        "year": today.year,
        "month": today.month,
        "day": today.day,
        "weekday": today.strftime("%A"),
    }


TOOL_HANDLERS = {
    "get_expense_summary": _tool_get_expense_summary,
    "list_expenses": _tool_list_expenses,
    "list_travel_requests": _tool_list_travel,
    "get_recent_activity": _tool_get_recent,
    "get_monthly_trend": _tool_get_monthly_trend,
    "get_policy_violations": _tool_get_violations,
    "get_today": _tool_get_today,
}


def execute_tool(name: str, args: dict, db: Session, user: User) -> dict:
    handler = TOOL_HANDLERS.get(name)
    if handler is None:
        return {"error": f"unknown tool: {name}"}
    try:
        return handler(db, user, args or {})
    except Exception as exc:  # noqa: BLE001
        return {"error": f"{type(exc).__name__}: {exc}"}
