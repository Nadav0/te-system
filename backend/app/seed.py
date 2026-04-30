"""
Run with: python -m app.seed
Seeds the database with realistic sample data for all roles.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, datetime, timedelta
import bcrypt
from app.database import SessionLocal, engine, Base
import app.models  # noqa: F401
from app.models.user import User
from app.models.policy import PolicyRule
from app.models.travel import TravelRequest
from app.models.expense import ExpenseReport, ExpenseItem


def _hash(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def run():
    # Drop and recreate all tables to pick up schema changes (safe — seed always repopulates)
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # --- Users ---
    finance = User(
        id="u-finance-01",
        email="finance@company.com",
        hashed_password=_hash("password"),
        full_name="Sarah Finance",
        role="finance",
        department="Finance",
    )
    manager1 = User(
        id="u-manager-01",
        email="manager@company.com",
        hashed_password=_hash("password"),
        full_name="Mike Manager",
        role="manager",
        department="Engineering",
        manager_id="u-finance-01",
    )
    employee1 = User(
        id="u-emp-01",
        email="employee@company.com",
        hashed_password=_hash("password"),
        full_name="Alice Employee",
        role="employee",
        department="Engineering",
        manager_id="u-manager-01",
    )
    employee2 = User(
        id="u-emp-02",
        email="bob@company.com",
        hashed_password=_hash("password"),
        full_name="Bob Smith",
        role="employee",
        department="Sales",
        manager_id="u-manager-01",
    )
    employee3 = User(
        id="u-emp-03",
        email="carol@company.com",
        hashed_password=_hash("password"),
        full_name="Carol Johnson",
        role="employee",
        department="Engineering",
        manager_id="u-manager-01",
    )
    db.add_all([finance, manager1, employee1, employee2, employee3])
    db.commit()

    # --- Policy Rules ---
    rules = [
        PolicyRule(category="meals", max_amount_per_item=75.0, max_amount_per_day=150.0, requires_receipt_above=25.0, description="Meals capped at $75/item and $150/day. Receipt required above $25."),
        PolicyRule(category="transport", max_amount_per_item=500.0, requires_receipt_above=50.0, description="Transport capped at $500/item. Receipt required above $50."),
        PolicyRule(category="lodging", max_amount_per_item=250.0, requires_receipt_above=0.01, description="Lodging capped at $250/night. Receipt always required."),
        PolicyRule(category="conference", max_amount_per_item=2000.0, requires_receipt_above=100.0, description="Conference fees up to $2,000. Receipt required above $100."),
        PolicyRule(category="any", requires_receipt_above=100.0, description="Receipt required for any item above $100."),
    ]
    db.add_all(rules)
    db.commit()

    today = date.today()

    # --- Travel Requests ---
    tr1 = TravelRequest(
        id="tr-01",
        employee_id="u-emp-01",
        destination="New York, NY",
        purpose="Q2 Engineering Summit — architecture planning and team sync",
        departure_date=today + timedelta(days=14),
        return_date=today + timedelta(days=17),
        estimated_budget=1800.0,
        status="approved",
        reviewed_by="u-manager-01",
        review_note="Approved. Please book early for better rates.",
        submitted_at=datetime.utcnow() - timedelta(days=5),
        created_at=datetime.utcnow() - timedelta(days=7),
    )
    tr2 = TravelRequest(
        id="tr-02",
        employee_id="u-emp-02",
        destination="San Francisco, CA",
        purpose="SaaStr Annual Conference — sales prospecting and networking",
        departure_date=today + timedelta(days=30),
        return_date=today + timedelta(days=33),
        estimated_budget=3200.0,
        status="submitted",
        submitted_at=datetime.utcnow() - timedelta(days=1),
        created_at=datetime.utcnow() - timedelta(days=2),
    )
    tr3 = TravelRequest(
        id="tr-03",
        employee_id="u-emp-03",
        destination="Chicago, IL",
        purpose="Client on-site visit — project kick-off",
        departure_date=today + timedelta(days=7),
        return_date=today + timedelta(days=8),
        estimated_budget=900.0,
        status="draft",
        created_at=datetime.utcnow() - timedelta(days=1),
    )
    db.add_all([tr1, tr2, tr3])
    db.commit()

    # --- Expense Reports ---
    # Alice: approved report from last month
    report1 = ExpenseReport(
        id="exp-01",
        employee_id="u-emp-01",
        title="March Conference — Boston",
        status="approved",
        currency="USD",
        reviewed_by="u-manager-01",
        review_note="Looks good, all receipts present.",
        submitted_at=datetime.utcnow() - timedelta(days=30),
        created_at=datetime.utcnow() - timedelta(days=35),
    )
    db.add(report1)
    db.commit()
    items1 = [
        ExpenseItem(report_id="exp-01", date=today - timedelta(days=35), category="transport", description="Flight BOS-NYC round trip", amount=380.0, policy_violation=False),
        ExpenseItem(report_id="exp-01", date=today - timedelta(days=34), category="lodging", description="Marriott Boston 2 nights", amount=220.0, policy_violation=False),
        ExpenseItem(report_id="exp-01", date=today - timedelta(days=34), category="meals", description="Team dinner", amount=68.0, policy_violation=False),
        ExpenseItem(report_id="exp-01", date=today - timedelta(days=33), category="conference", description="AWS re:Invent registration", amount=1899.0, policy_violation=False),
    ]
    db.add_all(items1)

    # Alice: current draft report (with a violation)
    report2 = ExpenseReport(
        id="exp-02",
        employee_id="u-emp-01",
        title="Q2 Summit Pre-Expenses",
        status="draft",
        currency="USD",
        created_at=datetime.utcnow() - timedelta(days=2),
    )
    db.add(report2)
    db.commit()
    items2 = [
        ExpenseItem(report_id="exp-02", date=today - timedelta(days=2), category="meals", description="Team lunch planning session", amount=95.0, policy_violation=True, violation_detail="Meals limit is $75.00/item (submitted: $95.00)"),
        ExpenseItem(report_id="exp-02", date=today - timedelta(days=1), category="transport", description="Uber to airport", amount=42.0, policy_violation=False),
    ]
    db.add_all(items2)

    # Bob: submitted report
    report3 = ExpenseReport(
        id="exp-03",
        employee_id="u-emp-02",
        title="Client Meetings — April",
        status="submitted",
        currency="USD",
        submitted_at=datetime.utcnow() - timedelta(days=3),
        created_at=datetime.utcnow() - timedelta(days=5),
    )
    db.add(report3)
    db.commit()
    items3 = [
        ExpenseItem(report_id="exp-03", date=today - timedelta(days=5), category="meals", description="Client lunch", amount=74.0, policy_violation=False),
        ExpenseItem(report_id="exp-03", date=today - timedelta(days=4), category="transport", description="Rental car 2 days", amount=148.0, policy_violation=False),
        ExpenseItem(report_id="exp-03", date=today - timedelta(days=3), category="meals", description="Team dinner after pitch", amount=112.0, policy_violation=True, violation_detail="Meals limit is $75.00/item (submitted: $112.00)"),
    ]
    db.add_all(items3)

    # Carol: rejected report
    report4 = ExpenseReport(
        id="exp-04",
        employee_id="u-emp-03",
        title="Equipment Purchase (not T&E)",
        status="rejected",
        currency="USD",
        submitted_at=datetime.utcnow() - timedelta(days=10),
        reviewed_by="u-manager-01",
        review_note="Equipment purchases should go through IT procurement, not T&E.",
        created_at=datetime.utcnow() - timedelta(days=12),
    )
    db.add(report4)
    db.commit()
    items4 = [
        ExpenseItem(report_id="exp-04", date=today - timedelta(days=12), category="other", description="USB-C hub", amount=89.0, policy_violation=False),
    ]
    db.add_all(items4)

    db.commit()
    db.close()
    print("✅ Seed complete!")
    print("   employee@company.com / password  → Employee")
    print("   manager@company.com  / password  → Manager")
    print("   finance@company.com  / password  → Finance/Admin")


if __name__ == "__main__":
    run()
