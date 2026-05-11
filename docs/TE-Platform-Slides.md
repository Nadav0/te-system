---
marp: true
theme: default
paginate: true
style: |
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  :root {
    --brand: #4F46E5;
    --brand-dark: #3730A3;
    --brand-light: #EEF2FF;
    --ink: #0F0F14;
    --ink-2: #3A3A4A;
    --ink-3: #7A7A90;
    --surface: #F8F8FC;
    --white: #FFFFFF;
    --green: #059669;
    --amber: #D97706;
    --red: #DC2626;
    --border: #E2E2EB;
  }

  * { font-family: 'Inter', system-ui, sans-serif; box-sizing: border-box; }

  section {
    background: var(--white);
    color: var(--ink);
    padding: 52px 64px;
    font-size: 16px;
    line-height: 1.6;
  }

  section::after {
    font-size: 12px;
    color: var(--ink-3);
    font-weight: 500;
  }

  /* ── Title slide ── */
  section.title {
    background: linear-gradient(135deg, #312E81 0%, #4F46E5 50%, #6366F1 100%);
    color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 72px 80px;
  }
  section.title h1 {
    font-size: 52px;
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    color: white;
    margin: 0 0 16px;
  }
  section.title p {
    font-size: 18px;
    color: rgba(255,255,255,0.75);
    margin: 0;
    font-weight: 400;
  }
  section.title .badge {
    display: inline-block;
    background: rgba(255,255,255,0.15);
    border: 1px solid rgba(255,255,255,0.25);
    border-radius: 100px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 600;
    color: rgba(255,255,255,0.9);
    margin-bottom: 32px;
    width: fit-content;
  }

  /* ── Section divider ── */
  section.divider {
    background: var(--surface);
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 72px 80px;
  }
  section.divider .step-num {
    font-size: 72px;
    font-weight: 800;
    color: var(--brand-light);
    line-height: 1;
    margin-bottom: 8px;
    letter-spacing: -0.04em;
  }
  section.divider h2 {
    font-size: 40px;
    font-weight: 700;
    color: var(--brand);
    margin: 0 0 16px;
    letter-spacing: -0.02em;
  }
  section.divider p {
    font-size: 17px;
    color: var(--ink-2);
    margin: 0;
    max-width: 540px;
  }

  /* ── Standard content ── */
  h1 { font-size: 32px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; margin: 0 0 24px; }
  h2 { font-size: 28px; font-weight: 700; color: var(--ink); letter-spacing: -0.02em; margin: 0 0 20px; }
  h3 { font-size: 16px; font-weight: 600; color: var(--brand); text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 12px; }

  p { margin: 0 0 14px; color: var(--ink-2); }

  ul { padding-left: 20px; margin: 0; }
  li { margin-bottom: 10px; color: var(--ink-2); }
  li strong { color: var(--ink); }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
    margin-top: 8px;
  }
  th {
    background: var(--brand);
    color: white;
    padding: 10px 14px;
    text-align: left;
    font-weight: 600;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  td {
    padding: 10px 14px;
    border-bottom: 1px solid var(--border);
    color: var(--ink-2);
    vertical-align: top;
  }
  tr:nth-child(even) td { background: var(--surface); }
  tr:last-child td { border-bottom: none; }

  /* ── Pill tags ── */
  .tag {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 12px;
    font-weight: 600;
    margin: 2px 3px 2px 0;
  }
  .tag-indigo { background: #EEF2FF; color: #4F46E5; }
  .tag-green  { background: #D1FAE5; color: #065F46; }
  .tag-amber  { background: #FEF3C7; color: #92400E; }
  .tag-red    { background: #FEE2E2; color: #991B1B; }
  .tag-gray   { background: #F3F4F6; color: #374151; }

  /* ── Accent bar ── */
  .accent-bar {
    width: 40px;
    height: 4px;
    background: var(--brand);
    border-radius: 2px;
    margin-bottom: 20px;
  }

  /* ── Stat cards row ── */
  .stats {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 16px;
    margin-top: 16px;
  }
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px 18px;
  }
  .stat-card .num {
    font-size: 32px;
    font-weight: 800;
    color: var(--brand);
    letter-spacing: -0.03em;
    line-height: 1;
    margin-bottom: 6px;
  }
  .stat-card .label {
    font-size: 12px;
    font-weight: 600;
    color: var(--ink-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  /* ── Two-column layout ── */
  .cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    margin-top: 4px;
  }
  .col-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 22px 22px;
  }
  .col-box h4 {
    font-size: 13px;
    font-weight: 700;
    color: var(--brand);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin: 0 0 12px;
  }
  .col-box ul { padding-left: 16px; }
  .col-box li { font-size: 14px; margin-bottom: 8px; }

  /* ── Persona card ── */
  .persona-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
  }
  .persona-avatar {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    font-weight: 800;
    color: white;
    flex-shrink: 0;
  }
  .persona-meta h2 { margin: 0 0 4px; font-size: 24px; }
  .persona-meta p  { margin: 0; font-size: 14px; color: var(--ink-3); }

  /* ── Quote block ── */
  blockquote {
    border-left: 3px solid var(--brand);
    margin: 0 0 16px;
    padding: 12px 20px;
    background: var(--brand-light);
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: var(--ink-2);
    font-size: 15px;
  }

  /* ── Footer brand strip ── */
  section.has-footer::before {
    content: 'TRAVELEX — Expense Intelligence Platform';
    position: absolute;
    bottom: 18px;
    left: 64px;
    font-size: 11px;
    font-weight: 600;
    color: var(--ink-3);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
---

<!-- _class: title -->
<!-- _paginate: false -->

<div class="badge">UX/UI Course Capstone · Pre-Design Phase</div>

# Travelex
## T&E Platform
### Process Documentation

<p>A structured, AI-assisted UX methodology from problem definition to implementation-ready handoff.</p>

---

<!-- _class: has-footer -->

## Project at a Glance

<div class="accent-bar"></div>

<div class="stats">
  <div class="stat-card">
    <div class="num">7</div>
    <div class="label">UX Phases</div>
  </div>
  <div class="stat-card">
    <div class="num">3</div>
    <div class="label">Role Portals</div>
  </div>
  <div class="stat-card">
    <div class="num">15</div>
    <div class="label">Deliverables</div>
  </div>
  <div class="stat-card">
    <div class="num">5</div>
    <div class="label">User Types</div>
  </div>
  <div class="stat-card">
    <div class="num">50</div>
    <div class="label">Screenshots</div>
  </div>
</div>

| Attribute | Detail |
|---|---|
| **Project Type** | UX/UI Capstone — Pre-Design Phase |
| **User Types** | Employee · Manager · Finance · Admin · Executive/CFO |
| **Portals Implemented** | Employee · Manager · Finance (Admin + Executive consolidated) |
| **Key Frameworks** | Kano Model · MoSCoW · JTBD · RBAC · ERD · Journey Mapping |
| **Handoff** | Full-stack Travelex app + NotebookLM knowledge base |

---

<!-- _class: has-footer -->

## The Business Problem

<div class="accent-bar"></div>

T&E management runs on email threads, paper receipts, and spreadsheets at most companies. The tension is structural — four groups, four different definitions of "done."

<div class="cols">
  <div class="col-box">
    <h4>Who suffers</h4>
    <ul>
      <li><strong>Employees</strong> — lose receipts, no visibility on where their reimbursement is</li>
      <li><strong>Managers</strong> — approval bottlenecks, no policy context, can't delegate</li>
      <li><strong>Finance</strong> — manual GL coding, violations caught after the fact</li>
      <li><strong>Executives</strong> — spend data arrives weeks late, no proactive alerts</li>
    </ul>
  </div>
  <div class="col-box">
    <h4>What Travelex solves</h4>
    <ul>
      <li>Pre-trip travel approval with budget tracking</li>
      <li>Expense capture with AI-assisted GL coding</li>
      <li>Multi-tier approval workflow with policy flags at submission time</li>
      <li>Real-time spend analytics for finance and management</li>
    </ul>
  </div>
</div>

---

<!-- _class: has-footer -->

## The Six-Step Methodology

<div class="accent-bar"></div>

Each phase was treated as a gate — outputs had to be sufficient before proceeding. Iteration happened *within* each step, not across them.

| # | Phase | Key Output |
|---|---|---|
| 1 | **Problem Definition** | Bounded problem statement, scope decisions, success criteria |
| 2 | **Research** | Market research report, user sentiment synthesis |
| 3 | **Personas & User Stories** | 5 personas with JTBD framing and user stories |
| 4 | **Journey Mapping** | 3 end-to-end flows, cross-role handoff diagram |
| 5 | **Feature Prioritization** | Kano + MoSCoW matrix, MVP scope locked |
| 6 | **Information Architecture** | Sitemap, user action tree, wireframe prompts |

> Every deliverable was drafted by AI, critiqued by the designer, and iterated — almost nothing was accepted on first pass.

---

<!-- _class: divider -->

<div class="step-num">01</div>

## Problem Definition

Framing the T&E problem, setting scope boundaries, and defining measurable success criteria before any requirements were written.

---

<!-- _class: has-footer -->

## Problem Definition

<div class="accent-bar"></div>

<div class="cols">
  <div class="col-box">
    <h4>In scope</h4>
    <ul>
      <li>Travel pre-approval requests</li>
      <li>Expense capture and submission</li>
      <li>Manager approval workflow</li>
      <li>Finance GL coding and policy enforcement</li>
      <li>Spend reporting and analytics</li>
    </ul>
  </div>
  <div class="col-box">
    <h4>Explicitly out of scope (MVP)</h4>
    <ul>
      <li>In-app travel booking engine</li>
      <li>Corporate card auto-reconciliation</li>
      <li>ERP / accounting system integration</li>
      <li>Procurement and vendor payments</li>
    </ul>
  </div>
</div>

**Success criteria defined:**
- Reimbursement cycle time reduction
- Policy compliance rate improvement
- Finance month-end close time reduction

> Excluding a booking engine was the single most important scope decision — it would have doubled the technical surface area and shifted the product toward a travel marketplace model.

---

<!-- _class: divider -->

<div class="step-num">02</div>

## Research

Market analysis of the T&E SaaS landscape and synthesis of user sentiment from public sources.

---

<!-- _class: has-footer -->

## Research Findings

<div class="accent-bar"></div>

<div class="cols">
  <div class="col-box">
    <h4>What incumbents do well</h4>
    <ul>
      <li>Approval workflow routing</li>
      <li>OCR receipt capture</li>
      <li>Corporate card integration</li>
      <li>Policy rule engines</li>
    </ul>
  </div>
  <div class="col-box">
    <h4>Where they fall short</h4>
    <ul>
      <li>Employee submission experience — an afterthought</li>
      <li>Over-complex admin configuration</li>
      <li>Weak real-time analytics for executives</li>
      <li>Policy feedback at rejection, not submission</li>
    </ul>
  </div>
</div>

**Design differentiator identified:**

The employee-side experience is consistently rated lowest in reviews. Most tools are optimised for Finance — the person submitting the expense is a secondary consideration. Positioning Travelex around a **fast, low-friction submission flow with policy guidance at point of entry** became the core design principle carried forward.

---

<!-- _class: divider -->

<div class="step-num">03</div>

## Personas & User Stories

Five user types grounded in real frustration patterns, each with JTBD framing and representative user stories.

---

<!-- _class: has-footer -->

## Persona — Employee

<div class="persona-header">
  <div class="persona-avatar" style="background: linear-gradient(135deg, #059669, #047857);">AE</div>
  <div class="persona-meta">
    <h2>Alice · Engineering</h2>
    <p>Submits 8–12 expenses per month · High travel frequency</p>
  </div>
</div>

| | |
|---|---|
| **Primary goal** | Submit quickly, get reimbursed without friction |
| **Key frustration** | Policy rules are unclear at submission; rejection arrives days later with no explanation |
| **JTBD** | *Hire the platform to make submitting expenses so fast it becomes a non-event* |

**User stories:**
- As an employee, I want to photograph a receipt and have the amount pre-filled, so I can submit in under 60 seconds.
- As an employee, I want to see where my report is in the approval chain, so I can follow up with the right person.
- As an employee, I want a clear rejection reason, so I can resubmit without going back and forth by email.

---

<!-- _class: has-footer -->

## Persona — Manager

<div class="persona-header">
  <div class="persona-avatar" style="background: linear-gradient(135deg, #4F46E5, #3730A3);">MM</div>
  <div class="persona-meta">
    <h2>Mike · Engineering Manager</h2>
    <p>Reviews 15–25 expense reports per month · Frequently travelling</p>
  </div>
</div>

| | |
|---|---|
| **Primary goal** | Approve accurately and quickly without becoming a bottleneck |
| **Key frustration** | Approval requests arrive through email with no policy context |
| **JTBD** | *Hire the platform to handle approval overhead so I can focus on my team* |

**User stories:**
- As a manager, I want a policy violation summary before I approve, so I can decide without reading every line item.
- As a manager, I want to delegate approval authority when I am out of office, so reimbursements are not blocked.
- As a manager, I want a daily digest of pending approvals — not one email per request.

---

<!-- _class: has-footer -->

## Persona — Finance

<div class="persona-header">
  <div class="persona-avatar" style="background: linear-gradient(135deg, #D97706, #B45309);">SF</div>
  <div class="persona-meta">
    <h2>Sarah · Finance Manager</h2>
    <p>Owns GL coding, policy enforcement, and month-end close</p>
  </div>
</div>

| | |
|---|---|
| **Primary goal** | Close the books accurately and on time; produce audit-ready records |
| **Key frustration** | Approved reports arrive requiring manual GL coding; violations caught too late |
| **JTBD** | *Hire the platform to eliminate manual reconciliation and give me confidence in compliance* |

**User stories:**
- As a finance team member, I want AI-suggested GL codes pre-populated on approved reports, so I can confirm rather than assign from scratch.
- As a finance team member, I want a dedicated coding queue for batch processing of transactions.
- As a finance team member, I want spend-by-category reports filterable by department and date range.

---

<!-- _class: has-footer -->

## Personas — Admin & Executive

<div class="cols">
  <div class="col-box">
    <h4>Administrator</h4>
    <p style="font-size:13px; color: var(--ink-3); margin-bottom: 12px;">IT / Operations · Configures the platform</p>
    <ul>
      <li><strong>Goal:</strong> Configure policies and users without engineering support</li>
      <li><strong>Frustration:</strong> Policy changes require IT tickets in legacy tools</li>
      <li><strong>JTBD:</strong> <em>Hire the platform to run itself with minimal maintenance</em></li>
    </ul>
    <br>
    <p style="font-size:12px; color: var(--ink-3);"><strong>Implementation note:</strong> Admin functions merged into the Finance role in Travelex.</p>
  </div>
  <div class="col-box">
    <h4>Executive / CFO</h4>
    <p style="font-size:13px; color: var(--ink-3); margin-bottom: 12px;">C-Suite · Needs real-time spend visibility</p>
    <ul>
      <li><strong>Goal:</strong> Real-time spend visibility; identify budget risks early</li>
      <li><strong>Frustration:</strong> Spend data arrives at month-end, no proactive alerts</li>
      <li><strong>JTBD:</strong> <em>Same visibility into T&E spend as into revenue</em></li>
    </ul>
    <br>
    <p style="font-size:12px; color: var(--ink-3);"><strong>Implementation note:</strong> Executive analytics live under Manager → Team in Travelex.</p>
  </div>
</div>

---

<!-- _class: divider -->

<div class="step-num">04</div>

## Journey Mapping

End-to-end flows mapped across roles — with the handoffs between them made explicit.

---

<!-- _class: has-footer -->

## Journey Mapping — Key Insight

<div class="accent-bar"></div>

Three flows mapped: **Employee submission → Manager review → Finance processing.**

The most valuable output was making cross-role handoffs explicit:

| Handoff Point | From → To | What passes | Failure mode |
|---|---|---|---|
| Submission | Employee → Manager | Report + line items + policy flags | Manager has no context to decide quickly |
| Approval | Manager → Finance | Approved report + review note | Finance still needs to manually assign GL codes |
| Coding | Finance → Payment | GL-coded report | Report sits in queue; employee has no visibility |
| Rejection | Manager → Employee | Review note | No explanation → incorrect resubmission |
| Escalation | Manager → Finance | High-value report | No threshold-based routing |

> The moment a manager approves a report and it enters the finance queue is **completely invisible to the employee** — this is why "where is my reimbursement?" is the most common T&E complaint. This surfaced a core requirement: a timestamped audit trail accessible to employees at all times.

---

<!-- _class: divider -->

<div class="step-num">05</div>

## Feature Prioritization

Dual-framework approach: Kano Model for user value classification, MoSCoW for release scoping.

---

<!-- _class: has-footer -->

## Kano + MoSCoW Matrix

<div class="accent-bar"></div>

| Feature | Kano | MoSCoW | Release |
|---|---|---|---|
| Receipt capture (OCR photo-to-form) | Basic | Must Have | MVP |
| Multi-tier approval workflow | Basic | Must Have | MVP |
| Policy rule engine (per-category limits) | Basic | Must Have | MVP |
| Reimbursement status tracking | Performance | Must Have | MVP |
| Mobile-first submission flow | Performance | Must Have | MVP |
| Real-time spend dashboard | Performance | Should Have | MVP |
| AI-suggested GL code assignment | Excitement | Should Have | MVP |
| Delegation of approval authority | Performance | Should Have | MVP |
| Bulk CSV export | Basic | Must Have | MVP |
| Anomaly / duplicate receipt detection | Excitement | Could Have | Release 2 |
| ERP integration | Basic | Won't Have | Release 2 |
| In-app travel booking engine | Indifferent | Won't Have | Release 3 |

---

<!-- _class: divider -->

<div class="step-num">06</div>

## Information Architecture

Sitemap, RBAC-shaped user action tree, and wireframe prompts — the handoff layer between discovery and visual design.

---

<!-- _class: has-footer -->

## Portal Navigation — Implemented

<div class="accent-bar"></div>

RBAC principles were used as an IA-shaping tool: mapping create/read/update/delete permissions per role per entity determined what appeared in each portal's navigation.

| Portal | Navigation |
|---|---|
| **Employee** | Dashboard · Expenses · Travel · Settings |
| **Manager** | Dashboard · Approvals · Expenses · Travel · Team *(+ Executive analytics)* · Analytics · Settings |
| **Finance** | Dashboard · Policies · Expenses · Travel · Coding Queue · Analytics · Export · Settings |

<br>

**Key IA decision:** The **GL Coding Queue** is a dedicated sequential interface — not embedded in the expense list. Finance team members process transactions in batches; context-switching between review and coding is a known source of errors. This decision came directly from the Finance journey map.

---

<!-- _class: has-footer -->

## Data Model — ERD Entities

<div class="accent-bar"></div>

The ERD was produced during the pre-design phase — not delegated to engineering — because data model decisions have direct UI consequences.

<div class="cols">
  <div class="col-box">
    <h4>Core entities (implemented)</h4>
    <ul>
      <li><strong>User</strong> — role: employee / manager / finance</li>
      <li><strong>ExpenseReport</strong> — status: draft → submitted → under_review → approved → rejected → paid</li>
      <li><strong>ExpenseItem</strong> — category, amount, receipt URL, policy violation flag</li>
      <li><strong>TravelRequest</strong> — destination, dates, budget, status, reviewer</li>
    </ul>
  </div>
  <div class="col-box">
    <h4>Supporting entities</h4>
    <ul>
      <li><strong>PolicyRule</strong> — per-category spending limits and receipt thresholds</li>
      <li><strong>Notification</strong> — typed, user-targeted alerts with read state</li>
    </ul>
    <br>
    <p style="font-size:12px; color: var(--ink-3);">Note: Pre-design ERD anticipated a separate <em>Approval</em> entity. Implementation embedded approval state as fields on ExpenseReport and TravelRequest — simpler and sufficient for the access patterns needed.</p>
  </div>
</div>

---

<!-- _class: divider -->

<div class="step-num">07</div>

## Visual Design Phase

Modern design system applied to the implemented platform — frosted glass cards, indigo brand, animated data visualization.

---

<!-- _class: has-footer -->

## Design System — Tokens & Aesthetic

<div class="accent-bar"></div>

<div class="cols">
  <div class="col-box">
    <h4>Design Tokens (Mesh-inspired)</h4>
    <ul>
      <li><strong>Brand:</strong> Periwinkle <code>#5C66F5</code> (<code>--brand-600: 92 102 245</code>) — updated from indigo after Mesh competitive analysis</li>
      <li><strong>Light surface-0:</strong> lavender-grey canvas <code>#F5F6FA</code></li>
      <li><strong>Light surface-1:</strong> white cards <code>#FFFFFF</code></li>
      <li><strong>Dark surface-0:</strong> deep navy <code>#12121A</code></li>
      <li><strong>Sidebar:</strong> always-dark <code>#1A1A28</code> — fixed in both themes</li>
    </ul>
  </div>
  <div class="col-box">
    <h4>Mesh-Inspired Aesthetic</h4>
    <ul>
      <li><strong>.card:</strong> <code>bg-white/80 backdrop-blur-xl border border-black/7 rounded-[14px] shadow</code></li>
      <li><strong>Sidebar:</strong> dedicated CSS var tokens — dark panel independent of page theme</li>
      <li><strong>Buttons:</strong> pill-shaped <code>rounded-full</code> matching Mesh CTAs</li>
      <li><strong>Font:</strong> Inter — SF Pro-inspired weight + tracking</li>
      <li><strong>Sidebar subtitle:</strong> "EXPENSE INTELLIGENCE"</li>
    </ul>
  </div>
</div>

---

<!-- _class: has-footer -->

## Dashboard — Bento KPI Grid

<div class="accent-bar"></div>

<div class="cols">
  <div class="col-box">
    <h4>Layout & Charts</h4>
    <ul>
      <li>Bento asymmetric layout — Total Spend spans 2 cols</li>
      <li>KPI cards with accent strip + mini sparkline + delta % badge</li>
      <li>Period toggle 7d / 30d / 90d filters trend chart</li>
      <li>Gradient area chart with animated entry</li>
      <li>Illustrated empty states with CTA</li>
      <li>Hover arrow animations on expense/travel rows</li>
    </ul>
  </div>
  <div class="col-box">
    <h4>New Components Built</h4>
    <ul>
      <li><strong>Sparkline</strong> — mini AreaChart, no axes, gradient fill</li>
      <li><strong>Delta</strong> — green/red trend badge with icon</li>
      <li><strong>KpiCard</strong> — accent strip + sparkline + delta</li>
      <li><strong>ChartTooltip</strong> — custom dark/light tooltip</li>
      <li><strong>PeriodToggle</strong> — 7d/30d/90d pill buttons</li>
      <li><strong>EmptyState</strong> — icon + message + CTA</li>
    </ul>
  </div>
</div>

---

<!-- _class: has-footer -->

## Sidebar & Shell Upgrades

<div class="accent-bar"></div>

<div class="cols">
  <div class="col-box">
    <h4>Sidebar (Mesh-style)</h4>
    <ul>
      <li><strong>Always-dark panel</strong> — fixed <code>#1A1A28</code> independent of page theme</li>
      <li>Periwinkle active indicator + icon tint on selected item</li>
      <li>Collapsible to 60px icon-only mode (localStorage persisted)</li>
      <li>Live pending count badges — dot on icon when collapsed, pill when expanded</li>
      <li>"EXPENSE INTELLIGENCE" branding (small-caps, letter-spaced)</li>
    </ul>
  </div>
  <div class="col-box">
    <h4>Application Shell</h4>
    <ul>
      <li><strong>AI Chat Widget</strong> — Claude API, Sparkles button in header</li>
      <li><strong>Notifications panel</strong> — real-time unread badge, mark-read, typed alerts</li>
      <li><strong>Dark mode toggle</strong> — Sun/Moon, localStorage persisted, full CSS var swap</li>
      <li><strong>Role switcher</strong> — header dropdown for demo account switching</li>
      <li><strong>Global search</strong> — cross-record query bar</li>
    </ul>
  </div>
</div>

---

<!-- _class: has-footer -->

## Analytics — Upgraded Data Visualization

<div class="accent-bar"></div>

| Chart | Before | After |
|---|---|---|
| Monthly Trend | LineChart (no fill) | AreaChart + gradient fill + animated entry |
| Category Split | PieChart (flat) | Donut chart + legend list |
| Department | Horizontal bar | Gradient horizontal bar (indigo to lighter indigo) |
| All charts | Basic tooltip | Custom dark/light styled tooltip |
| Trend chart | Fixed time window | Period toggle (7d / 30d / 90d) |

<br>

**Additional details:** rounded bar tops on all bar charts (`radius={[4,4,0,0]}`); donut `innerRadius` added to PieChart; linearGradient left-to-right on department bars; KPI cards upgraded with colored icons + delta badges.

---

<!-- _class: has-footer -->

## Modern UX — Research-Driven Upgrades

<div class="accent-bar"></div>

Before implementing, competitive research was conducted across Ramp, Brex, Navan, Expensify, Airbase, and Spendesk — identifying 10 modern patterns to implement.

| Inspiration | Pattern Implemented |
|---|---|
| Ramp / Brex | Bento asymmetric KPI grid |
| Navan | Live pending badge counts on sidebar |
| Brex | Sparklines + delta % on KPI cards |
| Ramp / Airbase | Period toggle on analytics |
| Spendesk | Gradient fills under area charts |
| Expensify | Illustrated empty states with CTA |
| Mesh Payments | Always-dark sidebar · periwinkle brand · pill buttons · SVG empty-state illustrations |
| Ramp | Sortable column headers |
| Figma designs | 2-column form layout + Tips card |

---

<!-- _class: has-footer -->

## Deliverables Produced

<div class="accent-bar"></div>

| Deliverable | Purpose |
|---|---|
| Problem statement | Scope boundary, success criteria — north-star reference |
| Market research report | Competitive context; ingested into NotebookLM |
| Five personas + user stories | Foundation for all downstream design decisions |
| Journey maps (3 flows) | Cross-role handoff visibility; surfaced status-tracking requirement |
| Kano + MoSCoW matrix | MVP scope — defensible to design and engineering audiences |
| Sitemap + user action tree | Navigation structure per role; source of truth for RBAC |
| ERD | Backend data model; produced pre-design not post |
| Wireframe prompts (3 portals) | Primary handoff artifact for visual design phase |
| **Travelex — full-stack implementation** | React + FastAPI + SQLite; 3 role-based portals |
| Consolidated export + NotebookLM corpus | Queryable design knowledge base |
| **Visual design system + component library** | Mesh-inspired periwinkle brand; always-dark sidebar; pill buttons; 8 reusable components |
| **Application shell** | AI Chat (Claude API), notifications, dark mode, role switcher, global search |
| **50 UI screenshots (1440×900)** | Full coverage: 3 roles × all pages, light + dark mode |

---

<!-- _class: has-footer -->

## AI-Assisted Workflow — The Iteration Loop

<div class="accent-bar"></div>

<div class="cols">
  <div class="col-box">
    <h4>Where AI excelled</h4>
    <ul>
      <li><strong>Structural scaffolding</strong> — first-draft frameworks and templates at full depth</li>
      <li><strong>User story generation</strong> — grammatically and structurally correct at scale</li>
      <li><strong>Diagram syntax</strong> — valid Mermaid / ERD notation reliably</li>
      <li><strong>Edge case surfacing</strong> — volunteered scenarios not explicitly considered</li>
      <li><strong>Consistency enforcement</strong> — flagged decisions that contradicted prior outputs</li>
    </ul>
  </div>
  <div class="col-box">
    <h4>Where human judgment was essential</h4>
    <ul>
      <li><strong>Deciding which users matter</strong> — Admin vs. Finance sub-role required domain judgment</li>
      <li><strong>Grounding personas</strong> — AI defaults are optimistic; real frustrations needed pushing</li>
      <li><strong>MVP scoping</strong> — tradeoffs no framework can make automatically</li>
      <li><strong>Navigability validation</strong> — logical grouping ≠ navigability; required UX judgment to flatten</li>
    </ul>
  </div>
</div>

> The standard loop: seed context → AI generates draft → designer critiques → iterate → lock deliverable. Almost nothing was accepted on first pass.

---

<!-- _class: has-footer -->

## Outcomes & Lessons Learned

<div class="accent-bar"></div>

<div class="cols">
  <div class="col-box">
    <h4>What worked well</h4>
    <ul>
      <li><strong>Sequential phase discipline</strong> — each phase as a gate produced more defensible later-phase outputs</li>
      <li><strong>Cross-role journey mapping</strong> — the single most productive methodological decision</li>
      <li><strong>RBAC as IA principle</strong> — applied before design began, not retrofitted</li>
      <li><strong>Iterative critique</strong> — resisting first-pass acceptance separated grounded from generic</li>
    </ul>
  </div>
  <div class="col-box">
    <h4>What to change next time</h4>
    <ul>
      <li><strong>Structured competitive benchmark</strong> — feature comparison table vs. incumbents</li>
      <li><strong>Earlier ERD</strong> — data model as input to feature prioritization, not output of IA</li>
      <li><strong>User testing proxies</strong> — at least one validation round with real users in target roles</li>
    </ul>
  </div>
</div>

**Skills reinforced:** Scope definition before requirements · Complementary framework pairing (Kano + MoSCoW) · Cross-role handoff thinking · Pre-design data modelling

---

<!-- _class: title -->
<!-- _paginate: false -->

<div class="badge">Travelex — Expense Intelligence Platform</div>

# Thank you

<p style="font-size: 20px; color: rgba(255,255,255,0.8); margin-top: 12px;">UX/UI Capstone · Pre-Design Phase Documentation</p>

<br>

<p style="font-size: 15px; color: rgba(255,255,255,0.55);">
  3 role-based portals &nbsp;·&nbsp; 7 phases &nbsp;·&nbsp; 15 deliverables &nbsp;·&nbsp; 50 screenshots<br>
  Built with Claude · React · FastAPI · Travelex
</p>
