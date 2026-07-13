# Ameya Business OS  
## Functional Product Requirements Document (PRD)

| Document | Details |
|----------|---------|
| **Product Name** | Ameya Business OS |
| **Document Type** | Functional PRD (Business Analyst view) |
| **Audience** | Client / Business stakeholders |
| **Scope** | Functional modules and features developed to date |
| **Perspective** | Business process & capability — not technical implementation |

---

### 1. Product Overview

**Ameya Business OS** is an enterprise business operating system that helps the organization manage the full commercial lifecycle in one place — from opportunity and customer management, through deals and billing, to collections, renewals, expenses, and business reporting.

The product gives founders and business teams a single workspace to:

- Track leads and convert them into customers  
- Manage deals and billable components  
- Generate invoices and follow collections  
- Monitor renewals and recurring revenue  
- Record and control expenses  
- Review business performance through reports  
- Configure company profile, finance rules, and master data  

---

### 2. Business Objectives

| # | Objective |
|---|-----------|
| 1 | Maintain a clear pipeline from **Opportunity → Customer → Deal → Invoice → Payment → Renewal** |
| 2 | Give leadership a **daily command view** of revenue, collections, renewals, and follow-ups |
| 3 | Reduce leakage in **outstanding collections** and **missed renewals** |
| 4 | Standardize **billing, tax defaults, and payment recording** |
| 5 | Control **one-time and recurring expenses** against vendors and employees |
| 6 | Provide **actionable business reports** without leaving the system |
| 7 | Allow the business to **configure stages, masters, branding, and preferences** without changing product design |

---

### 3. In-Scope Modules (Summary)

| # | Module | Business Purpose |
|---|--------|------------------|
| 1 | Dashboard | Daily business health, follow-ups, and quick actions |
| 2 | Opportunities / Customers | Lead & customer lifecycle management |
| 3 | Deals | Revenue deal tracking and billable components |
| 4 | Revenue | Invoices, collections, and renewals |
| 5 | Expenses | Expense register and recurring expense templates |
| 6 | Reports | Revenue, expense, outstanding, and renewal analysis |
| 7 | Settings | Company, masters, finance, branding, and preferences |

---

### 4. Module-wise Functional Scope & Features

---

## 4.1 Dashboard

### Scope of Work (Business Analyst View)

Deliver a **founder / operations command center** that surfaces the most important business signals for the day: revenue health, money to collect, renewals due, follow-ups pending, recent activity, and shortcuts to create key records.

### Features Developed

1. Personalized greeting with today’s date  
2. Founder insight banner highlighting priority business messages (e.g. collections, renewals, cash vs expense)  
3. KPI cards with trends and navigation into related areas:  
   - Revenue This Month  
   - Outstanding Collections  
   - Upcoming Renewals  
   - Cash Position  
4. Revenue vs Expense comparison chart  
5. Follow-up widgets:  
   - Today’s follow-ups  
   - Tomorrow’s follow-ups  
   - Overdue follow-ups  
6. Action Required section:  
   - Pending Collections (priority outstanding items)  
   - Upcoming Renewals (priority renewal items)  
7. Recent Activity feed (payments, invoices, deals, renewals, expenses)  
8. Quick Actions:  
   - Add Opportunity / Customer  
   - Go to Deals  
   - Add Expense  
9. Light / Dark theme toggle in application chrome  

---

## 4.2 Opportunities / Customers

### Scope of Work (Business Analyst View)

Deliver an end-to-end **relationship management** module to capture opportunities and customers, move them through configurable pipeline stages, and maintain a single customer workspace covering deals, invoices, payments, renewals, files, and timeline history.

### Features Developed

#### List & Directory
1. Combined Opportunities / Customers listing  
2. Add Opportunity / Customer  
3. Edit existing Opportunity / Customer  
4. Summary stats:  
   - Total Customers  
   - Active Customers  
   - Outstanding Amount  
   - Renewals This Month  
5. Search by name, company, GST, phone, email  
6. Filters:  
   - Record Type (Opportunity / Customer)  
   - Status (Active / Inactive / Prospect)  
   - Outstanding  
   - Renewal (This Month / Upcoming)  
   - Active Deals  
7. Open customer workspace from the list  

#### Record Capture (Add / Edit)
8. Name, company, phone, email  
9. GSTIN with validation  
10. Billing address  
11. Service address  
12. Notes  
13. Record type selection: Opportunity or Customer  

#### Customer Workspace
14. Hero summary with status badges, outstanding badge, and active deals count  
15. Contact display (phone, email, GST)  
16. Billing and service address display  
17. Change Record Type (Opportunity ↔ Customer)  
18. Change Current Stage (pipeline stage)  
19. Stage Change support with next action date and notes (when required by stage rules)  
20. Workspace metrics:  
    - Outstanding  
    - Business Value  
    - Last Payment  
    - Next Renewal  
    - Next Action  
    - Active Deals  
21. Quick actions: Create Deal, Call, Email, Open Timeline  

#### Workspace Tabs
22. **Overview** — Business Summary, Collection Summary, Renewal Summary, Recent Activity  
23. **Deals** — deals linked to the customer  
24. **Invoices** — customer invoices  
25. **Payments** — payment history  
26. **Renewals** — renewal schedule / history  
27. **Files** — contracts and agreements storage area  
28. **Timeline** — chronological stage history with notes and next-action dates  

#### Pipeline Discipline
29. Configurable stages (managed under Settings → Stage Builder)  
30. Stage progression with optional mandatory next-action date and notes  
31. Sample business flow supported: New Lead → Qualified → Proposal Sent → Negotiation → Won – Customer → Onboarding → Active Account (and Lost)  

---

## 4.3 Deals

### Scope of Work (Business Analyst View)

Deliver a **deal management** module to create and track revenue-bearing deals against customers, define billable components, manage deal status/stage, and connect each deal to invoices, payments, renewals, documents, timeline, and notes.

### Features Developed

#### Deals List
1. Company-wide deals listing  
2. Summary stats:  
   - Total Deals  
   - Active Deals  
   - Components  
   - Renewals This Month  
3. Search and filters:  
   - Status (Draft / Active / Completed / On Hold)  
   - Renewal (This Month / Upcoming / None)  
4. Add Deal (via customer context)  
5. Open deal workspace  

#### Create Deal Wizard
6. Step 1 — Deal Details:  
   - Deal name  
   - Deal type  
   - Contract value  
   - Start date  
   - Renewal frequency  
   - Description  
   - Customer locked from context  
7. Step 2 — Components  
8. Step 3 — Review  

#### Deal Workspace
9. Hero with status, customer link, and stage change  
10. Deal metrics: start date, next renewal, components count, next action  
11. Workspace tabs:  
    - **Overview** — Deal / Financial / Renewal summary panels  
    - **Components** — billable line-item management  
    - **Invoices** — deal invoices and generate-invoice flow  
    - **Payments** — payment history and outstanding view  
    - **Renewals** — renewal schedule and history  
    - **Documents** — contracts and agreements  
    - **Timeline** — chronological deal history  
    - **Notes** — internal notes and note history  

#### Deal Components (Billable Line Items)
12. Add / manage deal components  
13. Component fields:  
    - Name  
    - Category  
    - Description  
    - Amount  
    - GST %  
    - Quantity  
    - Discount  
    - Billing type (One-time / Monthly / Quarterly / Half-yearly / Yearly)  
    - Renewal applicable + renewal date  
    - Status (Pending / In Progress / Completed)  

#### Deal Statuses & Renewal
14. Deal statuses: Draft, Active, Completed, On Hold  
15. Renewal frequencies: None, Monthly, Quarterly, Annual (plus configurable masters)  

---

## 4.4 Revenue (Invoices · Collections · Renewals)

### Scope of Work (Business Analyst View)

Deliver a **company-wide revenue operations** module covering invoice generation and tracking, receivables/collections follow-up, and renewal monitoring — with a dedicated invoice workspace for payments, documents, and activity history.

### Features Developed

#### Revenue Hub
1. Three operational tabs:  
   - Invoices  
   - Collections  
   - Renewals  

#### Invoices
2. Invoice list with stats: Total Invoices, Paid, Partial, Overdue  
3. Search and filters by status, customer, and date (This Month / Last Month / Overdue)  
4. Invoice statuses: Draft, Sent, Partial, Paid, Overdue  
5. Open invoice workspace  
6. **Generate Invoice** flow:  
   - Select customer / deal components  
   - Choose billing vs service address  
   - Apply tax defaults  
   - Review amounts summary  

#### Collections
7. Collections view with stats:  
   - Outstanding Amount  
   - Invoices Pending  
   - Overdue Collections  
   - Collected This Month  
8. Outstanding receivables listing and filters  

#### Renewals
9. Renewals view with stats:  
   - Upcoming This Month  
   - Overdue  
   - Renewed  
   - Renewal Value  
10. Company renewals listing and filters  

#### Invoice Workspace
11. Invoice hero / summary  
12. Tabs: Overview, Payments, Documents, Timeline  
13. **Record Payment** with:  
    - Payment date  
    - Amount  
    - Payment mode / method  
    - Reference  
    - Received by  
    - Transaction ID  
    - Notes  
14. Payment history table  
15. Documents area for invoice files / PDFs  
16. Invoice activity timeline  

---

## 4.5 Expenses

### Scope of Work (Business Analyst View)

Deliver an **expense control** module to record day-to-day spend, classify payees as vendors or employees, support recurring expense templates, and keep expense masters aligned with Settings.

### Features Developed

#### Expense Register
1. Expense Register tab  
2. Add / Edit Expense  
3. Register stats (total spend, paid, pending, upcoming recurring)  
4. Search and filters:  
   - Date presets (Today, Week, Month, Last Month, Quarter, Year, Custom)  
   - Category  
   - Status  
   - Vendor  
   - Employee  
   - Payment method  
5. Expense transaction fields:  
   - Date  
   - Category  
   - Name  
   - Payee type (Vendor / Employee)  
   - Amount  
   - Status (Paid / Pending / Partial / Cancelled)  
   - Payment method  
   - Reference  
   - Notes  
   - Attachment support  
   - Recurring flag  
6. Inline quick-create of Category / Vendor / Employee while entering an expense  
7. Option to create a recurring template from a transaction  
8. Prompt to update recurring template when amount changes on a linked expense  
9. Receipt / attachment upload area  

#### Expense Master (Recurring Templates)
10. Expense Master tab  
11. Add / Edit recurring expense template  
12. Auto-generate pending register entries from templates  
13. Template fields:  
    - Name  
    - Category  
    - Vendor or Employee  
    - Default amount  
    - Frequency (Monthly / Quarterly / Half-yearly / Yearly / One-time)  
    - Start / End dates  
    - Auto-generate flag  
    - Status (Active / Inactive)  
14. Filters by category, status, and frequency  

---

## 4.6 Reports

### Scope of Work (Business Analyst View)

Deliver a **business intelligence / analysis** module with filterable operational reports for revenue, expenses, outstanding receivables, and renewals, plus export actions for sharing outside the system.

### Features Developed

#### Shared Report Capabilities
1. Report filters (context-sensitive by report):  
   - Date range / presets  
   - Customer  
   - Deal  
   - Status  
   - Category  
   - Employee  
   - Vendor  
   - Search  
2. Export actions: Excel, PDF, Print  

#### Revenue Report
3. Stats: Total Revenue, Collected, Outstanding, Average Invoice Value  
4. Invoice-level revenue table  
5. Drill-through to invoice workspace  

#### Expense Report
6. Stats: Total Expense, Paid, Pending, Recurring Expenses  
7. Expense table  
8. Navigation into expense register  

#### Outstanding Report
9. Stats: Outstanding Amount, Invoices Pending, Overdue Invoices, Average Outstanding  
10. Outstanding receivables table  

#### Renewal Report
11. Stats: Upcoming Renewals, Overdue Renewals, Renewed, Renewal Value  
12. Renewal table  
13. Drill-through to deal workspace  

---

## 4.7 Settings

### Scope of Work (Business Analyst View)

Deliver a **configuration & master data** module so the business can set up company identity, finance defaults, branding, user preferences, and all reference lists used across Opportunities, Deals, Revenue, and Expenses.

### Features Developed

#### Company
1. Company name  
2. Logo upload area  
3. GSTIN, PAN  
4. Email, phone, website  
5. Address  
6. Currency (INR, USD, EUR, GBP)  
7. Financial year (April–March, January–December, July–June)  

#### Masters (Add / Edit / Deactivate / Search)
8. **Opportunity Sources** — how leads originated  
9. **Industries** — customer / industry classification  
10. **Stage Builder** — pipeline stages with:  
    - Name, color, sequence  
    - Applicable to Opportunity / Customer / Both  
    - Require next-action date  
    - Require notes  
    - Reminder offset (same day / 1 / 3 / 7 days before)  
    - Active / Inactive  
11. **Deal Types** — classification of deals  
12. **Payment Methods** — modes for payments and expenses  
13. **Expense Categories** — expense classification  
14. **Renewal Frequencies** — recurring billing / renewal cadence  
15. **Countries** — geography master  
16. **States** — geography master linked to country  
17. **Employees** — name, department, designation (org directory / expense payees)  
18. **Vendors** — name, category, contact person, phone, email  

#### Finance
19. Invoice prefix  
20. Next invoice number  
21. Default tax %  
22. Default payment terms  
23. Currency symbol  

#### Branding
24. Logo URL  
25. Favicon URL  
26. Primary / Secondary / Accent colors  
27. Tagline  

#### Preferences
28. Theme (System / Light / Dark)  
29. Date format  
30. Currency format  
31. Time zone  

---

### 5. Cross-Module Business Capabilities

| Capability | Where it appears |
|------------|------------------|
| Document / file attachment areas | Customer Files, Deal Documents, Invoice Documents, Expense attachments, Company logo |
| Follow-ups & next-action discipline | Stage Builder rules, Customer/Deal next action, Dashboard follow-up widgets, Timelines |
| GST / tax readiness | Customer GSTIN, Company GSTIN/PAN, invoice tax defaults, component GST % |
| Recurring business cycles | Deal renewals, Expense templates, Renewal reports & dashboard widgets |
| Master-driven consistency | Stages, deal types, payment methods, categories, vendors, employees, geographies |

---

### 6. Core Business Entities Managed

| Entity | Business meaning |
|--------|------------------|
| Opportunity / Customer | Lead or account relationship |
| Stage / Timeline | Pipeline progress and history |
| Deal | Revenue agreement with a customer |
| Deal Component | Billable line item within a deal |
| Invoice | Billing document |
| Payment | Money received against an invoice |
| Collection | Outstanding receivable tracking |
| Renewal | Recurring commercial cycle |
| Expense Transaction | One-time or generated spend entry |
| Expense Template | Recurring expense master |
| Vendor / Employee | Expense payees / org reference |
| Company Profile | Organization identity & finance setup |
| Masters | Configurable reference data |

---

### 7. End-to-End Business Flows Covered

1. **Acquire** — Capture Opportunity → Qualify through stages → Convert to Customer  
2. **Sell** — Create Deal → Add Components → Activate deal  
3. **Bill** — Generate Invoice from deal components → Track invoice status  
4. **Collect** — Record Payment → Reduce outstanding → Monitor collections  
5. **Renew** — Track renewal dates → Complete renewals → Protect recurring revenue  
6. **Spend** — Record expenses → Use recurring templates → Review expense reports  
7. **Govern** — Configure company, finance rules, branding, and masters  

---

### 8. Out of Scope (Current Delivery)

The following are **not** part of the functional delivery covered in this PRD:

- Multi-user login, authentication, and role-based access control (Employees are reference/master data, not security roles)  
- Dedicated Notifications Preferences screen in Settings (email / SMS / push configuration capability is prepared at platform level, not exposed as a full Settings section in the current UI)  

---

### 9. Acceptance Perspective (How to Validate with Client)

For client walkthrough / UAT, validation should confirm that users can:

1. See business KPIs and follow-ups on the Dashboard  
2. Create and manage Opportunities and Customers, including stage movement and timeline  
3. Create Deals with Components against a Customer  
4. Generate Invoices and record Payments  
5. Monitor Collections and Renewals from Revenue  
6. Add Expenses and manage recurring Expense Templates  
7. Run Revenue, Expense, Outstanding, and Renewal Reports  
8. Configure Company, Masters, Finance, Branding, and Preferences  

---

### 10. Document Control

| Item | Value |
|------|-------|
| Product | Ameya Business OS |
| Version | Functional PRD — Current delivered scope |
| Prepared for | Client review & sign-off |
| Nature | Functional / business requirements only |

---

*This document describes what the software does for the business. It intentionally excludes technical architecture, databases, APIs, and implementation details.*
