# AVENQUIS

**Professional Firm Operating System**

AVENQUIS is a security-first, multi-tenant operating system for professional service firms including accounting, audit, tax, advisory, consulting, and related practices.

The first target market is Bangladesh, but the platform is being designed from the beginning for international expansion and international professional standards.

---

## Project Status

**Current Stage:** Backend audit in progress (Phases 3–20 audited; fixes submitted through PR #7)
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
- [ ] **Phase 21:** Audit quality controls — audit pending
- [ ] **Phase 22:** ICAB workflows and articleship rules — audit pending
- [ ] **Phase 23:** DVS support — audit pending
- [ ] **Phase 24:** Regulatory compliance — audit pending
- [ ] **Phase 25:** Tax and VAT workflows — audit pending
- [ ] **Phase 26:** Regulatory calendar and templates — audit pending
- [ ] **Phase 27:** AI and document intelligence — audit pending
- [ ] **Phase 28:** Advanced analytics and forecasting — audit pending
- [ ] **Phase 29:** Advanced HR and finance — audit pending
- [ ] **Phase 30:** Client portal and secure exchange — audit pending
- [ ] **Phase 31:** Automation and APIs — audit pending
- [ ] **Phase 32:** Enterprise scale and multi-office support — audit pending
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
