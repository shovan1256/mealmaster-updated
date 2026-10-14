# Multi-Mess Enterprise Architecture & Public Production Upgrade

Transform MealMaster Dining into a production-grade, multi-tenant public platform where any mess or hostel can register, manage members, track meals/bazar/deposits in complete data isolation, export certified monthly statements, and maintain high performance with automated database quota archiving.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed based on your requirements and are scheduled for execution upon approval:

- **Confirmed Decision 1 (Multi-Mess Multi-Tenancy)**: The platform will support multiple distinct messes. Each mess receives a unique `messId` and Mess Join Code. Data (Users, Meals, Bazar, Deposits, Fixed Costs, Notices) is strictly isolated so managers and members only access their own mess records.
- **Confirmed Decision 2 (Automated PDF & Excel Statement Export)**: Managers and members can download pixel-perfect monthly balance sheets, meal summaries, and expense ledgers in formatted PDF and Excel (`.xlsx`/`.csv`) formats.
- **Confirmed Decision 3 (Quota Auto-Archiving)**: Past months' daily meals and expense records will be automatically compiled into lightweight monthly ledger summaries to prevent Firestore read/write quota exhaustion.
- **Confirmed Decision 4 (SMS Notification System)**: Daily meal token confirmations, balance alerts, and manager deposit acknowledgments with a simulated Bangladesh SMS gateway (Banglalink/Grameenphone template preview) and direct WhatsApp/SMS link dispatch.
- **Confirmed Decision 5 (Manager Audit Logs)**: Immutable audit history tracking every financial modification (deposit additions, bazar edits, meal adjustments, manager role changes) with timestamps and actor metadata.

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades MealMaster Dining from a single-mess app into an open SaaS platform for student hostels, bachelor messes, and corporate dining halls across Bangladesh.
- **Target Audience**:
  - **Mess Managers & IT Admins**: Need automated calculation, multi-month archiving, tamper-proof logs, and exportable statements for monthly audits.
  - **Boarders & Members**: Need transparent meal counts, real-time balance calculations, automated meal off/on scheduling, and downloadable account slips.
- **Key Value**: Eliminates manual ledger calculation disputes, prevents database quota crashes, and allows instant onboarding of multiple independent messes under one clean PWA.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Mess Creation & Onboarding Flow**:
   - New manager signs up $\rightarrow$ Chooses "Create New Mess" (enters Mess Name, Location, Meal Rate Policy) or "Join Existing Mess" with Mess Code $\rightarrow$ Dedicated Mess Dashboard generated.
2. **Monthly Statement Export Flow**:
   - Manager or Member visits "Monthly Accounts" tab $\rightarrow$ Clicks "Export Statement" $\rightarrow$ Chooses format: **Printable PDF Bill Slip** or **Detailed Excel Spreadsheet** $\rightarrow$ Immediate download with breakdown of total meals, individual consumption, bazar costs, fixed costs, and net balance.
3. **Financial Audit Trail**:
   - Under Manager Portal, a dedicated "Audit Logs (হিসাব লগ)" tab displays a transparent chronological timeline of every deposit recorded, bazar entry modified, or role assigned.
4. **SMS & WhatsApp Notice Dispatch**:
   - Manager records a deposit or meal deduction $\rightarrow$ Can trigger an instant SMS/WhatsApp notification modal pre-filled with Bengali text (e.g., `প্রিয় [নাম], আপনার মেসে ৳১,৫০০ জমা গৃহীত হয়েছে। বর্তমান ব্যালেন্স: ৳৪৫০। - [মেসের নাম]`).

### Visual Identity & Theme

- **Design Tone**: High-density Bengali SaaS dashboard adhering to the Zero-Pill discipline and compact numeric alignment.
- **Typography**: Clean sans display paired with strictly monospace tabular figures (`font-mono tabular-nums`) for currency amounts, meal quantities, and date timestamps to eliminate visual jitter.
- **Status Accents**:
  - Emerald (`text-emerald-700 bg-emerald-50/50`) for surplus and approved states.
  - Amber (`text-amber-700 bg-amber-50/50`) for pending approvals and notifications.
  - Rose (`text-rose-700 bg-rose-50/50`) for dues and stopped meal states.
- **Density**: Single-elevation flat cards with subtle 1px border lines (`border-slate-200`) and WCAG AA contrast compliance.

---

## 3. Key Product Decisions & Trade-Offs

- **Multi-Tenancy Model (Row-Level `messId` Scoping)**:
  - *Chosen Approach*: Assign a unique `messId` to every User, MealEntry, BazarExpense, Deposit, FixedCost, and Notice document. Firestore queries and local storage keys are filtered strictly by the active `currentMessId`.
  - *Why*: Enables seamless multi-mess scaling on a single Firebase project without creating expensive separate databases.
- **Client-Side PDF & Excel Generation (`jspdf`, `xlsx`)**:
  - *Chosen Approach*: Client-side generation using lightweight, battle-tested libraries (`jspdf` + `jspdf-autotable` and `xlsx`).
  - *Why*: Works completely offline in PWA mode, executes instantly without backend server latency or API billing costs.
- **Two-Tier Past Month Archiving Strategy**:
  - *Chosen Approach*: Current active month retains daily granular records. Past closed months are collapsed into an aggregated `MonthlySummaryDoc` per member.
  - *Why*: Reduces daily document read/write count by over 85%, ensuring the app stays comfortably within Firestore's free limits even with dozens of active messes.
- **Simulated SMS Gateway with 1-Click WhatsApp Direct Link**:
  - *Chosen Approach*: Provide realistic in-app SMS logs with web SMS dispatch and `https://wa.me/` direct URL dispatching.
  - *Why*: Real SMS APIs (e.g., Greenweb, SSL Wireless, Twilio) require commercial telecom credentials and prepaid credits; the dual simulation + WhatsApp link allows immediate production usability without recurring telecom fees.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                          MealMaster Multi-Mess                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          ▼                                                   ▼
┌───────────────────────────┐                       ┌────────────────────┐
│      Mess Onboarding      │                       │   Mess Switcher    │
│  - Create New Mess Code   │                       │ - Active Mess ID   │
│  - Join via 6-Digit Code  │                       │ - Role Resolution  │
└─────────┬─────────────────┘                       └─────────┬──────────┘
          │                                                   │
          └─────────────────────────┬─────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Scoped Domain Operations                          │
├───────────────────┬───────────────────┬────────────────────────────────┤
│   Meal & Bazar    │  Accounts & Dues  │     Export & Audit Engine      │
│  - Daily Checker  │  - Deposits Ledger│     - PDF Monthly Statement    │
│  - Cook Token     │  - Month End Calc │     - Excel Ledger Download    │
│  - Bazar Entries  │  - Fixed Shared   │     - Financial Audit Trail    │
│                   │    Expenses       │     - SMS / WhatsApp Alerts    │
└───────────────────┴───────────────────┴────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Data Persistence & Archiving Engine                  │
├───────────────────────────────────┬────────────────────────────────────┤
│         Active Month DB           │       Archived Historical DB       │
│  - Users (`messId`)               │  - `MessArchives/{messId}_{month}` │
│  - DayMealEntries (`messId`)      │  - Collapsed monthly balances      │
│  - BazarExpenses (`messId`)       │  - Quota-friendly read snapshots   │
│  - Deposits (`messId`)            │  - Local offline fallback storage  │
└───────────────────────────────────┴────────────────────────────────────┘
```

### Phased Execution Steps

1. **Phase 1: Multi-Tenant Data Scoping & Mess Onboarding**
   - Introduce `Mess` data entity (`id`, `name`, `code`, `adminId`, `mealRateMode`, `createdAt`).
   - Add `messId` to all entities (`Member`, `DayMealEntry`, `BazarExpense`, `Deposit`, `FixedCost`, `MessNotice`, `AuditLog`).
   - Create Mess Creation / Join modal in `LoginScreen` for new boarders and managers.
2. **Phase 2: Automated PDF & Excel Statement Export**
   - Add client-side statement generator utility formatting standard Bengali mess accounts (Total Bazar, Total Meals, Meal Rate, Individual Meals, Individual Bazar/Deposits, Carry-over, Balance).
   - Add "Export PDF" and "Export Excel" action buttons in Manager and User portals.
3. **Phase 3: Quota Optimizer & Auto-Archiving**
   - Create monthly archive service that freezes past months into a single summary document per mess.
   - Restrict active snapshot listeners to only query the active month (`where('messId', '==', activeMessId)` and `where('month', '==', currentMonth)`).
4. **Phase 4: Manager Audit Trail & SMS / WhatsApp Dispatch**
   - Implement `AuditLogs` collection tracking create/update/delete on finances.
   - Add Audit Log viewer tab in Manager Portal.
   - Add SMS Notification dispatch modal with pre-crafted Bengali templates and direct WhatsApp link action.
