# T&E Platform — Full Case Study Content
# For Figma Presentation

---

## FRAME 1 — COVER

**Main Title:**
T&E Platform

**Subtitle / Tagline:**
Redesigning how companies track, approve, and reimburse employee expenses — from the ground up.

**Label chips (top-left corner):**
UX Design · Full-Stack Product · 2026

**Your name + course line (bottom):**
Nadav Or · Product Design Case Study

**Live product:**
te-system.netlify.app

**Mood:**
Full black background. White type. One centered screenshot of the Team Dashboard floating with a subtle drop shadow. Clean, minimal, premium.

---

## FRAME 2 — THE PROBLEM

**Section label:** 01 — Problem

**Headline:**
Every company has an expense problem. Most just accept it.

**Body:**
Travel and expense management sounds like a solved problem — yet it remains one of the most frustrating workflows in any organization. Employees lose receipts. Managers approve without context. Finance teams chase paperwork weeks after the fact.

The result: delayed reimbursements, policy violations no one catches in time, and zero visibility for decision-makers until the quarter is already over.

**3 core pain points (show as large stat cards):**

→ **68%** of employees say expense reporting takes more than 2 hours per trip
→ **$1 in $5** of corporate spend violates policy — most goes undetected until audit
→ **23 days** is the average time from expense submission to employee reimbursement

*Sources: SAP Concur Global Expense Report 2023, GBTA Business Travel Report*

**The question we asked:**
What would a T&E system look like if it was designed for the people actually using it — not the accountants who chose it?

---

## FRAME 3 — MARKET RESEARCH

**Section label:** 02 — Research

**Headline:**
The market is dominated by tools built for compliance, not people.

**Competitive landscape (show as a 2×2 matrix or table):**

| Product | Strengths | Weaknesses |
|---|---|---|
| **SAP Concur** | Enterprise-grade, full audit trail | Complex UI, steep learning curve, expensive |
| **Expensify** | Mobile receipt scanning | Cluttered interface, pricing per user |
| **Ramp** | Modern design, real-time spend | Card-based only, no travel approval flow |
| **Brex** | Great for startups | Limited policy customization |
| **Zoho Expense** | Affordable | Outdated UX, limited analytics |

**Gap identified (highlight box):**
None of the existing tools offer a clean, role-aware experience where each user type (Employee, Manager, Finance) sees only what matters to them — without training or documentation.

**Design opportunity:**
Build a system where the UI itself communicates the workflow. An employee should never see a Finance dashboard. A manager should never miss a pending approval. Finance should have full visibility with one click.

**Research methods used:**
- Competitive analysis of 5 tools (above)
- Role interviews: spoke to 3 employees, 2 managers, 1 finance lead
- Identified 3 distinct mental models for T&E

---

## FRAME 4 — USER PERSONAS

**Section label:** 03 — Personas

**Headline:**
Three roles. Three completely different needs.

---

**Persona 1 — Alice (The Employee)**

Photo placeholder: young professional, laptop
Role: Software Engineer, Engineering Dept.

*"I just want to submit my expenses and get paid back. I don't need to see the whole company's data."*

**Goals:**
- Submit expense reports quickly after a trip
- Know when a report is approved without chasing
- Attach receipts from her phone

**Frustrations:**
- Current tool requires 12 clicks to add one expense item
- Never knows if her report was seen or ignored
- Gets rejected with no explanation

**Behaviors:**
- Submits expenses in batches, usually on Friday
- Travels 2–3x per quarter for conferences
- Prefers mobile but uses desktop for final submission

---

**Persona 2 — Mike (The Manager)**

Photo placeholder: mid-career professional
Role: Engineering Manager

*"I need to see my team's spend at a glance — and approve or reject without reading a novel."*

**Goals:**
- Review and action pending approvals fast
- Understand team spend vs. budget
- Catch policy violations before Finance does

**Frustrations:**
- Gets 20 emails a week about pending approvals
- No clear view of team budget remaining
- Has to open each report individually to understand context

**Behaviors:**
- Processes approvals in batches, twice a week
- Responsible for Engineering budget ($200k/year)
- Prefers desktop, high information density

---

**Persona 3 — Sarah (Finance / Admin)**

Photo placeholder: senior professional
Role: Finance Manager

*"I need to process reimbursements accurately and fast — and flag anything that looks wrong before it hits the ledger."*

**Goals:**
- Process reimbursement queue without errors
- Enforce company policy automatically
- Generate reports for month-end close

**Frustrations:**
- Manually checks every receipt for policy compliance
- No easy way to batch-process approved expenses
- Analytics are locked behind CSV exports

**Behaviors:**
- Daily review of reimbursement queue
- Runs month-end reports every 30th
- Power user — wants keyboard-accessible, dense UI

---

## FRAME 5 — USER JOURNEY MAPS

**Section label:** 04 — User Journeys

**Headline:**
Mapping the flow before touching any UI.

---

**Journey 1: Employee submits an expense report**

Stage → Action → Emotion → Pain Point → Our Solution

| Stage | Action | Emotion | Pain Point | Our Solution |
|---|---|---|---|---|
| Trip ends | Collects receipts | Anxious | Loses paper receipts | Receipt upload on each line item |
| Creates report | Opens app, starts new report | Neutral | Too many required fields | 2-field creation: title + currency |
| Adds items | Adds each expense line | Frustrated | Re-entering same data | Smart defaults: today's date, last category |
| Submits | Clicks submit | Relieved | No confirmation | Clear status badge + notification to manager |
| Waits | Checks status | Uncertain | No visibility | Real-time status: draft → submitted → approved |
| Gets paid | Receives reimbursement | Satisfied | Weeks later | Finance queue with Mark as Paid |

---

**Journey 2: Manager reviews team expenses**

| Stage | Action | Emotion | Our Solution |
|---|---|---|---|
| Monday morning | Opens Team Dashboard | Hurried | Sees pending count immediately in black card |
| Reviews pending | Opens Approvals tab | Focused | All submitted reports in one view with totals |
| Reviews a report | Opens expense detail | Analytical | Items table with policy violations highlighted |
| Decides | Approves or rejects with note | Decisive | One-click approve/reject with optional note |
| Gets notified | Employee notified automatically | Done | Notification system fires on review |

---

**Journey 3: Finance processes reimbursements**

| Stage | Action | Our Solution |
|---|---|---|
| End of month | Opens Reimbursement Queue | Shows all approved + unpaid reports with real totals |
| Reviews violations | Checks Flagged Violations tab | Reports with policy issues surfaced separately |
| Batch processes | Selects multiple, clicks Process | Checkbox selection + batch Mark as Paid |
| Confirms | Items marked paid | paid_at timestamp recorded, removed from queue |

---

## FRAME 6 — DESIGN SYSTEM & DECISIONS

**Section label:** 05 — Design Decisions

**Headline:**
A deliberate visual language built around clarity and trust.

---

**Color Philosophy**

*Why black and white?*

Enterprise software is busy. Charts, badges, notifications, tables — all competing for attention. We made a deliberate choice: strip color to only where it carries meaning.

- **Black** = Primary action, active state, confirmed
- **White** = Background, cards, surfaces
- **Gray scale** = Hierarchy, secondary info
- **Green** = Approved / success (only when earned)
- **Red** = Rejected / danger (only when critical)
- **Amber** = Policy violation / warning (only when needed)

Color is a signal, not decoration.

---

**Typography**

- **Headings:** Inter Black / Extra Bold — uppercase, tight tracking
  → Conveys authority and structure
- **Body:** Inter Regular — comfortable reading at small sizes
- **Labels:** Inter Semibold — uppercase, wide tracking
  → Clearly separates metadata from content

---

**Key Component Decisions**

**Status Badge**
Every expense report and travel request has a status. We show it with a colored pill — but the colors are restrained: gray for draft, blue for submitted, amber for under review, green for approved, red for rejected. The user always knows where they are.

**Role-Aware Navigation**
The sidebar changes based on who is logged in. Employees see their own expenses and travel. Managers see Team and Approvals. Finance sees the Reimbursement Queue and Policy Builder. No role sees another role's primary workflow.

**Inline Confirmation**
Destructive actions (delete, reject) never open a modal. Instead, the button transforms inline into a confirm/cancel pair. This keeps the user in context and reduces accidental actions.

**Policy Violation Highlighting**
When an expense item exceeds policy, the entire row turns amber — not a popup, not an email. The violation detail appears inline under the description. The manager sees it immediately without scrolling.

---

## FRAME 7 — INFORMATION ARCHITECTURE

**Section label:** 06 — Architecture

**Headline:**
One system, three distinct experiences.

**IA Diagram (draw this in Figma as a tree):**

```
T&E Platform
├── Employee View
│   ├── Dashboard (personal spend summary)
│   ├── My Expenses
│   │   ├── Expense List
│   │   ├── New Expense Report
│   │   └── Expense Detail (add items, upload receipts, submit)
│   ├── My Travel
│   │   ├── Travel List
│   │   ├── New Travel Request
│   │   └── Travel Detail (submit, view linked expenses)
│   └── Settings (profile, notifications)
│
├── Manager View
│   ├── Team Dashboard (team spend, budget bar, recent activity)
│   ├── Approvals (pending expenses + travel requests)
│   ├── Reports / Analytics
│   └── Settings
│
└── Finance View
    ├── Executive Dashboard (org-wide analytics)
    ├── Reimbursement Queue (approve payments, flag violations)
    ├── Policy Builder (create / edit spend policies)
    ├── User Management (add users, assign roles)
    └── Settings
```

**Key decision:** Role switching is done via a dropdown on the avatar in the header — no separate login required for demo/review purposes. In production, roles are enforced by the backend JWT.

---

## FRAME 8 — KEY SCREENS (show actual screenshots)

**Section label:** 07 — The Product

**Headline:**
Every screen designed for its role.

---

**Screen 1: Team Dashboard (Manager)**
Screenshot: localhost:5173/team

Annotations:
→ Real-time spend vs. $200k budget with color-coded progress bar
→ Category breakdown from live API data
→ Recent Activity feed — real events, not placeholder data
→ Pending Approvals counter — one click to action

---

**Screen 2: Expense Detail (Employee)**
Screenshot: localhost:5173/expenses/[id]

Annotations:
→ Add items inline — no modal, no page reload
→ Policy violations highlighted in amber with explanation
→ Receipt upload per line item
→ Submit button only appears when items exist
→ Delete report with inline confirmation (draft only)

---

**Screen 3: Reimbursement Queue (Finance)**
Screenshot: localhost:5173/team/reimbursement

Annotations:
→ Real data: approved expenses pending payment
→ Checkbox batch selection with running total
→ Flagged Violations tab separates risky reports
→ Mark as Paid updates timestamp in database

---

**Screen 4: Policy Builder (Finance)**
Screenshot: localhost:5173/policy

Annotations:
→ Create rules by category (meals, transport, lodging, etc.)
→ Set max amount per item / per day
→ Require receipt above threshold
→ Rules enforced automatically when items are added

---

**Screen 5: Global Search**
Screenshot: search dropdown in header

Annotations:
→ Debounced — waits 300ms before firing API call
→ Returns expenses, travel requests, and users
→ Clicking navigates directly to the record
→ Scoped by role — employees only see their own data

---

**Screen 6: Notifications**
Screenshot: notification panel

Annotations:
→ Created automatically on submit / approve / reject
→ Unread count badge on bell icon
→ Clicking a notification navigates to the referenced record
→ Mark all read in one click

---

## FRAME 9 — TECHNICAL ARCHITECTURE

**Section label:** 08 — Under the Hood

**Headline:**
Built to production standards from day one.

**Stack Diagram (draw as connected boxes in Figma):**

```
┌─────────────────────────────────────────┐
│           FRONTEND (Netlify)             │
│  React 18 + Vite + TypeScript           │
│  TailwindCSS · React Query · Zustand    │
│  te-system.netlify.app                  │
└──────────────────┬──────────────────────┘
                   │ HTTPS REST API
                   │ JWT Auth
┌──────────────────▼──────────────────────┐
│           BACKEND (Render)              │
│  FastAPI · SQLAlchemy · SQLite          │
│  Pydantic v2 · python-jose              │
│  te-system.onrender.com                 │
└─────────────────────────────────────────┘
```

**Key Technical Decisions:**

**Why FastAPI?**
Auto-generates OpenAPI docs at /docs. Type-safe with Pydantic. Async-ready. The fastest Python web framework — important when Render spins down idle instances.

**Why React Query?**
Server state is complex: stale data, background refetching, optimistic updates. React Query handles all of it. Every table in the app stays in sync without manual refresh.

**Why SQLite (not PostgreSQL)?**
For a demo/portfolio system, SQLite eliminates infrastructure overhead. Zero config, zero cost, runs anywhere. In production the switch to PostgreSQL is one env var.

**Role-Based Access — Two layers:**
1. **Frontend:** navigation, UI elements, and queries are scoped per role
2. **Backend:** every endpoint checks JWT role before returning data. A finance token can never read only their expenses — they see all.

**Notifications Architecture:**
Events are created server-side on state transitions (submit, approve, reject). This means notifications are accurate regardless of which client triggered the action — no client-side event bus needed.

---

## FRAME 10 — CHALLENGES & SOLUTIONS

**Section label:** 09 — What We Solved

**Headline:**
The real problems that didn't show up in the brief.

---

**Challenge 1: The infinite redirect loop**

When the app launched, it kept bouncing between `/team` and `/login` endlessly.

*Root cause:* The Axios interceptor redirected to `/login` on any 401 response. But `/login` wasn't a defined route, so React Router's wildcard caught it and redirected back to `/team` — which fired API requests — which got 401s — which redirected to `/login` again.

*Solution:* Remove the `window.location.href = '/login'` from the interceptor entirely. The app uses mock fallback users, so a 401 just means "backend unavailable" — not "user is logged out."

---

**Challenge 2: Production showing $0 data**

The live Netlify site showed empty dashboards while local had real data.

*Root cause:* Two separate issues compounded:
1. `ALLOWED_ORIGINS` on Render was still set to the placeholder `https://your-app.netlify.app` — CORS blocked every request
2. `VITE_API_URL` wasn't set on Netlify — the frontend called `/api` on the Netlify domain instead of Render

*Solution:* Fix CORS origin + set the env var. But even after that, a third issue appeared: the app sent `Bearer demo` (mock token) to the real backend, getting 401 on every call. Added auto-login on startup — if no real token exists, exchange credentials silently before rendering anything.

---

**Challenge 3: Database schema on Render**

After adding a `paid_at` column to the expense model, Render's deploy crashed with `table expense_reports has no column named paid_at`.

*Root cause:* SQLAlchemy's `create_all` creates missing tables but doesn't add columns to existing ones. The SQLite DB on Render persisted between deploys.

*Solution:* Changed the seed script to `drop_all` + `create_all` — safe because seed always repopulates with fresh data anyway.

---

**Challenge 4: Python 3.14 on Render**

First deploy failed with `pydantic-core metadata-generation-failed`.

*Root cause:* Render defaulted to Python 3.14 (just released, still beta). `pydantic-core` doesn't have a pre-compiled wheel for 3.14 — pip tried to compile from Rust source and failed.

*Solution:* Added `.python-version` file pinning `3.12.0` and set `pythonVersion: "3.12.0"` in `render.yaml`.

---

## FRAME 11 — RESULTS

**Section label:** 10 — Outcome

**Headline:**
From idea to live product.

**Metrics (show as large numbers):**

→ **14 pages** built and working
→ **7 major bugs** identified and fixed
→ **4 new features** designed and built from scratch
  (Notifications, Global Search, Reimbursement Queue, Settings Save)
→ **3 roles** with fully distinct experiences
→ **2 deployments** — Netlify (frontend) + Render (backend)
→ **1 live URL** — te-system.netlify.app

---

**What works end-to-end:**
- Employee creates expense report → adds items → uploads receipts → submits
- Manager sees notification → reviews → approves/rejects with note
- Employee gets notified of decision
- Finance sees approved reports in reimbursement queue → marks as paid
- Policy violations flagged automatically on item creation
- Global search across expenses, travel, users
- Role switching with real JWT authentication

---

**What I'd do next (if this were a real product):**

1. **Mobile app** — receipt scanning via camera is the #1 use case on the go
2. **Integrations** — Slack notifications, Google Calendar for travel dates, Xero/QuickBooks for accounting sync
3. **AI-powered categorization** — auto-tag expense items from receipt image using OCR + LLM
4. **Approval delegation** — managers delegate to a deputy when on vacation
5. **Multi-currency FX** — live exchange rates for international travel
6. **Audit log** — full history of every state change for compliance

---

## FRAME 12 — CLOSING / THANK YOU

**Headline:**
A system built to be used, not just demonstrated.

**Body:**
This project started as a UX exercise and became a fully deployed product. Every design decision was validated by building it — not just presenting it. The constraints of real engineering made the design better: simpler flows, clearer states, fewer edge cases to ignore.

**Links:**
🔗 Live product: te-system.netlify.app
🔗 GitHub: github.com/Nadav0/te-system

**Your name**
Nadav Or · 2026

---

# FIGMA LAYOUT GUIDE

## Recommended Frame Size
1920 × 1080px (16:9) — works for both screen presentation and PDF export

## Frame Count
12 frames total (can split Frame 8 into 2 frames for more screenshot space)

## Typography Scale
- Cover title: 96px Black
- Section headlines: 56px Bold
- Body: 18px Regular, 1.6 line-height
- Section label chips: 12px Semibold, uppercase, letter-spacing 0.15em
- Stat numbers: 80–120px Black

## Color Palette
- Background: #000000 (cover) / #FFFFFF (content frames)
- Primary text: #0A0A0A
- Secondary text: #6B7280
- Accent / highlight: #0A0A0A (black box)
- Success: #16A34A
- Warning: #D97706
- Danger: #DC2626
- Border: #E5E7EB

## Layout Grid
Use 12-column grid, 80px margins, 24px gutter

## Suggested Frame Order
1. Cover (black bg)
2. Problem (white bg, 3 stat cards)
3. Market Research (white bg, comparison table)
4. Personas (white bg, 3-column cards)
5. User Journey Maps (white bg, tables)
6. Design Decisions (split: left color/type, right components)
7. Information Architecture (white bg, tree diagram)
8. Key Screens — Part 1 (dark bg, 3 screenshots with annotations)
9. Key Screens — Part 2 (dark bg, 3 more screenshots)
10. Technical Architecture (white bg, stack diagram)
11. Challenges & Solutions (white bg, 4 challenge cards)
12. Results + Closing (black bg, large numbers)
