# T&E Platform — Pre-Design Phase Process Documentation

*UX/UI Course Capstone Project | Process Diary & Methodology Record*

---

## 1. Executive Summary

### The Platform

Most mid-size and enterprise companies run their travel and expense management on a patchwork of email threads, paper receipts, spreadsheets, and legacy ERP plugins. The result is predictable: reimbursements that take weeks, policy violations that go undetected, finance teams closing the books manually at month-end, and employees who simply stop submitting receipts because the process is too painful. This project addresses that gap by specifying a **Travel & Expense (T&E) Management Platform** — a purpose-built, role-aware SaaS product that covers the full lifecycle of business spending: pre-trip travel approval, in-trip expense capture, multi-tier manager review, finance-side GL coding and policy enforcement, and executive-level spend analytics.

### The Methodology

This is a **pre-design phase project**, meaning it stops at the boundary between discovery and visual design. No high-fidelity mockups were produced; what was produced instead is the full analytical scaffolding that would allow a visual designer or development team to begin work immediately — personas, journeys, feature matrices, sitemaps, user action trees, an entity-relationship diagram, and a set of structured wireframe prompts for each user portal. The entire pre-design phase was executed through a structured, iterative, AI-assisted workflow with Claude, following six sequential UX phases. Each phase built directly on the outputs of the previous one, creating an auditable chain from raw problem statement to handoff-ready artifacts. The resulting platform — branded **Travelex** — was implemented as a full-stack web application with three role-based portals (Employee, Manager, Finance), consolidating Admin configuration and Executive analytics into the Finance and Manager roles respectively. A subsequent visual design phase applied a comprehensive design system and modern UX patterns informed by competitive research.

### Project at a Glance

| Attribute | Detail |
|---|---|
| **Project Type** | UX/UI Capstone — Pre-Design Phase |
| **Phases Completed** | 7 (Problem Definition → IA → Visual Design) |
| **User Types Designed For** | Employee, Manager, Finance (with admin and executive functions consolidated) |
| **Portals Implemented** | 3 role-based portals (Employee, Manager, Finance) |
| **Key Frameworks** | Kano Model, MoSCoW, Jobs-To-Be-Done, RBAC, ERD, Journey Mapping |
| **Final Deliverables** | 15 deliverables (see Section 4) |
| **Visual Design Phase** | Full design system + component library + 50 screenshots |
| **Handoff Format** | Consolidated Word document → NotebookLM ingestion |

---

## 2. Project Context & Goals

### Course Context

This project was produced as the capstone for a UX/UI design course. The brief required demonstrating mastery of the pre-design toolkit — research, synthesis, prioritization, and architecture — rather than visual execution. The platform domain (Travel & Expense management) was selected because it is operationally complex, involves multiple distinct user types with genuinely different mental models, and exists in a mature enough market that competitive patterns could be analyzed and learned from.

### The Business Problem

Travel and expense management is one of the most universally disliked internal processes in corporate life. The core tension is structural: the people who incur expenses (employees) are not the people who approve them (managers), who are not the people who reconcile them (finance), who are not the people who need aggregate visibility (executives). Each group has different information needs, different failure modes, and a different definition of "done."

The specific pain points that shaped this project's scope:

- **Employees** lose receipts, forget to submit on time, have no visibility into where their reimbursement is in the approval chain, and receive no feedback when a report is rejected.
- **Managers** are bottlenecks: they receive approval requests through email, have no context for whether a claim is within policy, and cannot delegate approval when they are traveling themselves.
- **Finance teams** spend significant effort on manual GL coding, chasing missing receipts, identifying policy violations after the fact, and reconciling against corporate card statements.
- **Executives and CFOs** lack real-time spend visibility; they see actuals weeks after the fact, making proactive budget management impossible.
- **Admins** manage policy rules, employee records, and approval workflows in systems that are either locked to IT or buried in ERP configuration screens.

### Scope Decision: Pre-Design Only

A deliberate early decision was to scope the project to the **pre-design phase exclusively**. The rationale: visual design built on an under-specified foundation produces screens that look polished but fail to account for edge cases, role-based access requirements, or the data relationships underlying each interface. By investing fully in the analytical phase, the eventual visual design phase inherits a stable, well-reasoned foundation. The wireframe prompts produced at the end of this phase are the explicit handoff bridge.

### Why an AI-Assisted Workflow

An AI-assisted methodology was chosen for three reasons: speed, iteration density, and breadth. A traditional solo UX process at this phase would compress or skip steps due to time constraints — most often, research synthesis and journey mapping are the casualties. Working with Claude allowed every phase to be executed at full depth, with multiple revision cycles per deliverable, in a fraction of the time a solo process would require. Critically, the AI contribution was generative and structural, not evaluative — the human judgment layer (deciding what matters, what is realistic, what is in scope) remained with the designer throughout.

---

## 3. Methodology: The Six-Step Pre-Design Framework

The project followed a canonical six-step pre-design methodology, executed sequentially. Each step was treated as a gate: its outputs had to be sufficient to proceed before the next step began. Iteration happened within each step (draft → critique → refine) rather than across steps, which kept the process linear and auditable.

---

### 3.1 Problem Definition

> **Objective:** Produce a clear, bounded problem statement that defines the platform's purpose, the users it serves, the problems it solves, and the criteria by which success would be measured.

> **Process:** The problem definition phase started with a free-form articulation of the T&E domain problem — essentially, a brain dump of the pain points I was aware of from observing and experiencing corporate expense processes. Claude's role in this phase was to impose structure: it pushed back on vague statements, surfaced unstated assumptions (for example, the assumption that all users would be internal employees — in some organizations, contractors also submit expenses), and helped frame the problem at the right level of abstraction. The key iteration loop here was tightening scope: an early draft of the problem statement tried to include procurement, vendor payments, and travel booking natively; successive iterations narrowed the scope to the reimbursement and approval lifecycle, with travel booking treated as an adjacent concern.

> **Output:** A structured problem statement document covering: the platform definition, primary user categories, core problems per category, out-of-scope decisions, and three measurable success criteria (reimbursement cycle time reduction, policy compliance rate, finance close time reduction).

> **Key Decisions:** The decision to exclude an in-app travel booking engine from MVP scope was the most significant outcome of this phase. A booking engine would have doubled the technical surface area and pulled the IA toward a travel marketplace model rather than a compliance and reimbursement tool. The scope boundary was set at: *request pre-approval for travel, capture expenses during and after travel, process reimbursement, enforce policy, report on spend.*

---

### 3.2 Research

> **Objective:** Produce a market research report situating the platform in the competitive T&E SaaS landscape, and synthesize user research to ground subsequent persona work in observed behavior rather than assumption.

> **Process:** This phase involved two parallel workstreams. The first was a structured analysis of the T&E SaaS market: identifying the dominant incumbent patterns (approval workflows, OCR receipt capture, corporate card integration, policy rule engines), the common shortcomings of existing products (poor mobile experience for employees, over-complex admin configuration, weak analytics for executives), and the table-stakes features that any credible entry in the category must include. The second workstream was user research synthesis — pulling from publicly available sources (G2 reviews, Capterra feedback, Reddit threads in finance and operations subreddits, job descriptions for T&E roles) to build a picture of what actual users say about their experience with existing tools.

> **Output:** A market research report structured as: category overview, key competitor patterns and feature benchmarks, user sentiment analysis by role, and a "design opportunity" summary identifying underserved needs (primarily: the employee-side experience, real-time executive visibility, and intelligent policy flagging at submission time rather than after-the-fact).

> **Key Decisions:** The decision to treat the employee-side experience as the primary design differentiator came out of research. Most T&E tools are optimized for the finance and admin workflows — the submission and capture experience for employees is typically an afterthought. Positioning the platform around a fast, low-friction submission flow (with policy guidance at the point of entry, not the point of rejection) became a core design principle carried forward through all subsequent phases.

---

### 3.3 Personas & User Stories

> **Objective:** Define the distinct user types — Employee, Manager, Finance Team, Admin, Executive/CFO — with enough specificity to drive meaningful design decisions, and ground each persona in concrete user stories and Jobs-To-Be-Done framing. In the implemented system, Admin and Executive functions were consolidated into the Finance and Manager roles respectively rather than implemented as separate portals.

> **Process:** Each persona was developed through a structured conversation loop: I provided a role and a set of seed characteristics; Claude drafted a full persona profile; I critiqued it against what I knew about real people in those roles; we iterated until the persona felt grounded rather than generic. The most productive critique passes were the ones that pushed back on overly smooth personas — real employees don't want to submit expenses, real managers are busy and distracted, real finance managers distrust self-reported data. Those friction points needed to be present in the personas for them to be useful design inputs. Jobs-To-Be-Done framing was layered on top after the traditional persona structure was complete, adding a "hire" dimension: what is this person *hiring* this platform to do for them?

> **Output:** Five detailed persona profiles. Below is a condensed representation:

---

**Persona 1: Employee**
*[Example name: "Alex, Field Sales Representative"]*

| Attribute | Detail |
|---|---|
| Primary goal | Submit expense reports quickly, get reimbursed without friction |
| Key frustration | Policy rules are unclear at submission time; rejection happens days later with minimal explanation |
| JTBD | *Hire the platform to make submitting expenses so fast it becomes a non-event* |

**Representative User Stories:**

```
As an employee, I want to photograph a receipt and have the amount and category
pre-filled automatically, so that I can submit an expense in under 60 seconds.

As an employee, I want to see in real time where my report is in the approval
chain, so that I can follow up with the right person if it is delayed.

As an employee, I want to receive a clear explanation when a report is flagged or
rejected, so that I can correct and resubmit without going back and forth by email.
```

---

**Persona 2: Manager**
*[Example name: "Dana, Regional Sales Manager"]*

| Attribute | Detail |
|---|---|
| Primary goal | Approve or reject expense reports accurately and quickly without becoming a bottleneck |
| Key frustration | Approval requests arrive through email with no context; no quick way to see whether a claim is in policy |
| JTBD | *Hire the platform to handle the administrative overhead of expense oversight so I can focus on my team's performance* |

**Representative User Stories:**

```
As a manager, I want to see a summary of policy violations before I approve a
report, so that I can make an informed decision without reading every line item.

As a manager, I want to delegate approval authority to a designated colleague
when I am out of office, so that reimbursement cycles are not blocked by my absence.

As a manager, I want to receive a daily digest of pending approvals, not a separate
email per request, so that my inbox is not overwhelmed.
```

---

**Persona 3: Finance Team Member**
*[Example name: "Morgan, Accounts Payable Specialist"]*

| Attribute | Detail |
|---|---|
| Primary goal | Close the books accurately and on time; enforce policy; produce audit-ready records |
| Key frustration | Receives approved reports that still require manual GL coding; policy violations are caught too late in the process |
| JTBD | *Hire the platform to eliminate manual reconciliation steps and give me confidence that what I'm processing is compliant* |

**Representative User Stories:**

```
As a finance team member, I want approved expense reports to arrive with
AI-suggested GL codes pre-populated, so that I can review and confirm rather
than assign from scratch.

As a finance team member, I want a dedicated coding queue that shows me every
approved transaction awaiting GL assignment, so that I can process them in
batches without losing track.

As a finance team member, I want to run a spend-by-category report filtered by
department, date range, and status, so that I can produce the month-end accrual
without manual aggregation.
```

---

**Persona 4: Administrator**
*[Example name: "Jordan, IT/Operations Manager"]*

| Attribute | Detail |
|---|---|
| Primary goal | Configure and maintain the platform — policies, users, approval workflows — without needing engineering support |
| Key frustration | Policy rule changes in legacy tools require IT tickets; user provisioning is manual and error-prone |
| JTBD | *Hire the platform to run the T&E system with minimal ongoing maintenance overhead* |

**Representative User Stories:**

```
As an admin, I want to define per-category spending limits that automatically
flag violations at submission time, so that policy enforcement is proactive
rather than reactive.

As an admin, I want to bulk-import user records via CSV and assign roles and
approval chains at import time, so that onboarding a new cohort of employees
does not require manual record creation.

As an admin, I want to configure multi-tier approval workflows (e.g., manager
then finance above a threshold), so that high-value claims receive additional
scrutiny without my manual intervention.
```

---

**Persona 5: Executive / CFO**
*[Example name: "Sam, Chief Financial Officer"]*

| Attribute | Detail |
|---|---|
| Primary goal | Maintain real-time visibility into organizational spend; identify budget risks early |
| Key frustration | Spend data arrives at month-end; no mechanism for proactive alerts on budget overruns or policy trend deterioration |
| JTBD | *Hire the platform to give me the same level of visibility into T&E spend that I have into revenue* |

**Representative User Stories:**

```
As an executive, I want a real-time dashboard showing total spend, pending
approvals, and policy violation rate by department, so that I can identify
outliers without requesting a custom report from finance.

As an executive, I want to drill from a top-line KPI down to the individual
transactions that compose it, so that anomalies can be investigated immediately.

As an executive, I want to receive an automated weekly digest summarizing
spend trends against budget, so that I am informed without checking the
platform manually.
```

---

> **Key Decisions:** The pre-design phase defined Admin and Executive/CFO as distinct user types. In the implemented system, these were consolidated: Admin configuration (policy rules, user management) was merged into the Finance role, and Executive analytics (spend drilldown, departmental view) were made accessible within the Manager portal under the Team section. This consolidation was a scope decision — the platform serves companies where the Finance Manager and system administrator are typically the same person, and where senior managers already have the context to consume executive-level analytics.

---

### 3.4 Journey Mapping

> **Objective:** Trace the end-to-end experience of each core user flow, identify the cross-role handoff points where one user's output becomes another user's input, and surface the friction moments that most need design attention.

> **Process:** Journey maps were built for three primary flows: (1) Employee submitting an expense report through to reimbursement, (2) Manager receiving and acting on an approval request, and (3) Finance team processing an approved report through GL coding to payment. Each map was structured around the standard journey framework: stages, user actions, touchpoints, emotional state, pain points, and opportunities. The most valuable iteration in this phase was forcing the maps to be *cross-role* — rather than mapping each role in isolation, the handoffs between them were made explicit. This revealed several design requirements that would not have been obvious from persona work alone: for example, the moment when a manager approves a report and it enters the finance queue is completely invisible to the employee, which explains the "where is my reimbursement?" frustration pattern that appears in employee reviews of every T&E tool.

> **Output:** Three journey maps (Employee submission flow, Manager review flow, Finance processing flow) plus a cross-role handoff diagram showing the five transition points at which a work item moves between user types, with the information passed at each handoff and the failure mode if that information is missing or delayed.

> **Key Decisions:** The journey mapping phase surfaced the need for a **status visibility layer** accessible to employees — not just a badge on the report, but a timestamped audit trail showing every state change and who caused it. This became a core feature requirement that was carried directly into the feature prioritization phase.

---

### 3.5 Feature Prioritization

> **Objective:** Produce a scoped feature set for MVP and future releases, using two complementary frameworks to ensure both user value and implementation pragmatics were accounted for.

> **Process:** Feature prioritization used a dual-framework approach. The **Kano Model** was applied first to classify each candidate feature by the type of value it delivers to users. The **MoSCoW Matrix** was applied second to translate that value classification into a release decision. Using Kano alone risks building a feature-rich product that misses basic expectations; using MoSCoW alone risks scoping decisions that are arbitrary rather than user-grounded. Together, they produce a prioritization that can be defended to both a design audience (Kano) and an engineering/product audience (MoSCoW).

The iteration loop in this phase involved several passes: generating a candidate feature list from the combined outputs of personas and journey maps, classifying each feature through Kano discussion (asking "what if this feature is absent? what if it is present and working well?"), then applying MoSCoW scoping rules.

> **Output:** A prioritization matrix (extract below):

| Feature | Kano Category | MoSCoW | Release |
|---|---|---|---|
| Receipt capture (photo-to-form OCR) | Basic | Must Have | MVP |
| Multi-tier approval workflow | Basic | Must Have | MVP |
| Policy rule engine (per-category limits) | Basic | Must Have | MVP |
| Reimbursement status tracking for employees | Performance | Must Have | MVP |
| Mobile-first submission flow | Performance | Must Have | MVP |
| Real-time spend dashboard (Executive) | Performance | Should Have | MVP |
| AI-suggested GL code assignment | Excitement | Should Have | MVP |
| Delegation of approval authority | Performance | Should Have | MVP |
| Bulk CSV export for finance reconciliation | Basic | Must Have | MVP |
| Anomaly / duplicate receipt detection | Excitement | Could Have | Release 2 |
| ERP / accounting system integration | Basic | Won't Have | Release 2 |
| In-app travel booking engine | Indifferent (in MVP scope) | Won't Have | Release 3 |
| Corporate card auto-reconciliation | Basic | Won't Have | Release 2 |

> **Key Decisions:** Classifying mobile-first submission as a Performance feature rather than an Excitement feature was a deliberate pushback against the AI's initial classification. In the T&E category specifically, submitting a receipt on a mobile device at the point of purchase is not a delight feature — it is the only workflow that prevents receipts from being lost. Demoting it to Performance and then to Must Have reflected the research finding that expense data quality degrades significantly the longer the gap between incurring an expense and capturing it.

---

### 3.6 Information Architecture

> **Objective:** Translate the feature set and user types into a structured sitemap and user action tree — the skeleton that visual design would eventually be built upon.

> **Process:** IA development started from a principle established early in the phase: **distinct user types warrant distinct navigation structures**, not one portal with role-based content switching. This is a meaningful structural choice. A single portal with hidden content creates navigation confusion and RBAC complexity; purposefully-designed role-based portals allow each user type to have a navigation structure optimized for their actual task frequency and mental model. Role-Based Access Control (RBAC) principles were used not as a security constraint but as an IA-shaping principle: by mapping what each role can create, read, update, and delete, the feature set for each portal falls out naturally. The sitemap was built first (high-level navigation nodes), followed by the user action tree (granular task decomposition within each portal), followed by the wireframe prompts (structured descriptions of each key screen). In the implemented system (**Travelex**), three portals were built — Employee, Manager, Finance — with Admin and Executive views consolidated as described in section 3.3.

> **Output:**
> - A sitemap defining the five portals and the primary navigation nodes within each
> - A user action tree defining the actions available per node per role
> - Three structured wireframe prompts (one per portal), each specifying: primary navigation, screen inventory, key UI components per screen, and data displayed

The portals and their navigation nodes as implemented in **Travelex**:

| Portal | Navigation Nodes (Implemented) |
|---|---|
| **Employee** | Dashboard, Expenses, Travel, Settings |
| **Manager** | Dashboard, Approvals, Expenses, Travel, Team *(includes Executive analytics sub-pages)*, Analytics, Settings |
| **Finance** | Dashboard, Policies *(includes policy rule management)*, Expenses, Travel, Coding Queue, Analytics, Export, Settings |

> **Key Decisions:** The decision to give the Finance Portal a dedicated **GL Coding Queue** — a sequential, transaction-by-transaction coding interface — rather than embedding GL coding into the general expense list view, came directly from the Finance persona and journey map work. Finance team members do not want to context-switch between reviewing a report and assigning codes; they want a processing queue they can work through systematically. This is a product-level UX decision that IA work surfaced before any screen design began.

---

## 4. Deliverables Produced

The following artifacts were produced during the pre-design phase and subsequent visual design phase. All were generated through iterative AI-assisted workflows and reviewed/refined against the accumulated project context.

| Deliverable | Format | Purpose |
|---|---|---|
| **Problem statement document** | Markdown / Word | Frames the project, defines scope boundaries, establishes success criteria. Serves as the north-star reference throughout all subsequent phases. |
| **Market research report** | Word document | Establishes competitive context, documents existing product patterns, identifies underserved user needs. Was later ingested into NotebookLM as a reference corpus. |
| **Five personas with user stories** | Structured document | Foundation for all downstream design decisions. Each persona includes demographics, goals, frustrations, JTBD statement, and 2–3 user stories per role. |
| **Journey maps (three flows)** | Diagrams | Makes cross-role handoffs explicit and visible. Each map identifies friction points that directly informed feature requirements. |
| **Cross-role handoff diagram** | Diagram | Isolates the five transition points between roles, specifying what information passes at each handoff and what fails when that information is absent. |
| **Kano + MoSCoW prioritization matrix** | Table | Provides a defensible, user-grounded feature scope for MVP and future releases. Bridges the persona/journey work to engineering-consumable requirements. |
| **Sitemap** | Diagram | Defines the five portals and their primary navigation nodes. High-level structural blueprint for visual design. |
| **User action tree** | Diagram | Granular decomposition of tasks within each portal. Specifies what each role can do at each navigation node — the source of truth for RBAC implementation. |
| **ERD (Entity Relationship Diagram)** | Diagram | Data model showing entities (User, ExpenseReport, ExpenseItem, TravelRequest, Policy, Notification, Approval) and their relationships. Produced as a backend handoff artifact. |
| **User flow diagrams** | Diagrams | Step-by-step interaction flows for the core tasks in each portal (e.g., submit expense, approve report, assign GL code). Bridges the journey maps to screen-level design. |
| **Wireframe prompts — 3 portals** | Structured text prompts | The primary handoff artifact for the visual design phase. Each prompt specifies: portal purpose, navigation structure, screen list, key components per screen, and data fields displayed. Does not prescribe visual treatment. |
| **Consolidated Word export** | .docx | Aggregation of all above artifacts into a single document for ingestion into NotebookLM, enabling the design corpus to be queried as a knowledge base. |
| **Visual design system + component library** | React/TypeScript + CSS custom properties | 7 reusable components; frosted glass aesthetic; full dark/light token set |
| **50 UI screenshots (1440×900)** | PNG | Full coverage: 3 roles × all pages, light + dark mode, sidebar collapsed state |

---

## 5. Frameworks & Tools Applied

### Kano Model
A customer satisfaction framework that classifies features into four categories based on their relationship to user satisfaction: **Basic** (expected; their absence causes dissatisfaction), **Performance** (linear satisfaction-to-investment relationship), **Excitement** (unexpected; high delight value but not missed when absent), and **Indifferent** (neither presence nor absence affects satisfaction). In this project, Kano was applied to prevent the MVP from both under-delivering on basics and over-investing in excitement features at the expense of foundational ones.

### MoSCoW Prioritization
A product management framework that categorizes features as **Must Have** (non-negotiable for launch), **Should Have** (high value, absent only if unavoidable), **Could Have** (nice-to-have if capacity allows), and **Won't Have** (explicitly out of scope for this release). MoSCoW was layered on top of the Kano analysis to translate user value classifications into release decisions that account for implementation cost and timeline constraints.

### Jobs-To-Be-Done (JTBD)
A framing lens that asks not "who is this user?" but "what is this user hiring this product to do?" JTBD was used in this project as a complement to traditional personas — after building out each persona in the standard format, a JTBD statement was added to capture the functional and emotional job each user type is trying to get done. This proved particularly useful for the Executive persona, where the traditional persona format (demographics, goals, frustrations) was less actionable than the JTBD framing: *"hire the platform to give me the same visibility into T&E spend that I have into revenue."*

### Role-Based Access Control (RBAC) as an IA Principle
RBAC is typically treated as a security and engineering concern — which users can access which resources. In this project, RBAC principles were applied as an **information architecture principle**: the user action tree was built by systematically mapping create/read/update/delete permissions per role per entity, and the resulting permission map directly determined what appeared in each portal's navigation and screen inventory. This approach ensures that IA decisions are grounded in functional requirements rather than visual convention.

### Entity Relationship Diagramming (ERD)
A data modeling technique that identifies the core entities in a system, their attributes, and the relationships between them. The ERD in this project was produced as a **backend handoff artifact** — it specifies the data model that would need to be implemented to support all portal features. Key entities as implemented in Travelex: **User** (with role: employee / manager / finance), **ExpenseReport** (with status: draft / submitted / under_review / approved / rejected / paid; includes `reviewed_by`, `review_note`, `paid_at` fields — approval state is embedded directly on the report rather than in a separate Approval entity), **ExpenseItem** (line items with category, amount, receipt URL, policy violation flag), **TravelRequest** (destination, dates, budget, status, reviewer), **PolicyRule** (per-category spending limits and receipt thresholds), and **Notification** (user-targeted, typed alerts with read state and a reference to the triggering expense or travel record). Note: the pre-design ERD anticipated a separate `Approval` entity and a `Policy` parent entity; the implementation embedded approval state as fields on `ExpenseReport` and `TravelRequest`, and flattened policy into a single `PolicyRule` table. The ERD was intentionally produced during the pre-design phase rather than delegated to engineering, because data model decisions have direct consequences for the UI's filtering and display capabilities.

### User Journey Mapping
A UX technique that traces a user's experience through a process over time, capturing actions, touchpoints, emotional state, and pain points at each stage. Journey mapping was used in this project not just for individual roles but across roles — making the handoff moments between Employee, Manager, and Finance the primary focus of the mapping exercise. This cross-role view surfaced design requirements (particularly the employee status-visibility requirement) that would not have been visible from single-role persona analysis.

---

## 6. The AI-Assisted Workflow — Process Reflections

This section is the most important in the document. An AI-assisted pre-design methodology is not simply a faster way of doing traditional UX work — it is a qualitatively different process, with different strengths, failure modes, and human judgment requirements. What follows is an honest account of what that process looked like in practice.

### The Iteration Loop

Almost nothing was accepted on first pass. The standard workflow for each deliverable was:

1. **Seed the context:** provide Claude with the accumulated project context (problem statement, research findings, personas) plus the specific prompt for the current phase.
2. **Generate a first draft:** Claude produces a structured first version — a persona profile, a feature matrix, a journey map in Mermaid syntax.
3. **Critique the draft:** I reviewed the output against two criteria: (a) does it accurately reflect what I know about this domain and these users, and (b) does it contain anything that feels generic, AI-optimistic, or insufficiently grounded?
4. **Iterate:** targeted revision requests — "make the Finance persona more skeptical of automation," "reclassify mobile-first from Excitement to Must Have and explain why," "add a fifth stage to the Manager journey covering the case where the employee disputes the rejection."
5. **Lock the deliverable:** once a revision passed the critique, the output was considered canonical and was carried forward as context for the next phase.

Diagrammatic outputs were strongly preferred over plain-text descriptions wherever possible — Mermaid syntax for journey maps and flows, ERD notation for the data model, table format for feature matrices. Visual structure forces precision in a way that prose descriptions do not: you cannot leave a relationship ambiguous in a diagram the way you can in a sentence.

### Where AI Excelled

- **Structural scaffolding.** Given a phase name and a set of inputs, Claude reliably produced a well-structured first draft that hit all the required components. This was most valuable in phases with dense internal structure — the Kano + MoSCoW matrix, the user action tree, the ERD — where the framework itself is complex enough that generating a blank template would have consumed significant time.

- **User story generation.** Given a persona and a frustration pattern, Claude produced grammatically and structurally correct user stories at scale. The stories required critique and refinement, but the first-pass quality was high enough that the editing loop was fast.

- **Diagram syntax.** Producing Mermaid-compatible syntax for journey maps, flow diagrams, and ERD notation is tedious when done manually and prone to syntax errors. Claude produced valid, parseable diagram syntax reliably, which allowed the focus to remain on structural accuracy rather than notation mechanics.

- **Edge case surfacing.** Consistently, Claude would volunteer edge cases I had not explicitly considered — "what happens when an employee submits a report for a project that has already closed?" or "should the delegation of approval authority apply to all reports or only reports under a threshold?" Not all edge cases surfaced were in-scope for MVP, but having them named meant I could make an explicit decision to defer rather than leaving them as latent design gaps.

- **Consistency enforcement.** Because each phase was run with the accumulated context of all prior phases as input, Claude would flag when a new output was inconsistent with a prior decision — for example, if a IA decision implied a feature that had been classified as "Won't Have" in the MoSCoW matrix.

### Where Human Judgment Was Essential

- **Deciding which user types matter.** The decision to treat Admin as a distinct persona rather than a sub-role of Finance could not be delegated. It required judgment about how this type of platform is actually operated in mid-size companies — who owns the system, and whether that person is the same as the one who processes reimbursements.

- **Grounding personas in realistic friction.** Claude's default persona outputs are competent but optimistic — the frustrations listed are real but often under-weight the emotional intensity of actual users. The most valuable critique passes in the persona phase were the ones that pushed the frustrations toward what real people actually say in review forums: "I've had reimbursements take six weeks," not "reimbursement timelines are sometimes longer than expected."

- **MVP scoping.** The MoSCoW classification required making explicit tradeoffs that no framework can make automatically — for example, deciding that corporate card auto-reconciliation was a Release 2 item required a judgment that the MVP's value proposition did not depend on it, and that building it in MVP would require integrations that would delay launch without proportional user benefit for the core use case.

- **Validating that the IA was navigable.** The user action tree Claude produced was structurally correct but initially over-hierarchical — several features were buried three levels deep in navigation structures that made sense logically but would have been opaque to a first-time user. Flattening the navigation for the Employee and Executive portals in particular required a UX judgment that "logical grouping" and "navigability" are different objectives.

### Handoff Strategy

The final step of the pre-design phase was producing a consolidated Word document containing all eleven artifacts in a single, structured file. This document was then ingested into **NotebookLM** as the seed corpus for a design knowledge base. The benefit of this approach is that the entire design rationale — not just the outputs, but the decisions and the reasoning behind them — becomes queryable. A stakeholder who wants to understand why a particular feature was deferred, or what the Finance persona's primary frustration is, can query the NotebookLM notebook rather than reading the full document. This also provides a foundation for the visual design phase: the designer can ask the notebook "what does the GL coding queue need to display?" and receive a grounded, sourced answer from the pre-design corpus rather than starting from memory.

---

## 7. Visual Design & Implementation

Following the pre-design phase, the platform was extended with a comprehensive visual design system and a set of modern UX upgrades informed by competitive research into leading T&E products (Ramp, Brex, Navan, Expensify, Airbase, Spendesk).

### 7.1 Design System

The visual identity is built on a coherent set of design tokens and a consistent aesthetic direction:

**Brand & Color**
- Primary accent: Indigo (#4F46E5, `--brand-600`) — chosen for its professional, modern feel over the more common blue
- Light mode: pure white cards (`--surface-1: 255 255 255`) on a faint blue-tinted page canvas (`--surface-0: 248 248 252`)
- Dark mode: true charcoal page background (`--surface-0: 18 18 18 / #121212`) with near-black cards — high contrast, no grey-grey noise

**Typography**
- Inter font at system-UI scale (SF Pro-inspired weight and tracking values)
- Heading: `font-semibold` + `tracking-tight`, never `font-black` or `uppercase`
- Labels on forms: `text-[10px] font-semibold uppercase tracking-[0.1em]` (e.g. REPORT TITLE *, CURRENCY)

**Cards & Surfaces**
- `.card`: frosted glass — `bg-white/80 backdrop-blur-xl border border-black/7 rounded-[14px] shadow-sm`
- `.glass`: sidebar and header — `bg-white/75 backdrop-blur-xl`
- Dark variants override automatically via `.dark` class on `<html>`

### 7.2 Dashboard Redesign

The dashboard was completely redesigned around a bento-style layout with modern data visualization:

**Bento KPI Grid**
- 4-column grid; "Total Spend" card spans 2 columns as the hero metric
- Each KPI card: 3px colored accent strip (top border), mini sparkline (deterministic seeded AreaChart, no axes), delta % badge (TrendingUp/Down icon, green/red)
- Deterministic PRNG ensures sparklines are stable across re-renders without artificial data

**Charts**
- Monthly Spend: replaced with gradient AreaChart (gradient fill under curve, CSS animated entry)
- Period toggle: 7d / 30d / 90d pill buttons filter the trend data in-place
- Category breakdown: thin animated progress bars + mini per-category colored bar chart
- All charts: custom dark/light-aware tooltip component

**UX Details**
- Illustrated empty states: icon in a rounded box + title + subtitle + CTA button (vs. plain "Nothing here")
- Hover arrow animations: ArrowRight icon slides in from left when hovering expense/travel rows

### 7.3 Sidebar Upgrades

- **Collapsible mode**: sidebar collapses from 220px to 60px icon-only via a toggle button at the bottom; state persisted to `localStorage`
- **Live badge counts**: pending approval counts shown on relevant nav items in real time (dot on icon when collapsed, pill badge when expanded)
- **Branding**: subtitle updated to "EXPENSE INTELLIGENCE" (small-caps, letter-spaced)

### 7.4 Analytics Upgrades

| Chart | Before | After |
|---|---|---|
| Monthly Trend | LineChart (no fill) | AreaChart + gradient fill + animated entry |
| Category Split | Flat PieChart | Donut chart (innerRadius) + legend list |
| Department | Plain horizontal bar | Gradient horizontal bar (indigo to lighter indigo) |
| All charts | Basic browser tooltip | Custom dark/light styled tooltip |
| Trend chart | Fixed time window | Period toggle (7d / 30d / 90d) |

### 7.5 Form Redesign (Figma-Matched)

Both the New Expense Report and New Travel Request forms were redesigned to match a provided Figma spec:

- **Two-column layout**: wide form card on the left, narrow Tips card on the right
- **Tips card**: 3px indigo top border accent, "Tips" heading in brand color, bullet list of contextual guidance
- **Uppercase field labels**: `REPORT TITLE *`, `CURRENCY`, `DEPARTMENT`, `DESCRIPTION` (10px, semibold, wide tracking)
- **New fields**: Department dropdown (auto-filled from user profile) and Description textarea added to the expense form
- **Buttons**: Create button uses indigo gradient (`#6366F1 → #4F46E5`), rounded-lg; Cancel uses border-only style

### 7.6 Table Upgrades

- **Sortable column headers**: click any column header to sort ascending; click again to reverse; active column shows ChevronUp/Down indicator; inactive columns show ChevronsUpDown
- Applied to: Expense Reports table, Travel Requests table
- **Illustrated empty states**: replaces plain "No items found" text with icon + message + CTA throughout

### 7.7 Component Library

Seven reusable components were built during this phase and are used across the Dashboard and Analytics pages:

| Component | Purpose |
|---|---|
| `Sparkline` | Mini AreaChart (no axes, gradient fill, animated, deterministic data) |
| `Delta` | Green/red trend badge with TrendingUp/Down icon and percentage |
| `KpiCard` | KPI tile with accent strip, sparkline, delta, and wide variant |
| `ChartTooltip` | Custom dark/light-aware tooltip for all Recharts components |
| `PeriodToggle` | 7d/30d/90d pill button group for chart time range control |
| `EmptyState` | Illustrated empty state: icon + message + subtitle + CTA Link |
| `SortIcon` | ChevronUp/Down/ChevronsUpDown sort indicator for table headers |

### 7.8 Screenshot Documentation

50 screenshots captured at 1440×900 using Puppeteer-core with system Chrome:

| Role | Pages Covered |
|---|---|
| Login | Login page (shared) |
| Manager (15 shots) | Dashboard (light + dark), Expenses list, New Expense form, Expense detail, Travel list, New Travel form, Travel detail, Settings, Approvals (expenses + travel tabs), Approvals detail, Analytics, Team, Sidebar collapsed |
| Employee (11 shots) | Dashboard (light + dark), Expenses list, New Expense form, Expense detail, Travel list, New Travel form, Travel detail, Settings, Sidebar collapsed |
| Finance (17 shots) | All Manager pages + Policies, Coding Queue, Export, Approvals travel detail |

Saved to: `/Users/nadavor/UX/UI/docs/screenshots/{role}/`

---

## 8. Outcomes & Lessons Learned

### What Worked Well

**Sequential phase discipline.** The decision to treat each phase as a gate — completing it fully before moving forward — paid off in the later phases. The IA and wireframe prompts were significantly more specific and defensible than they would have been if the phases had been compressed or run in parallel, because each one was built on a stable foundation of prior outputs rather than assumptions.

**Cross-role journey mapping.** Mapping the handoffs between roles rather than mapping each role in isolation was the single most productive methodological decision in the project. It surfaced requirements (status visibility, rejection communication, GL coding queue design) that would not have appeared in any single-role persona analysis.

**RBAC as an IA principle.** Applying access control thinking to information architecture — before any visual design began — meant that the eventual implementation would not require retrofitting permission logic onto a navigation structure designed without it. This is a discipline worth carrying into every multi-role product project.

**Iterative critique over first-pass acceptance.** The temptation in an AI-assisted workflow is to accept well-structured outputs at face value. Resisting that temptation and applying genuine critical review on each iteration pass was what separated useful, grounded deliverables from plausible-but-generic ones.

**Competitive design research before implementing.** Reviewing Ramp, Brex, Navan, Expensify, Airbase, and Spendesk before the visual design phase identified 10 concrete modern patterns (bento grids, sparklines, period toggles, illustrated empty states) that produced a measurably more polished result than designing from scratch.

### What I Would Change

**More structured competitive analysis.** The market research phase was thorough but not sufficiently comparative — it catalogued patterns across the category but did not produce a formal feature benchmark table that would allow a later reader to see exactly where the proposed platform's MVP sits relative to existing products. A structured comparison matrix would be a stronger artifact.

**Earlier ERD development.** The entity relationship diagram was produced near the end of the IA phase, but in retrospect, an early draft of the data model would have been a useful input to the feature prioritization phase — several MoSCoW decisions would have been sharpened by a clearer picture of the implementation dependencies between entities.

**User testing proxies.** The pre-design phase produced no user validation of any kind — all outputs were synthesized from secondary research and iterative AI collaboration. In a production project, at least one round of concept validation (presenting the personas and journey maps to real users in the target roles) would significantly strengthen the research foundation.

### Skills and Frameworks Reinforced

Working through all six phases sequentially, with AI assistance, reinforced several competencies that are easy to describe but harder to internalize through coursework alone: the discipline of scope definition before requirements, the use of complementary frameworks (Kano + MoSCoW rather than either alone), the structural importance of cross-role handoffs in multi-stakeholder products, and the value of producing data model artifacts during the pre-design phase rather than deferring them to engineering.

---

## 9. Appendices

### Appendix A: Glossary

| Term | Definition |
|---|---|
| **Kano Model** | A customer satisfaction framework that classifies product features by the relationship between feature presence/absence and user satisfaction. Categories: Basic, Performance, Excitement, Indifferent. |
| **MoSCoW** | A prioritization framework that categorizes requirements into Must Have, Should Have, Could Have, and Won't Have (this release). Used for MVP scoping. |
| **Jobs-To-Be-Done (JTBD)** | A product thinking framework that frames user needs as "jobs" — the functional and emotional outcomes users are hiring a product to achieve. |
| **RBAC (Role-Based Access Control)** | A system design principle that controls access to features and data based on the user's assigned role. Used in this project as an IA-shaping principle, not just a security mechanism. |
| **ERD (Entity Relationship Diagram)** | A data modeling diagram that shows the entities in a system, their attributes, and the relationships (one-to-one, one-to-many, many-to-many) between them. |
| **IA (Information Architecture)** | The structural design of a product's content and navigation — sitemaps, user action trees, and the organizational logic that determines what appears where. |
| **Journey Map** | A UX artifact that traces a user's experience through a process over time, capturing actions, touchpoints, emotional state, and pain points at each stage. |
| **Persona** | A synthesized representation of a user type, grounded in research, that captures goals, frustrations, behaviors, and motivations to guide design decisions. |
| **Sitemap** | A high-level diagram of a product's navigation structure, showing the primary sections and how they relate to each other. |
| **User Action Tree** | A hierarchical diagram that decomposes the actions available to a user type within each section of a product — more granular than a sitemap. |
| **Wireframe** | A low-fidelity representation of a screen's layout and content structure, without visual design treatment. In this project, wireframe *prompts* were produced as handoff artifacts rather than wireframes themselves. |
| **NotebookLM** | Google's AI-assisted notebook tool, used in this project to ingest the consolidated design corpus and make it queryable as a knowledge base. |
| **OCR (Optical Character Recognition)** | Technology that extracts text from images. Used in T&E platforms to parse receipt photographs and pre-fill expense line items. |
| **GL Code (General Ledger Code)** | An accounting classification code assigned to a transaction to indicate the expense category for bookkeeping and reporting purposes. |

---

### Appendix B: File Index

All artifacts produced during the pre-design phase and visual design phase are listed below. The implemented system (Travelex) lives at `/Users/nadavor/UX/UI/` — frontend in `frontend/src/`, backend in `backend/app/`.

| Artifact | File / Location | Format |
|---|---|---|
| Problem statement | `docs/01-problem-statement.md` | Markdown |
| Market research report | `docs/02-market-research.docx` | Word |
| Personas (all types) | `docs/03-personas.md` | Markdown |
| Journey maps | `docs/04-journey-maps/` | Mermaid diagrams |
| Cross-role handoff diagram | `docs/04-journey-maps/handoff-diagram.md` | Mermaid |
| Feature prioritization matrix | `docs/05-feature-prioritization.md` | Markdown table |
| Sitemap | `docs/06-sitemap.md` | Mermaid diagram |
| User action tree | `docs/06-user-action-tree.md` | Mermaid / table |
| ERD | `docs/07-erd.md` | ERD notation |
| User flow diagrams | `docs/08-user-flows/` | Mermaid diagrams |
| Wireframe prompts (3 portals) | `docs/09-wireframe-prompts/` | Structured Markdown |
| AI assistant documentation | `docs/AI_ASSISTANT.md` | Markdown |
| This process document | `docs/TE-Platform-Process-Documentation.md` | Markdown |
| Process document PDF | `docs/TE-Platform-Process-Documentation.pdf` | PDF |
| Screenshots (50 PNGs) | `docs/screenshots/` | PNG — 1440×900, 3 roles, all pages |
| Marp slide deck | `docs/TE-Platform-Slides.md` + `.pdf` | 26-slide presentation |
| **Implemented frontend** | `frontend/src/pages/` | React / TypeScript |
| **Implemented backend** | `backend/app/` | FastAPI / SQLAlchemy / SQLite |

---

*Document produced as part of a UX/UI course capstone project. All personas, user stories, and feature specifications are design artifacts and do not represent any specific commercial product or organization.*
