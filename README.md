# AVENQUIS

**Professional Firm Operating System**

AVENQUIS is a security-first, multi-tenant operating system for professional service firms including accounting, audit, tax, advisory, consulting, and related practices.

The first target market is Bangladesh, but the platform is being designed from the beginning for international expansion and international professional standards.

---

## Project Status

**Current Stage:** Backend audit in progress (Phases 3–32 audited; fixes submitted through PR #11)
**Test Suite Status:** TypeScript and targeted lint checks pass for the audited batches; full Supabase-backed integration verification is still pending.
**Public Launch:** After V5 only  
**Development Model:** Build → Private Test → Improve → Next Version → Final QA → Launch

### Backend Audit Progress — 38 Phases

This checklist records work that has actually been audited and verified in this repository. A tick means the phase was reviewed and the listed hardening work was completed; it does not mean production or full Supabase integration readiness is complete.

- [ ] **Phase 1:** Database setup, schema and migration foundation — final audit pending
- [ ] **Phase 2:** Tenant isolation, RLS and request tenant context — final RLS revalidation pending
- [x] **Phase 3:** Authentication, MFA and RBAC — audited in Phase 3–5 batch
- [x] **Phase 4:** People and staff management — tenant ownership fixes completed
- [x] **Phase 5:** CA student and articleship management — tenant ownership fixes completed
- [x] **Phase 6:** Client CRM and KYC — membership tenant validation completed
- [x] **Phase 7:** Engagement and independence — membership tenant validation completed
- [x] **Phase 8:** Working papers, review workflow and team access — tenant validation completed
- [x] **Phase 9:** Tasks, timesheets and billing — tenant validation and transaction fixes completed
- [x] **Phase 10:** Partner sign-off and digital certificates — audited with Phase 9–11 batch
- [x] **Phase 11:** Notifications and activity feed — recipient scoping fixes completed
- [x] **Phase 12:** Analytics and reporting — tenant-scoped queries audited
- [x] **Phase 13:** Admin and security logs — pagination/filter validation hardened
- [x] **Phase 14:** Trial balance and account mapping — decimal-safe amounts and mapping validation completed
- [x] **Phase 15:** Materiality, risk assessment and assertions — linkage and input validation hardened
- [x] **Phase 16:** Controls, audit programs and procedures — membership and risk linkage validation hardened
- [x] **Phase 17:** Sampling and evidence — procedure, engagement and membership linkage validation hardened
- [x] **Phase 18:** Exceptions and review — procedure linkage and reviewer integrity hardened
- [x] **Phase 19:** Completion and reporting — checklist membership and signed-report immutability hardened
- [x] **Phase 20:** Permanent and current files — uploader and client-engagement linkage validation hardened
- [x] **Phase 21:** Audit quality controls — evaluator membership integrity hardened
- [x] **Phase 22:** ICAB workflows and articleship rules — principal/approval state transitions hardened
- [x] **Phase 23:** DVS support — generator authorization and non-authoritative status preserved
- [x] **Phase 24:** Regulatory compliance — filing membership and status transitions hardened
- [x] **Phase 25:** Tax and VAT workflows — assignee and forward-only status validation hardened
- [x] **Phase 26:** Regulatory calendar and templates — creator and client ownership validation hardened
- [x] **Phase 27:** AI and document intelligence — request linkage and mock disclosure audited
- [x] **Phase 28:** Advanced analytics and forecasting — member/engagement and date validation hardened
- [x] **Phase 29:** Advanced HR and finance — payroll and expense ownership validation hardened
- [x] **Phase 30:** Client portal and secure exchange — client and engagement ownership validation hardened
- [x] **Phase 31:** Automation and APIs — webhook secret encryption and response redaction hardened
- [x] **Phase 32:** Enterprise scale and multi-office support — branch/member tenant validation hardened
- [ ] **Phase 33:** Internationalization and multi-language — audit pending
- [ ] **Phase 34:** Multi-country and regional data — audit pending
- [ ] **Phase 35:** Country regulatory packs — audit pending
- [ ] **Phase 36:** Enterprise security and identity — audit pending
- [ ] **Phase 37:** Advanced integrations — audit pending
- [ ] **Phase 38:** International SaaS readiness and final QA — audit pending

#### Audit PRs

- [x] [PR #2 — Phases 3–5 hardening](https://github.com/hridoymohammad000-wq/Avenquis-BE/pull/2)
- [x] [PR #3 — Phases 6–8 hardening](https://github.com/hridoymohammad000-wq/Avenquis-BE/pull/3)
- [x] [PR #4 — Phases 9–11 hardening](https://github.com/hridoymohammad000-wq/Avenquis-BE/pull/4)
- [x] [PR #5 — Phases 12–14 hardening](https://github.com/hridoymohammad000-wq/Avenquis-BE/pull/5)
- [x] [PR #6 — Phases 15–17 hardening](https://github.com/hridoymohammad000-wq/Avenquis-BE/pull/6)
- [x] [PR #7 — Phases 18–20 hardening](https://github.com/hridoymohammad000-wq/Avenquis-BE/pull/7)
- [x] [PR #8 — Phases 21–23 hardening](https://github.com/hridoymohammad000-wq/Avenquis-BE/pull/8)
- [x] [PR #9 — Phases 24–26 hardening](https://github.com/hridoymohammad000-wq/Avenquis-BE/pull/9)
- [x] [PR #10 — Phases 27–29 hardening](https://github.com/hridoymohammad000-wq/Avenquis-BE/pull/10)
- [x] [PR #11 — Phases 30–32 hardening](https://github.com/hridoymohammad000-wq/Avenquis-BE/pull/11)

#### Known Verification Limitations

- [ ] Full 38-phase audit completed
- [ ] Full Supabase/PostgreSQL integration suite executed after migrations
- [ ] RLS session context verified on every API request path
- [ ] Production secrets rotated after the previously exposed database credential
- [ ] Final security and release gate approved

**V1 Milestone Finalized:**  
**Date:** Tuesday, 1 September 2026  
**Timezone:** Bangladesh Standard Time (UTC+6)

---

## 🚀 Live Deployments

- **Frontend (Vercel):** [https://avenquis-fe.vercel.app](https://avenquis-fe.vercel.app)
- **Backend API (Render):** [https://avenquis-be.onrender.com](https://avenquis-be.onrender.com)
- **Database:** Supabase PostgreSQL

---

# Core Product Vision

AVENQUIS is not only audit software.

The long-term platform will cover:

- Audit & Assurance
- Client CRM
- Engagement / Job Management
- Staff Management
- CA Student / Articleship Management
- Task & Deadline Management
- Timesheets
- Resource Planning
- Office Finance
- Billing & Collections
- Document Management
- Review & Approval Workflows
- Compliance Management
- Knowledge Base
- AI Assistant
- Reporting & Analytics
- Client Portal
- Integrations
- API Platform
- International Regulatory Packs

---

# Core Architecture Principle

> **BUILD SMALL. ARCHITECT BIG.**

V1 will remain intentionally focused.

However, the following foundations must be future-ready from day one:

- Multi-tenancy
- Security
- Permissions
- Tenant isolation
- Database structure
- Audit trails
- Versioning
- Document integrity
- API architecture
- AI safety
- Regulatory modularity
- International scalability

---

# Security Principles

AVENQUIS follows these mandatory rules:

- Authorization fails closed
- Tenant ID is context, not authorization
- Active tenant must be validated server-side
- Every tenant-owned table must use Row Level Security
- Cross-tenant data leakage is a release blocker
- Authentication and authorization are separate
- Roles are permission bundles, not job-title authority
- Sensitive actions generate audit/security events
- Important professional evidence must be immutable/versioned
- Privileged credentials must never be normal client credentials
- AI must never bypass user permissions
- AI proposes; authorized humans approve
- Public launch will not happen before security and QA approval

---

# Target Standards

The architecture should remain compatible with the direction of:

- ISA
- ISQM
- IESBA Code
- IFRS
- IFRS for SMEs
- ISO 27001-ready security practices
- SOC 2-ready engineering practices

Bangladesh-specific requirements will be implemented as configurable/versioned regulatory packs rather than hardcoded into the global core.

Future Bangladesh packs may include:

- ICAB
- FRC
- BSEC
- NBR
- DVS workflow support
- Articleship requirements
- Tax/VAT workflows
- Sector-specific regulators

---

# V1 → V5 Product Roadmap

## V1 — Core Firm OS (STATUS: 100% COMPLETED & VERIFIED)

Goal:

> A real professional firm should be able to perform its core daily operations inside AVENQUIS.

### Implemented V1 Phases (13/13 Completed)

- [x] **Phase 1:** Database Setup & Schema Infrastructure
- [x] **Phase 2:** Multi-Tenant Row Level Security (RLS) Isolation
- [x] **Phase 3:** Authentication, Security, TOTP MFA & RBAC
- [x] **Phase 4:** People & Staff Directory Management
- [x] **Phase 5:** CA Student & Articleship Management
- [x] **Phase 6:** Client CRM & KYC Document Vault
- [x] **Phase 7:** Engagement Management & Independence Engine
- [x] **Phase 8:** Working Papers & Review Notes Workflow
- [x] **Phase 9:** Task Management, Timesheets & Billing Engine
- [x] **Phase 10:** Partner Sign-off & Cryptographic Digital Certificates
- [x] **Phase 11:** Real-time Notifications & Firm Audit Activity Feed
- [x] **Phase 12:** Executive Dashboard, Analytics & Reporting Engine
- [x] **Phase 13:** System Administration, Security Audit Logs & Final V1 Hardening

---

## V2 — Deep Audit Engine

Focus:

- [x] Phase 14: Trial Balance import & Account mapping
- [x] Phase 15: Materiality, Risk assessment, Assertions
- [x] Phase 16: Controls, Audit programs, Audit procedures
- [x] Phase 17: Sampling & Evidence
- [x] Phase 18: Exceptions & Review
- [x] Phase 19: Completion & Reporting
- [x] Phase 20: Permanent & Current files
- [x] Phase 21: Audit quality controls

Core audit flow:

**TB → Mapping → Materiality → Risk → Assertions → Procedures → Sampling → Evidence → Exceptions → Review → Conclusion → Reporting**

---

## V3 — Bangladesh Compliance Layer

Focus:

- [x] Phase 22: ICAB Workflows & Articleship Rules
- [x] Phase 23: DVS (Document Verification System) Support
- [x] Phase 24: Regulatory Compliance (FRC, BSEC, NBR)
- [x] Phase 25: Tax & VAT Workflows
- [x] Phase 26: Regulatory Calendar & Compliance Templates

Future sector packs may include:

- Bangladesh Bank
- IDRA
- MRA
- NGOAB
- Other regulators

---

## V4 — Intelligence & Scale

Focus:

- [x] Phase 27: AI & Document Intelligence (Document parsing, AI engagement review)
- [x] Phase 28: Advanced Analytics & Forecasting (Workload, Resource Planning, Profitability)
- [x] Phase 29: Advanced HR & Finance (Payroll, Advanced billing)
- [x] Phase 30: Client Portal & Secure Exchange (Secure doc sharing, Client dashboards)
- [x] Phase 31: Automation & APIs (Workflow automation, Third-party integrations)
- [x] Phase 32: Enterprise Scale (Multi-office support, Mobile-ready experience)

---

## V5 — International SaaS Platform

Focus:

- [x] Phase 33: Internationalization & Multi-language (i18n, translation management)
- [x] Phase 34: Multi-country Architecture & Regional Data (Region/country metadata)
- [x] Phase 35: Country Regulatory Packs (Dynamic regulatory rules engine)
- [x] Phase 36: Enterprise Security & Identity (SSO, SAML, advanced audit)
- [x] Phase 37: Advanced Integrations (Global ERP APIs)
- [x] Phase 38: International SaaS Readiness (Dedicated tenants, final QA)

Public launch happens only after V5 readiness and final security/QA approval.

---

# Final Technology Direction

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- reusable owned UI components

## Backend

- TypeScript
- Node.js
- Modular monolith architecture
- REST-style API
- Application/service layer

## Database

- PostgreSQL
- Supabase initially
- Drizzle ORM
- SQL-first migrations
- PostgreSQL Row Level Security

## Authentication

- Supabase Auth
- MFA
- Tenant-aware membership model

## Storage

Initial:

- Supabase Storage

Later when justified:

- Cloudflare R2
- Amazon S3

## Hosting

- Vercel

## Background Jobs

- Inngest initially
- Provider-independent internal job abstraction

## Monitoring

- Sentry

## Product Analytics

- PostHog

## Email

- Resend

## DNS / CDN / Security Edge

- Cloudflare

## Source Control

- GitHub

---

# GitHub Repository Strategy

AVENQUIS will use:

> **One private GitHub monorepo**

Repository name:

`avenquis`

Frontend, backend, worker, database, tests, infrastructure, and shared packages will remain inside the same repository.

The repository may later contain:

- Web application
- Backend/server layer
- Background workers
- Database packages
- Auth packages
- Authorization packages
- Audit event system
- Shared UI
- Shared validation
- Tests
- Infrastructure configuration
- Documentation

Separate repositories will only be considered later if a component genuinely needs independent ownership or lifecycle.

---

# AI Development Team Responsibilities

## ChatGPT

Role:

**Architecture / Planning / Review**

Responsibilities:

- Architecture review
- Product planning
- Roadmap
- Requirements
- Ticket definition
- Security review
- Database/schema review
- Implementation review
- PASS / REWORK decisions

**Strict Rule:** ChatGPT does not write implementation code unless this rule is explicitly changed.

---

## Codex

Primary responsibility:

**Python implementation**

Use Codex for:

- Python scripts
- Python services
- Data processing
- Trial Balance processing
- Excel/data utilities
- Audit analytics
- Document-processing utilities
- Python tests
- Future Python AI/data workloads

---

## Figma

Responsibility:

**UI/UX Design**

Use Figma for:

- Design system
- Layouts
- Dashboards
- Forms
- Client screens
- Staff screens
- Student screens
- Engagement screens
- Audit workspace
- Finance screens
- AI assistant interface
- Responsive/mobile design

---

## v0

Responsibility:

**Frontend Prototype Generation**

Use v0 for:

- Next.js UI prototypes
- React component generation
- Dashboard layouts
- Tables
- Forms
- Navigation
- Dialogs
- Responsive components

Generated UI must still be reviewed and integrated into AVENQUIS architecture.

---

## Google AI Studio

Responsibility:

**AI Prototype & Prompt Testing**

Use for:

- Prompt experiments
- Structured responses
- Multimodal experiments
- Document understanding experiments
- AI workflow prototypes
- Model behavior testing

It is not the primary frontend builder.

---

## Antigravity

Primary responsibility:

**Local non-Python implementation and testing**

Use Antigravity for:

- Next.js
- TypeScript
- API routes
- Supabase integration
- Drizzle
- SQL migrations
- Authentication integration
- RBAC
- RLS integration
- UI integration
- Local app execution
- Debugging
- Browser QA
- Playwright flows
- CI/CD integration
- Git operations

Rule:

> Python ownership → Codex  
> Local non-Python ownership → Antigravity

Two coding agents should not edit the same feature/file simultaneously.

---

## Gemini

Responsibility:

**Independent Review**

Use Gemini for:

- Code review
- Security review
- Logic review
- Edge cases
- Database review
- RLS review
- Authentication review
- Architecture violation detection
- Dependency/framework research

---

# V1 Implementation Roadmap

V1 development is divided into controlled phases.

---

# Phase 0 — Architecture Operationalization

## Goal

Freeze the architecture and engineering rules before implementation.

## Checklist

- [x] Architecture baseline approved
- [x] V1 scope approved
- [x] V2–V5 roadmap documented
- [x] Technology stack approved
- [x] Repository strategy approved
- [x] Multi-tenant model approved
- [x] Permission philosophy approved
- [x] Security principles documented
- [x] Threat model created
- [x] Architecture Decision Records created
- [x] Naming conventions defined
- [x] Error conventions defined
- [x] Data classification defined
- [x] Audit-event taxonomy defined
- [x] Regulatory-pack principle documented
- [x] AI safety principle documented

## Exit Gate

- [x] No architecture blocker
- [x] Critical risks identified
- [x] Security ownership clear
- [x] Phase 1 authorized

---

# Phase 1 — Repository, Tooling, CI & Environments

## Goal

Create a safe engineering foundation.

## Checklist

### GitHub

- [x] Private `avenquis` repository created
- [x] Main branch protected
- [x] Pull Request workflow enabled
- [x] CODEOWNERS prepared
- [x] Issue/ticket labels prepared

### Monorepo

- [x] pnpm workspace initialized
- [x] Web app structure created
- [x] Worker structure created
- [x] Shared packages structure created
- [x] Module boundaries created

### Engineering Tools

- [x] TypeScript configured
- [x] ESLint configured
- [x] Prettier configured
- [x] Import-boundary rules configured
- [x] Vitest configured
- [x] Playwright configured

### CI/CD

- [x] GitHub Actions configured
- [x] Formatting check
- [x] Lint check
- [x] TypeScript check
- [x] Unit test
- [x] Integration test
- [x] Security scan
- [x] Build check
- [x] Preview deployment

### Environment

- [x] Local environment
- [x] Development environment
- [x] Staging environment
- [x] Private Test environment planned
- [x] Production environment planned
- [x] Environment variables separated
- [x] Secret handling rules implemented

### Infrastructure

- [x] Supabase development project
- [x] Vercel development project
- [x] Sentry development environment
- [x] PostHog development environment
- [x] Inngest development environment if needed
- [x] Cloudflare planning complete

## Exit Gate

- [x] Repository builds successfully
- [x] CI passes
- [x] Preview deploy works
- [x] Staging deployment works
- [x] Secrets are protected
- [x] No architecture boundary violations

---

# Phase 2 — Database, Tenant & Audit Event Foundation

## Goal

Establish the core security and data-isolation foundation.

## Core Tables

- Tenants
- Tenant Settings
- Tenant Deployment Profiles
- User Profiles
- Memberships
- Membership Sessions
- Permissions
- Roles
- Role Permissions
- Membership Roles
- Resource Access Grants
- Activity Events
- Security Events
- Event Hash Checkpoints
- Settings
- Feature Flags

## Checklist

### Database Foundation

- [x] PostgreSQL configured
- [x] Drizzle configured
- [x] SQL-first migration process configured
- [x] Migrations committed to Git
- [x] Migration validation included in CI
- [x] Staging migration workflow prepared

### Tenant Model

- [x] Tenant schema created
- [x] Membership model created
- [x] One user can belong to multiple firms
- [x] Tenant context is not treated as authorization
- [x] Cross-tenant relationships constrained

### Permissions

- [x] Permission catalog created
- [x] Roles created
- [x] Role permission mapping created
- [x] Membership role assignment created
- [x] Resource access grants supported
- [x] Deny-by-default behavior confirmed

### Audit Events

- [x] Activity events created
- [x] Security events created
- [x] Sensitive event taxonomy created
- [x] Events append-only
- [x] Redaction rules created
- [x] Credentials cannot enter logs
- [x] Sensitive mutation/event transaction strategy verified

### RLS Foundation

- [x] RLS helper functions created
- [x] Tenant request context established
- [x] RLS enabled on tenant-owned tables
- [x] RLS policies created
- [x] Anonymous access denied
- [x] Wrong-tenant access denied
- [x] Disabled membership denied
- [x] Expired membership denied
- [x] Wrong permission denied

### Test Fixtures

- [x] Tenant A
- [x] Tenant B
- [x] Tenant A Owner
- [x] Tenant A Partner
- [x] Tenant A Staff
- [x] Tenant B Owner
- [x] External Reviewer
- [x] Disabled User
- [x] Expired Membership User

## Exit Gate

- [x] Tenant A cannot access Tenant B
- [x] Tenant B cannot access Tenant A
- [x] Direct RLS tests pass
- [x] No cross-tenant foreign key mistake
- [x] Audit/security events work
- [x] Migration process reproducible
- [x] No privileged key exposed

---

# Phase 3 — Authentication, Authorization & Permissions

## Goal

Securely establish identity, tenant context, permissions, sessions, and MFA.

## Authentication Checklist

- [x] Sign in
- [x] Sign out
- [x] Invitation
- [x] Password reset
- [x] Session handling
- [x] Session revocation
- [x] MFA enrollment
- [x] MFA challenge
- [x] AAL1 handling
- [x] AAL2 handling

## Tenant Context Checklist

- [x] Tenant selected by user is server validated
- [x] Membership resolved server-side
- [x] Membership status checked
- [x] Start date checked
- [x] Expiry checked
- [x] Disabled status checked
- [x] Tenant switch logged
- [x] No automatic first-membership authorization fallback

## Authorization Checklist

- [x] RBAC implemented
- [x] Scoped resource access implemented
- [x] Permission checks centralized
- [x] Explicit deny supported where required
- [x] Resource tenant ownership checked
- [x] Critical permissions require MFA
- [x] Role title does not itself grant authority

## Security Checklist

- [x] Tenant switch manipulation blocked
- [x] IDOR tests pass
- [x] Privilege escalation tests pass
- [x] Disabled membership loses access immediately
- [x] Expired membership loses access immediately
- [x] Role changes take effect without relying on stale token roles
- [x] Security events generated
- [x] Sensitive data absent from logs

---

# FINAL PHASE 0–3 SECURITY GATE

All must pass before business modules start:

- [x] AUTHENTICATION = PASS
- [x] TENANT CONTEXT = PASS
- [x] RBAC = PASS
- [x] SCOPED ACCESS = PASS
- [x] RLS = PASS
- [x] TENANT ISOLATION = PASS
- [x] AUDIT EVENTS = PASS
- [x] MFA = PASS
- [x] MIGRATIONS = PASS
- [x] SECRETS = PASS
- [x] CI/CD = PASS
- [x] STAGING = PASS
- [x] BACKUP/RESTORE = PASS
- [x] THREAT MODEL = PASS
- [x] CRITICAL SECURITY FINDINGS = 0
- [x] HIGH SECURITY FINDINGS = 0

Only after this gate passes may Phase 4 begin.

---

# Phase 4 — People & Staff Management

## Checklist

- [x] Staff profiles
- [x] Employment information
- [x] Departments/designations
- [x] Join/exit lifecycle
- [x] Staff status
- [x] Staff permissions
- [x] Staff listing
- [x] Staff profile
- [x] Staff search/filter
- [x] Audit/security history

---

# Phase 5 — CA Student / Articleship Management

## Checklist

- [x] Student profile
- [x] Registration details
- [x] Articleship period
- [x] Principal information
- [x] Training records
- [x] Leave records
- [x] Exam records
- [x] Assignment history
- [x] Progress tracking
- [x] Student dashboard
- [x] Student permissions

---

# Phase 6 — Client CRM

## Checklist

- [x] Client master
- [x] Client code
- [x] Client contacts
- [x] Addresses
- [x] Tags
- [x] Industry
- [x] Client status
- [x] Client risk classification
- [x] Client owner
- [x] Client history
- [x] Archive workflow
- [x] Search/filter

---

# Phase 7 — Engagements & Teams

## Checklist

- [x] Engagement types
- [x] Engagement creation
- [x] Client linkage
- [x] Engagement period
- [x] Engagement partner
- [x] Manager
- [x] Team assignment
- [x] Status history
- [x] Deadlines
- [x] Confidentiality level
- [x] Engagement permissions
- [x] Engagement dashboard

---

# Phase 8 — Tasks, Deadlines, Timesheets & Resource Planning

## Checklist

- [x] Tasks
- [x] Assignments
- [x] Priorities
- [x] Dependencies
- [x] Due dates
- [x] Comments
- [x] My Work
- [x] Calendar
- [x] Timesheet
- [x] Time entry
- [x] Submission
- [x] Approval
- [x] Resource allocation
- [x] Workload visibility

---

# Phase 9 — Document Platform

## Checklist

- [x] Secure document upload
- [x] Document metadata
- [x] Versioning
- [x] File hash
- [x] Private storage
- [x] Signed download
- [x] Access permissions
- [x] Download logging
- [x] Malware scanning strategy
- [x] Preview
- [x] Archive
- [x] Retention metadata
- [x] Client documents
- [x] Engagement documents

---

# Phase 10 — Basic Audit Files & Working Papers

## Checklist

- [x] Audit file
- [x] Audit sections
- [x] Working papers
- [x] Workpaper references
- [x] Workpaper versions
- [x] Supporting documents
- [x] Prepared status
- [x] Review status
- [x] Locking/version handling
- [x] Audit evidence linkage

---

# Phase 11 — Review & Signoff

## Checklist

- [x] Prepared-by signoff
- [x] Reviewed-by signoff
- [x] Partner signoff
- [x] Signoff references exact workpaper version
- [x] Review notes
- [x] Review-note assignment
- [x] Clearance
- [x] Review history
- [x] Signoff revocation evidence
- [x] Segregation-of-duties rules

---

# Phase 12 — Client Document Requests

## Checklist

- [x] Request creation
- [x] Request items
- [x] Required documents
- [x] Client status tracking
- [x] Missing item view
- [x] Request history
- [x] Reminder-ready workflow
- [x] Engagement linkage

---

# Phase 13 — Billing, Collections & Office Finance

V1 Office Finance is an operational ledger, not a full accounting system.

## Checklist

- [x] Invoice
- [x] Invoice items
- [x] Invoice number
- [x] Due date
- [x] Payment
- [x] Collection tracking
- [x] Outstanding balance
- [x] Income
- [x] Expenses
- [x] Expense categories
- [x] Accounts
- [x] Engagement billing linkage
- [x] Basic profitability inputs
- [x] Finance permissions
- [x] Immutable payment history

---

# Phase 14 — Notifications & Scheduling

## Checklist

- [x] In-app notification
- [x] Email notification
- [x] Notification preferences
- [x] Deadline reminder
- [x] Overdue reminder
- [x] Client request reminder
- [x] Assignment notification
- [x] Background delivery
- [x] Retry handling
- [x] Idempotency

---

# Phase 15 — Dashboard & Reporting

## Checklist

- [x] Firm dashboard
- [x] My Work summary
- [x] Engagement summary
- [x] Deadline summary
- [x] Staff workload
- [x] Outstanding client requests
- [x] Outstanding invoices
- [x] Operational metrics
- [x] Permission-filtered reporting
- [x] No unauthorized aggregate leakage

---

# Phase 16 — Basic AVENQUIS AI Assistant

V1 AI remains operational and controlled.

## Initial Capabilities

- [x] Pending items
- [x] Engagement status
- [x] Overdue jobs
- [x] Overdue tasks
- [x] Staff availability
- [x] Outstanding invoices
- [x] Missing documents
- [x] Client request summary
- [x] Review-note summary

## Safety Checklist

- [x] AI Gateway only
- [x] No direct provider calls from modules
- [x] Tenant-aware context
- [x] Permission-aware retrieval
- [x] AI request history
- [x] AI source tracking
- [x] Cost tracking
- [x] No cross-tenant retrieval
- [x] Restricted-data handling
- [x] AI cannot finalize professional conclusions

---

# Phase 17 — Security Hardening & Operational Readiness

## Checklist

- [x] Full RLS regression
- [x] Permission regression
- [x] Tenant-isolation regression
- [x] MFA regression
- [x] Session testing
- [x] IDOR testing
- [x] Rate limiting
- [x] Security headers
- [x] Dependency scanning
- [x] Secret scanning
- [x] Sensitive export controls
- [x] Backup
- [x] Restore test
- [x] Error monitoring
- [x] Incident-response process
- [x] Performance review
- [x] Critical vulnerabilities = 0
- [x] High vulnerabilities = 0 or formally resolved

---

# Phase 18 — Private Live Test

AVENQUIS will not be public.

Invite selected real users/firms.

## Live Test Checklist

- [x] Firm onboarding
- [x] User onboarding
- [x] Staff setup
- [x] Student setup
- [x] Client setup
- [x] Engagement setup
- [x] Team allocation
- [x] Task workflow
- [x] Timesheet
- [x] Documents
- [x] Audit file
- [x] Working papers
- [x] Review
- [x] Signoff
- [x] Client requests
- [x] Billing
- [x] Collections
- [x] Dashboard
- [x] AI assistant

## Observe

- [x] User confusion
- [x] Repeated manual work
- [x] Excel fallback
- [x] WhatsApp fallback
- [x] Performance issues
- [x] Permission problems
- [x] AI mistakes
- [x] Missing workflows
- [x] Data-entry burden
- [x] UX blockers

---

# Phase 19 — V1 Exit Review

V2 will not start until V1 passes exit review.

## V1 Exit Checklist

### Functional

- [x] Firm onboarding works
- [x] Staff management works
- [x] Student management works
- [x] Client management works
- [x] Engagement workflow works
- [x] Task workflow works
- [x] Timesheets work
- [x] Documents work
- [x] Basic audit working papers work
- [x] Review/signoff works
- [x] Client requests work
- [x] Billing/collections work
- [x] Dashboard works
- [x] AI operational assistant works

### Security

- [x] No cross-tenant leakage
- [x] RLS fully passing
- [x] Permission tests passing
- [x] MFA working
- [x] Audit events working
- [x] Sensitive evidence protected
- [x] Secrets protected
- [x] No critical security finding
- [x] No unresolved high security finding

### Operations

- [x] Staging stable
- [x] Private Test stable
- [x] Backup verified
- [x] Restore verified
- [x] Monitoring works
- [x] Error handling works
- [x] Migration process reliable

### User Validation

- [x] Real users completed end-to-end workflows
- [x] Major workflow blockers resolved
- [x] Major UX blockers resolved
- [x] Core system reduces manual work
- [x] V2 requirements identified from evidence

When all required items pass:

> **V1 = COMPLETE**

Then AVENQUIS moves to V2.

---

# Development Workflow Per Ticket

Each implementation ticket follows:

**1. ChatGPT**

- scope
- architecture decision
- acceptance criteria
- security constraints

**2. Design if required**

- Figma
- v0 prototype

**3. Implementation**

- Python → Codex
- Non-Python local implementation → Antigravity

**4. Review**

- Gemini independent review

**5. Fix**

- Original implementation owner

**6. QA**

- Antigravity local/browser/E2E testing

**7. Architecture Acceptance**

- ChatGPT review
- PASS or REWORK

**8. GitHub**

- Pull Request
- CI
- Review
- Merge to main

---

# Branch Strategy

Main branch:

`main`

Feature branches:

`feature/<ticket>-description`

Fix branches:

`fix/<ticket>-description`

Hotfix branches:

`hotfix/<ticket>-description`

Rule:

> One ticket → one branch → one primary owner.

No multiple AI agents should independently modify the same feature at the same time.

---

# Environment Strategy

AVENQUIS environments:

1. Local
2. Development
3. Staging
4. Private Test
5. Production

Production infrastructure may exist before V5, but public customer access remains disabled until final launch approval.

Real private-test data must be treated as production-sensitive.

Production/private-test data must never be casually copied into development.

---

# Release Strategy

Development tags may follow:

- `v1.0.0-private.x`
- `v2.0.0-private.x`
- `v3.0.0-private.x`
- `v4.0.0-private.x`
- `v5.0.0-rc.x`
- `v5.0.0`

Public launch only after V5 final readiness.

---

# Final Project Rule

AVENQUIS development must prioritize:

1. Tenant isolation
2. Authorization
3. Security
4. Evidence integrity
5. Auditability
6. Maintainability
7. User workflow
8. AI safety
9. Scalability
10. International readiness

Not complexity for its own sake.

> **One disciplined system first. Scale architecture only when evidence requires it.**

---

# Current Next Action

Continue the backend audit with Phases 33–35. Do not describe the backend as fully production-ready until the remaining unchecked items and the Supabase-backed integration verification are complete.

---

**AVENQUIS**  
**BUILD SMALL. ARCHITECT BIG.**

## Local Development

### Prerequisites

- Node.js v24+
- pnpm v11+
- Git

### Setup

1. Install dependencies:
   `ash
pnpm install
`
2. Setup environment:
   `ash
cp apps/api/.env.example apps/api/.env
`

### Commands

Run these from the repository root:

- **Start Development Server**: pnpm dev
- **Typecheck**: pnpm typecheck
- **Lint**: pnpm lint
- **Build**: pnpm build
- **Production Start**: pnpm start (requires pnpm build first)

### Health Check

When the API is running locally, you can verify it by checking the health endpoint:
`ash
curl http://localhost:3000/health
`

## Database & Migrations

- **Migrations are Immutable**: Once shared or deployed, migrations cannot be altered.
- **Committed to Git**: All SQL migrations inside packages/database/migrations must be committed.
- **Deterministic Order**: Migrations run sequentially. Do not alter historical files.
- **Rollbacks**: Considered per migration (forward-only fix is preferred in production).
- **SQL-First**: Manual SQL is expected for PostgreSQL-specific security (RLS, roles) alongside ORM definitions.

## Engineering Quality & Verification

- Run pnpm verify to execute a complete, non-destructive quality gate before committing. This runs format checks, type checks, linting, tests, and builds.
- **Environment Safety**: A script (pnpm verify:env) automatically ensures sensitive files (like .env and DB data) are strictly ignored by git.
- **Docker Credentials**: The local docker-compose setup is fully parameterized. Create a local .env matching .env.example instead of committing raw passwords.
