"""
Run with: python -m app.seed
Seeds the database with rich, realistic sample data covering all roles and workflow states.
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import date, datetime, timedelta
import uuid
import bcrypt
from app.database import SessionLocal, engine, Base
import app.models  # noqa: F401
from app.models.user import User
from app.models.policy import PolicyRule
from app.models.travel import TravelRequest
from app.models.expense import ExpenseReport, ExpenseItem
from app.models.notification import Notification


def _hash(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def nid() -> str:
    return str(uuid.uuid4())


def run():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    today = date.today()
    now = datetime.utcnow()

    # ─────────────────────────────────────────────────────────────
    # USERS  (1 finance · 3 managers · 8 employees)
    # ─────────────────────────────────────────────────────────────
    finance = User(id="u-finance-01", email="finance@company.com",
                   hashed_password=_hash("password"), full_name="Sarah Finance",
                   role="finance", department="Finance")

    mgr1 = User(id="u-manager-01", email="manager@company.com",
                hashed_password=_hash("password"), full_name="Mike Manager",
                role="manager", department="Engineering", manager_id="u-finance-01")

    mgr2 = User(id="u-manager-02", email="diana@company.com",
                hashed_password=_hash("password"), full_name="Diana Walsh",
                role="manager", department="Sales", manager_id="u-finance-01")

    mgr3 = User(id="u-manager-03", email="tom@company.com",
                hashed_password=_hash("password"), full_name="Tom Park",
                role="manager", department="Operations", manager_id="u-finance-01")

    emp1 = User(id="u-emp-01", email="employee@company.com",
                hashed_password=_hash("password"), full_name="Alice Chen",
                role="employee", department="Engineering", manager_id="u-manager-01")

    emp2 = User(id="u-emp-02", email="bob@company.com",
                hashed_password=_hash("password"), full_name="Bob Smith",
                role="employee", department="Sales", manager_id="u-manager-02")

    emp3 = User(id="u-emp-03", email="carol@company.com",
                hashed_password=_hash("password"), full_name="Carol Johnson",
                role="employee", department="Engineering", manager_id="u-manager-01")

    emp4 = User(id="u-emp-04", email="david@company.com",
                hashed_password=_hash("password"), full_name="David Kim",
                role="employee", department="Operations", manager_id="u-manager-03")

    emp5 = User(id="u-emp-05", email="emma@company.com",
                hashed_password=_hash("password"), full_name="Emma Davis",
                role="employee", department="Marketing", manager_id="u-manager-02")

    emp6 = User(id="u-emp-06", email="frank@company.com",
                hashed_password=_hash("password"), full_name="Frank Wilson",
                role="employee", department="Sales", manager_id="u-manager-02")

    emp7 = User(id="u-emp-07", email="grace@company.com",
                hashed_password=_hash("password"), full_name="Grace Lee",
                role="employee", department="Engineering", manager_id="u-manager-01")

    emp8 = User(id="u-emp-08", email="henry@company.com",
                hashed_password=_hash("password"), full_name="Henry Brown",
                role="employee", department="Legal", manager_id="u-finance-01")

    db.add_all([finance, mgr1, mgr2, mgr3, emp1, emp2, emp3, emp4, emp5, emp6, emp7, emp8])
    db.commit()

    # ─────────────────────────────────────────────────────────────
    # POLICY RULES
    # ─────────────────────────────────────────────────────────────
    db.add_all([
        PolicyRule(category="meals",      max_amount_per_item=75.0,   max_amount_per_day=150.0, requires_receipt_above=25.0,  description="Meals capped at $75/item and $150/day. Receipt required above $25.", active=True),
        PolicyRule(category="transport",  max_amount_per_item=500.0,  requires_receipt_above=50.0,   description="Ground/air transport capped at $500/item. Receipt required above $50.", active=True),
        PolicyRule(category="lodging",    max_amount_per_item=250.0,  requires_receipt_above=0.01,   description="Lodging capped at $250/night. Receipt always required.", active=True),
        PolicyRule(category="conference", max_amount_per_item=2000.0, requires_receipt_above=100.0,  description="Conference fees up to $2,000. Receipt required above $100.", active=True),
        PolicyRule(category="tech",       max_amount_per_item=500.0,  requires_receipt_above=50.0,   description="Software/tech purchases up to $500. Must include business justification.", active=True),
        PolicyRule(category="any",        requires_receipt_above=100.0, description="Receipt required for any item above $100.", active=True),
    ])
    db.commit()

    # ─────────────────────────────────────────────────────────────
    # TRAVEL REQUESTS
    # ─────────────────────────────────────────────────────────────
    tr1 = TravelRequest(id="tr-01", employee_id="u-emp-01",
        destination="New York, NY",
        purpose="Q2 Engineering Summit — architecture planning and team sync with NYC office",
        departure_date=today + timedelta(days=14), return_date=today + timedelta(days=17),
        estimated_budget=1800.0, status="approved",
        reviewed_by="u-manager-01", review_note="Approved. Book the W Midtown — we have a corporate rate.",
        submitted_at=now - timedelta(days=5), created_at=now - timedelta(days=7))

    tr2 = TravelRequest(id="tr-02", employee_id="u-emp-02",
        destination="San Francisco, CA",
        purpose="SaaStr Annual Conference — sales prospecting, networking, and pipeline generation",
        departure_date=today + timedelta(days=30), return_date=today + timedelta(days=34),
        estimated_budget=3800.0, status="approved",
        reviewed_by="u-manager-02", review_note="Approved. High priority — target 5 demo bookings.",
        submitted_at=now - timedelta(days=3), created_at=now - timedelta(days=4))

    tr3 = TravelRequest(id="tr-03", employee_id="u-emp-03",
        destination="Chicago, IL",
        purpose="Acme Corp on-site kick-off — project discovery and stakeholder interviews",
        departure_date=today + timedelta(days=7), return_date=today + timedelta(days=9),
        estimated_budget=1100.0, status="draft",
        created_at=now - timedelta(days=1))

    tr4 = TravelRequest(id="tr-04", employee_id="u-emp-04",
        destination="Denver, CO",
        purpose="Operations Excellence Summit 2025 — supply chain and logistics track",
        departure_date=today + timedelta(days=21), return_date=today + timedelta(days=24),
        estimated_budget=2100.0, status="submitted",
        submitted_at=now - timedelta(hours=18), created_at=now - timedelta(days=2))

    tr5 = TravelRequest(id="tr-05", employee_id="u-emp-05",
        destination="Austin, TX",
        purpose="SXSW Marketing & Brand Experience — attend keynotes and run brand activation booth",
        departure_date=today + timedelta(days=45), return_date=today + timedelta(days=50),
        estimated_budget=4200.0, status="approved",
        reviewed_by="u-manager-02", review_note="Approved. Coordinate with events team on the booth setup.",
        submitted_at=now - timedelta(days=8), created_at=now - timedelta(days=10))

    tr6 = TravelRequest(id="tr-06", employee_id="u-emp-06",
        destination="Miami, FL",
        purpose="Q3 Sales Kickoff — team training, quota setting, and product roadmap reveal",
        departure_date=today + timedelta(days=10), return_date=today + timedelta(days=13),
        estimated_budget=2600.0, status="submitted",
        submitted_at=now - timedelta(days=1), created_at=now - timedelta(days=2))

    tr7 = TravelRequest(id="tr-07", employee_id="u-emp-07",
        destination="Lisbon, Portugal",
        purpose="Web Summit 2024 — speaking engagement on ML infrastructure at scale",
        departure_date=today - timedelta(days=60), return_date=today - timedelta(days=55),
        estimated_budget=4500.0, status="approved",
        reviewed_by="u-manager-01", review_note="Approved — great visibility opportunity. Book business class for flights over 7h.",
        submitted_at=now - timedelta(days=75), created_at=now - timedelta(days=78))

    tr8 = TravelRequest(id="tr-08", employee_id="u-emp-08",
        destination="Chicago, IL",
        purpose="LegalTech Summit 2024 — compliance, AI in legal, and contract automation sessions",
        departure_date=today - timedelta(days=30), return_date=today - timedelta(days=28),
        estimated_budget=1400.0, status="approved",
        reviewed_by="u-finance-01", review_note="Approved. Keep within budget — hotel options are listed in the travel portal.",
        submitted_at=now - timedelta(days=45), created_at=now - timedelta(days=47))

    tr9 = TravelRequest(id="tr-09", employee_id="u-manager-01",
        destination="Singapore",
        purpose="APAC Leadership Forum — represent Engineering in regional strategy sessions",
        departure_date=today + timedelta(days=60), return_date=today + timedelta(days=66),
        estimated_budget=7500.0, status="submitted",
        submitted_at=now - timedelta(hours=6), created_at=now - timedelta(days=1))

    tr10 = TravelRequest(id="tr-10", employee_id="u-manager-02",
        destination="Boston, MA",
        purpose="HubSpot INBOUND Conference — partner track and agency networking",
        departure_date=today + timedelta(days=35), return_date=today + timedelta(days=37),
        estimated_budget=2200.0, status="approved",
        reviewed_by="u-finance-01", review_note="Approved.",
        submitted_at=now - timedelta(days=6), created_at=now - timedelta(days=7))

    db.add_all([tr1, tr2, tr3, tr4, tr5, tr6, tr7, tr8, tr9, tr10])
    db.commit()

    # ─────────────────────────────────────────────────────────────
    # EXPENSE REPORTS
    # ─────────────────────────────────────────────────────────────

    def rpt(id, emp_id, title, status, reviewer=None, note=None, paid=False,
            submitted_days_ago=None, created_days_ago=5, travel_id=None):
        submitted_at = now - timedelta(days=submitted_days_ago) if submitted_days_ago else None
        paid_at = now - timedelta(days=2) if paid else None
        return ExpenseReport(
            id=id, employee_id=emp_id, title=title, status=status, currency="USD",
            reviewed_by=reviewer, review_note=note, paid_at=paid_at,
            submitted_at=submitted_at, created_at=now - timedelta(days=created_days_ago),
            travel_request_id=travel_id,
        )

    # ── Alice (emp-01) ──────────────────────────────────────────
    r01 = rpt("exp-01","u-emp-01","AWS re:Invent 2024 — Las Vegas","approved",
              "u-manager-01","All receipts present. Approved.", paid=True,
              submitted_days_ago=42, created_days_ago=50)
    db.add(r01); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-01", date=today-timedelta(days=50), category="transport",    description="Round-trip flight SFO–LAS (United Economy)", amount=487.00),
        ExpenseItem(report_id="exp-01", date=today-timedelta(days=49), category="lodging",     description="MGM Grand — 4 nights", amount=219.00*4),
        ExpenseItem(report_id="exp-01", date=today-timedelta(days=49), category="meals",       description="Welcome reception dinner", amount=62.00),
        ExpenseItem(report_id="exp-01", date=today-timedelta(days=48), category="meals",       description="Team lunch with AWS partners", amount=88.00,
                    policy_violation=True, violation_detail="Meals limit is $75.00/item (submitted: $88.00)"),
        ExpenseItem(report_id="exp-01", date=today-timedelta(days=47), category="meals",       description="Closing night dinner", amount=71.00),
        ExpenseItem(report_id="exp-01", date=today-timedelta(days=46), category="conference",  description="AWS re:Invent 2024 registration", amount=1899.00),
        ExpenseItem(report_id="exp-01", date=today-timedelta(days=50), category="transport",   description="Lyft rides (4 days)", amount=143.00),
    ])

    r02 = rpt("exp-02","u-emp-01","Q2 Summit Prep Expenses","draft",
              created_days_ago=3)
    db.add(r02); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-02", date=today-timedelta(days=3), category="transport",  description="Uber to SFO airport", amount=42.00),
        ExpenseItem(report_id="exp-02", date=today-timedelta(days=2), category="meals",      description="Late night working dinner (pre-summit prep)", amount=95.00,
                    policy_violation=True, violation_detail="Meals limit is $75.00/item (submitted: $95.00)"),
        ExpenseItem(report_id="exp-02", date=today-timedelta(days=2), category="other",      description="Airport lounge day pass (Priority Pass)", amount=67.00),
        ExpenseItem(report_id="exp-02", date=today-timedelta(days=1), category="tech",       description="Miro annual subscription (team whiteboard)", amount=144.00),
    ])

    # ── Bob (emp-02) ─────────────────────────────────────────────
    r03 = rpt("exp-03","u-emp-02","SaaStr Annual — San Francisco","approved",
              "u-manager-02","Great ROI on this one — 6 demos booked. Approved.", paid=True,
              submitted_days_ago=18, created_days_ago=24)
    db.add(r03); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-03", date=today-timedelta(days=24), category="transport",   description="Flight NYC–SFO–NYC (Delta)", amount=612.00),
        ExpenseItem(report_id="exp-03", date=today-timedelta(days=23), category="lodging",     description="Marriott Union Square — 3 nights × $289", amount=289.00*3,
                    policy_violation=True, violation_detail="Lodging limit is $250.00/night (submitted: $289.00/night)"),
        ExpenseItem(report_id="exp-03", date=today-timedelta(days=23), category="conference",  description="SaaStr Annual 2024 conference pass", amount=1800.00),
        ExpenseItem(report_id="exp-03", date=today-timedelta(days=23), category="meals",       description="Prospect dinner — Salesforce team (3 people)", amount=68.00),
        ExpenseItem(report_id="exp-03", date=today-timedelta(days=22), category="meals",       description="Lunch with Accel Partners", amount=72.00),
        ExpenseItem(report_id="exp-03", date=today-timedelta(days=21), category="meals",       description="Closing night networking dinner", amount=55.00),
        ExpenseItem(report_id="exp-03", date=today-timedelta(days=21), category="transport",   description="Lyft rides — conference to hotel (3 days)", amount=147.00),
    ])

    r04 = rpt("exp-04","u-emp-02","April Client Meetings — Chicago","submitted",
              submitted_days_ago=3, created_days_ago=6)
    db.add(r04); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-04", date=today-timedelta(days=6), category="transport",  description="Flight ORD round-trip (American)", amount=384.00),
        ExpenseItem(report_id="exp-04", date=today-timedelta(days=6), category="transport",  description="Rental car — 2 days (Hertz Midsize)", amount=148.00),
        ExpenseItem(report_id="exp-04", date=today-timedelta(days=5), category="meals",      description="Client lunch — Acme Corp HQ (4 people)", amount=74.00),
        ExpenseItem(report_id="exp-04", date=today-timedelta(days=5), category="lodging",    description="Hyatt Regency Chicago — 1 night", amount=189.00),
        ExpenseItem(report_id="exp-04", date=today-timedelta(days=4), category="meals",      description="Post-pitch team dinner", amount=112.00,
                    policy_violation=True, violation_detail="Meals limit is $75.00/item (submitted: $112.00)"),
        ExpenseItem(report_id="exp-04", date=today-timedelta(days=4), category="other",      description="Presentation printing & materials", amount=38.00),
        ExpenseItem(report_id="exp-04", date=today-timedelta(days=3), category="meals",      description="Breakfast — airport (early flight)", amount=18.00),
        ExpenseItem(report_id="exp-04", date=today-timedelta(days=3), category="transport",  description="Parking at airport (2 days)", amount=52.00),
    ])

    # ── Carol (emp-03) ───────────────────────────────────────────
    r05 = rpt("exp-05","u-emp-03","Austin Client Onsite — Q1","approved",
              "u-manager-01","Clean report, well within budget. Paid.", paid=True,
              submitted_days_ago=35, created_days_ago=42)
    db.add(r05); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-05", date=today-timedelta(days=42), category="transport",  description="Flight SFO–AUS–SFO (Southwest)", amount=325.00),
        ExpenseItem(report_id="exp-05", date=today-timedelta(days=41), category="lodging",    description="Marriott Austin Downtown — 2 nights", amount=215.00*2),
        ExpenseItem(report_id="exp-05", date=today-timedelta(days=41), category="meals",      description="Welcome dinner with client team", amount=58.00),
        ExpenseItem(report_id="exp-05", date=today-timedelta(days=40), category="meals",      description="Working lunch — project kickoff", amount=65.00),
        ExpenseItem(report_id="exp-05", date=today-timedelta(days=40), category="transport",  description="Taxi rides — hotel to client office (2 days)", amount=67.00),
    ])

    r06 = rpt("exp-06","u-emp-03","Equipment — USB Hub and Monitor Stand","rejected",
              "u-manager-01","Equipment purchases must go through IT Procurement portal, not T&E. Please resubmit there.",
              submitted_days_ago=10, created_days_ago=12)
    db.add(r06); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-06", date=today-timedelta(days=12), category="tech",   description="Anker USB-C 11-in-1 hub", amount=89.00),
        ExpenseItem(report_id="exp-06", date=today-timedelta(days=12), category="tech",   description="Fully Jarvis monitor arm", amount=149.00),
    ])

    r07 = rpt("exp-07","u-emp-03","Chicago Acme Kick-off — May","draft",
              created_days_ago=1)
    db.add(r07); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-07", date=today-timedelta(days=1), category="transport",  description="Flight ORD (booked early — refundable)", amount=298.00),
        ExpenseItem(report_id="exp-07", date=today, category="other",                        description="FedEx — sent client onboarding package", amount=34.00),
    ])

    # ── David (emp-04) ───────────────────────────────────────────
    r08 = rpt("exp-08","u-emp-04","Operations Summit — Denver","under_review",
              submitted_days_ago=2, created_days_ago=8)
    db.add(r08); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-08", date=today-timedelta(days=8), category="transport",   description="Flight DEN round-trip (frontier)", amount=387.00),
        ExpenseItem(report_id="exp-08", date=today-timedelta(days=7), category="lodging",     description="Hyatt Place Denver Downtown — 2 nights", amount=235.00*2),
        ExpenseItem(report_id="exp-08", date=today-timedelta(days=7), category="conference",  description="Ops Excellence Summit registration", amount=750.00),
        ExpenseItem(report_id="exp-08", date=today-timedelta(days=7), category="meals",       description="Speaker dinner — invited by organizers", amount=88.00,
                    policy_violation=True, violation_detail="Meals limit is $75.00/item (submitted: $88.00)"),
        ExpenseItem(report_id="exp-08", date=today-timedelta(days=6), category="meals",       description="Team lunch — supply chain breakout", amount=72.00),
        ExpenseItem(report_id="exp-08", date=today-timedelta(days=6), category="transport",   description="Rideshare (conference ↔ hotel)", amount=109.00),
    ])

    r09 = rpt("exp-09","u-emp-04","Q1 Vendor Review — Portland","approved",
              "u-manager-03","Approved. Good documentation.", paid=True,
              submitted_days_ago=28, created_days_ago=34)
    db.add(r09); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-09", date=today-timedelta(days=34), category="transport",  description="Flight PDX round-trip", amount=268.00),
        ExpenseItem(report_id="exp-09", date=today-timedelta(days=33), category="lodging",    description="Hotel Zags Portland — 1 night", amount=210.00),
        ExpenseItem(report_id="exp-09", date=today-timedelta(days=33), category="meals",      description="Vendor dinner — 3 attendees", amount=67.00),
        ExpenseItem(report_id="exp-09", date=today-timedelta(days=33), category="transport",  description="Uber rides", amount=48.00),
    ])

    # ── Emma (emp-05) ────────────────────────────────────────────
    r10 = rpt("exp-10","u-emp-05","Content Marketing World — Cleveland","approved",
              "u-manager-02","Good conference. Expense totals look fine.", paid=True,
              submitted_days_ago=22, created_days_ago=28)
    db.add(r10); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-10", date=today-timedelta(days=28), category="transport",  description="Flight CLE round-trip (United)", amount=390.00),
        ExpenseItem(report_id="exp-10", date=today-timedelta(days=27), category="lodging",    description="Hilton Cleveland Downtown — 2 nights", amount=198.00*2),
        ExpenseItem(report_id="exp-10", date=today-timedelta(days=27), category="conference", description="Content Marketing World 2024 pass + workshops", amount=1495.00),
        ExpenseItem(report_id="exp-10", date=today-timedelta(days=27), category="meals",      description="Speaker networking lunch", amount=55.00),
        ExpenseItem(report_id="exp-10", date=today-timedelta(days=26), category="meals",      description="Dinner with influencer partners", amount=78.00,
                    policy_violation=True, violation_detail="Meals limit is $75.00/item (submitted: $78.00)"),
        ExpenseItem(report_id="exp-10", date=today-timedelta(days=26), category="transport",  description="Uber/Lyft (3 days)", amount=116.00),
    ])

    r11 = rpt("exp-11","u-emp-05","SXSW Advance Bookings","submitted",
              submitted_days_ago=1, created_days_ago=3)
    db.add(r11); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-11", date=today-timedelta(days=3), category="transport",  description="Flight AUS round-trip (early bird)", amount=440.00),
        ExpenseItem(report_id="exp-11", date=today-timedelta(days=2), category="conference", description="SXSW 2025 Platinum badge", amount=1850.00),
        ExpenseItem(report_id="exp-11", date=today-timedelta(days=2), category="tech",       description="Canva Pro (annual) — social content production", amount=120.00),
    ])

    # ── Frank (emp-06) ───────────────────────────────────────────
    r12 = rpt("exp-12","u-emp-06","Q2 Sales Kickoff — Las Vegas","submitted",
              submitted_days_ago=2, created_days_ago=5)
    db.add(r12); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-12", date=today-timedelta(days=5), category="transport",  description="Flight LAS round-trip (Spirit)", amount=218.00),
        ExpenseItem(report_id="exp-12", date=today-timedelta(days=4), category="lodging",    description="Caesars Palace — 2 nights", amount=355.00*2,
                    policy_violation=True, violation_detail="Lodging limit is $250.00/night (submitted: $355.00/night)"),
        ExpenseItem(report_id="exp-12", date=today-timedelta(days=4), category="conference", description="Sales Kickoff registration & materials", amount=800.00),
        ExpenseItem(report_id="exp-12", date=today-timedelta(days=4), category="meals",      description="Team dinner — first night", amount=82.00,
                    policy_violation=True, violation_detail="Meals limit is $75.00/item (submitted: $82.00)"),
        ExpenseItem(report_id="exp-12", date=today-timedelta(days=3), category="meals",      description="Lunch — quota planning session", amount=67.00),
        ExpenseItem(report_id="exp-12", date=today-timedelta(days=3), category="meals",      description="Coffee & breakfast (2 days)", amount=29.00),
        ExpenseItem(report_id="exp-12", date=today-timedelta(days=3), category="transport",  description="Rideshare — hotel to venue (2 days)", amount=78.00),
    ])

    r13 = rpt("exp-13","u-emp-06","NYC Prospecting Trip — March","approved",
              "u-manager-02","Good client coverage. Approved and queued for reimbursement.", paid=False,
              submitted_days_ago=12, created_days_ago=18)
    db.add(r13); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-13", date=today-timedelta(days=18), category="transport",  description="Amtrak NYC round-trip (Acela)", amount=310.00),
        ExpenseItem(report_id="exp-13", date=today-timedelta(days=17), category="lodging",    description="Marriott Times Square — 1 night", amount=240.00),
        ExpenseItem(report_id="exp-13", date=today-timedelta(days=17), category="meals",      description="Prospect dinner — 2 contacts from Stripe", amount=74.00),
        ExpenseItem(report_id="exp-13", date=today-timedelta(days=16), category="meals",      description="Coffee meetings (3 back-to-back)", amount=38.00),
        ExpenseItem(report_id="exp-13", date=today-timedelta(days=16), category="transport",  description="Taxi/subway — all-day meetings", amount=62.00),
    ])

    # ── Grace (emp-07) ───────────────────────────────────────────
    r14 = rpt("exp-14","u-emp-07","Web Summit Lisbon 2024","approved",
              "u-manager-01","International expenses look appropriate. Business class pre-approved for 8h+ flights. Approved.", paid=True,
              submitted_days_ago=50, created_days_ago=60)
    db.add(r14); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-14", date=today-timedelta(days=60), category="transport",  description="Business class SFO–LIS–SFO (TAP Air Portugal)", amount=2840.00),
        ExpenseItem(report_id="exp-14", date=today-timedelta(days=59), category="lodging",    description="Bairro Alto Hotel — 4 nights", amount=185.00*4),
        ExpenseItem(report_id="exp-14", date=today-timedelta(days=59), category="conference", description="Web Summit 2024 — Speaker pass", amount=0.00),
        ExpenseItem(report_id="exp-14", date=today-timedelta(days=59), category="meals",      description="Team dinner — first night in Lisbon", amount=63.00),
        ExpenseItem(report_id="exp-14", date=today-timedelta(days=58), category="meals",      description="Speaker dinner — hosted by Web Summit", amount=0.00),
        ExpenseItem(report_id="exp-14", date=today-timedelta(days=57), category="meals",      description="Working lunch — PT team meeting", amount=48.00),
        ExpenseItem(report_id="exp-14", date=today-timedelta(days=57), category="transport",  description="Uber/taxi — hotel to venue (4 days)", amount=98.00),
        ExpenseItem(report_id="exp-14", date=today-timedelta(days=56), category="other",      description="Currency conversion fee (international ATM)", amount=32.00),
    ])

    r15 = rpt("exp-15","u-emp-07","Platform Subscription Renewals — Q1","approved",
              "u-manager-01","Annual renewals are pre-approved. Good.", paid=False,
              submitted_days_ago=8, created_days_ago=10)
    db.add(r15); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-15", date=today-timedelta(days=10), category="tech", description="GitHub Copilot — annual team plan (12 seats)", amount=228.00),
        ExpenseItem(report_id="exp-15", date=today-timedelta(days=10), category="tech", description="Figma Professional — annual (3 seats)", amount=459.00),
        ExpenseItem(report_id="exp-15", date=today-timedelta(days=9),  category="tech", description="DataDog APM — monthly invoice", amount=312.00),
    ])

    # ── Henry (emp-08) ───────────────────────────────────────────
    r16 = rpt("exp-16","u-emp-08","LegalTech Summit 2024 — Chicago","approved",
              "u-finance-01","Approved. Within budget.", paid=True,
              submitted_days_ago=22, created_days_ago=30)
    db.add(r16); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-16", date=today-timedelta(days=30), category="transport",  description="Flight ORD round-trip (AA)", amount=290.00),
        ExpenseItem(report_id="exp-16", date=today-timedelta(days=29), category="lodging",    description="InterContinental Chicago — 2 nights", amount=210.00*2),
        ExpenseItem(report_id="exp-16", date=today-timedelta(days=29), category="conference", description="LegalTech Summit — attendee registration", amount=550.00),
        ExpenseItem(report_id="exp-16", date=today-timedelta(days=29), category="meals",      description="Networking luncheon", amount=60.00),
        ExpenseItem(report_id="exp-16", date=today-timedelta(days=28), category="transport",  description="Taxi (ORD → downtown)", amount=58.00),
    ])

    # ── Mike / Manager (mgr-01) ──────────────────────────────────
    r17 = rpt("exp-17","u-manager-01","Q1 Board Prep — New York","approved",
              "u-finance-01","Approved. Note: lodging rates in midtown are higher — exception noted on file.", paid=True,
              submitted_days_ago=25, created_days_ago=32)
    db.add(r17); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-17", date=today-timedelta(days=32), category="transport",  description="Business class SFO–JFK–SFO (Delta One)", amount=1420.00),
        ExpenseItem(report_id="exp-17", date=today-timedelta(days=31), category="lodging",    description="The Pierre Hotel NYC — 2 nights", amount=485.00*2,
                    policy_violation=True, violation_detail="Lodging limit is $250.00/night (submitted: $485.00/night). Exception pre-approved."),
        ExpenseItem(report_id="exp-17", date=today-timedelta(days=31), category="meals",      description="Board dinner — executive restaurant", amount=145.00,
                    policy_violation=True, violation_detail="Meals limit is $75.00/item (submitted: $145.00)"),
        ExpenseItem(report_id="exp-17", date=today-timedelta(days=30), category="transport",  description="Black car service — airport transfers", amount=285.00),
        ExpenseItem(report_id="exp-17", date=today-timedelta(days=30), category="other",      description="Printing — board presentation decks", amount=165.00),
    ])

    r18 = rpt("exp-18","u-manager-01","Singapore APAC Forum — Advance","draft",
              created_days_ago=1)
    db.add(r18); db.commit()
    db.add_all([
        ExpenseItem(report_id="exp-18", date=today, category="tech",   description="Duolingo (Mandarin) — 6-month subscription for APAC prep", amount=48.00),
        ExpenseItem(report_id="exp-18", date=today, category="other",  description="Visa application fee — Singapore E-visa", amount=75.00),
    ])

    db.commit()

    # ─────────────────────────────────────────────────────────────
    # NOTIFICATIONS
    # ─────────────────────────────────────────────────────────────
    notifs = [
        # For manager (mgr-01) — things needing attention
        Notification(id=nid(), user_id="u-manager-01", type="expense_submitted",
                     title="New expense report submitted",
                     message="Bob Smith submitted 'April Client Meetings — Chicago' ($1,015.00) for your review.",
                     read=False, ref_id="exp-04", ref_type="expense",
                     created_at=now - timedelta(hours=3)),
        Notification(id=nid(), user_id="u-manager-01", type="expense_submitted",
                     title="Expense report needs review",
                     message="Emma Davis submitted 'SXSW Advance Bookings' ($2,410.00) for your review.",
                     read=False, ref_id="exp-11", ref_type="expense",
                     created_at=now - timedelta(hours=8)),
        Notification(id=nid(), user_id="u-manager-01", type="travel_submitted",
                     title="Travel request pending approval",
                     message="David Kim requested travel to Denver, CO (4 days, budget $2,100) for Ops Excellence Summit.",
                     read=False, ref_id="tr-04", ref_type="travel",
                     created_at=now - timedelta(hours=18)),
        Notification(id=nid(), user_id="u-manager-01", type="travel_submitted",
                     title="Travel request — APAC Forum",
                     message="Your Singapore travel request ($7,500) has been forwarded to Finance for approval.",
                     read=True, ref_id="tr-09", ref_type="travel",
                     created_at=now - timedelta(hours=6)),
        Notification(id=nid(), user_id="u-manager-01", type="expense_violation",
                     title="Policy violation flagged",
                     message="Frank Wilson's 'Q2 Sales Kickoff' report has 2 policy violations totalling $210. Review required.",
                     read=False, ref_id="exp-12", ref_type="expense",
                     created_at=now - timedelta(days=2)),
        Notification(id=nid(), user_id="u-manager-01", type="expense_approved",
                     title="Expense reimbursed",
                     message="Finance has processed reimbursement for 'Q1 Board Prep — New York' ($2,500.00).",
                     read=True, ref_id="exp-17", ref_type="expense",
                     created_at=now - timedelta(days=3)),

        # For employee (emp-01, Alice)
        Notification(id=nid(), user_id="u-emp-01", type="expense_approved",
                     title="Expense report approved",
                     message="Mike Manager approved your 'AWS re:Invent 2024' report. Reimbursement of $3,127.00 is being processed.",
                     read=True, ref_id="exp-01", ref_type="expense",
                     created_at=now - timedelta(days=40)),
        Notification(id=nid(), user_id="u-emp-01", type="travel_approved",
                     title="Travel request approved ✓",
                     message="Your trip to New York, NY (Jun 14–17) has been approved. Please book through the travel portal.",
                     read=False, ref_id="tr-01", ref_type="travel",
                     created_at=now - timedelta(days=5)),
        Notification(id=nid(), user_id="u-emp-01", type="expense_violation",
                     title="Violation detected in draft report",
                     message="'Q2 Summit Prep Expenses' has a meals violation ($95 exceeds $75 limit). Fix before submitting.",
                     read=False, ref_id="exp-02", ref_type="expense",
                     created_at=now - timedelta(hours=12)),

        # For finance
        Notification(id=nid(), user_id="u-finance-01", type="travel_submitted",
                     title="High-value travel for approval",
                     message="Mike Manager submitted a Singapore travel request ($7,500). Requires Finance sign-off.",
                     read=False, ref_id="tr-09", ref_type="travel",
                     created_at=now - timedelta(hours=6)),
        Notification(id=nid(), user_id="u-finance-01", type="expense_approved",
                     title="Reimbursement queue: 3 reports ready",
                     message="Grace Lee, Frank Wilson, and Carol Johnson have approved reports totalling $6,804 pending payment.",
                     read=False, ref_id=None, ref_type=None,
                     created_at=now - timedelta(hours=2)),
        Notification(id=nid(), user_id="u-finance-01", type="expense_submitted",
                     title="Under-review: David Kim's Denver report",
                     message="Ops Summit expenses ($1,641) flagged for review — $88 meal exceeds policy limit.",
                     read=True, ref_id="exp-08", ref_type="expense",
                     created_at=now - timedelta(days=2)),
    ]
    db.add_all(notifs)
    db.commit()
    db.close()

    print("✅  Seed complete — 12 users · 10 travel requests · 18 expense reports · 12 notifications")
    print()
    print("   employee@company.com / password  →  Alice Chen (Employee, Engineering)")
    print("   manager@company.com  / password  →  Mike Manager (Manager, Engineering)")
    print("   finance@company.com  / password  →  Sarah Finance (Finance)")
    print()
    print("   Also seeded: bob@ · carol@ · david@ · emma@ · frank@ · grace@ · henry@ · diana@ · tom@")
    print("   All passwords: password")


if __name__ == "__main__":
    run()
