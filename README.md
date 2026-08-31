# AVENQUIS

**Professional Firm Operating System**

AVENQUIS is a security-first, multi-tenant operating system for professional service firms including accounting, audit, tax, advisory, consulting, and related practices.

The first target market is Bangladesh, but the platform is being designed from the beginning for international expansion and international professional standards.

---

## Project Status

**Current Stage:** V1 Foundation & Private Development  
**Public Launch:** After V5 only  
**Development Model:** Build → Private Test → Improve → Next Version → Final QA → Launch

**Planning Baseline Finalized:**  
**Date:** Monday, 31 August 2026  
**Time:** 1:23 PM  
**Timezone:** Bangladesh Standard Time (UTC+6)

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

## V1 — Core Firm OS

Goal:

> A real professional firm should be able to perform its core daily operations inside AVENQUIS.

V1 includes:

- Authentication
- Tenant/Firm setup
- Users
- Roles & Permissions
- Staff
- CA Students / Articleship
- Client CRM
- Engagements
- Tasks
- Deadlines
- Timesheets
- Resource allocation
- Secure documents
- Basic audit files
- Working papers
- Review notes
- Prepared/Reviewed workflows
- Client document requests
- Billing
- Collections
- Office finance
- Notifications
- Dashboard
- Basic AI assistant
- Activity & security logs
- Private live testing

---

## V2 — Deep Audit Engine

Focus:

- Trial Balance import
- Account mapping
- Materiality
- Risk assessment
- Assertions
- Controls
- Audit programs
- Audit procedures
- Sampling
- Evidence
- Exceptions
- Review
- Completion
- Reporting
- Permanent file
- Current file
- Audit quality controls

Core audit flow:

**TB → Mapping → Materiality → Risk → Assertions → Procedures → Sampling → Evidence → Exceptions → Review → Conclusion → Reporting**

---

## V3 — Bangladesh Compliance Layer

Focus:

- ICAB workflows
- FRC requirements
- BSEC requirements
- NBR requirements
- DVS workflow support
- Articleship rules
- Tax/VAT workflow
- Regulatory calendar
- Independence checks
- Conflict checks
- Quality management
- Compliance templates

Future sector packs may include:

- Bangladesh Bank
- IDRA
- MRA
- NGOAB
- Other regulators

---

## V4 — Intelligence & Scale

Focus:

- Advanced AI
- AI engagement review
- Document intelligence
- Advanced analytics
- Workload forecasting
- Resource planning
- Engagement profitability
- Advanced HR
- Advanced finance
- Client portal
- Secure client exchange
- Automation
- APIs
- Integrations
- Multi-office support
- Mobile-ready experience

---

## V5 — International SaaS Platform

Focus:

- Multi-country architecture
- Country regulatory packs
- Internationalization
- Multi-language
- Enterprise permissions
- Enterprise identity
- Regional deployment options
- Dedicated tenant options
- Advanced integrations
- Enterprise security
- International SaaS readiness

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

- [ ] Architecture baseline approved
- [ ] V1 scope approved
- [ ] V2–V5 roadmap documented
- [ ] Technology stack approved
- [ ] Repository strategy approved
- [ ] Multi-tenant model approved
- [ ] Permission philosophy approved
- [ ] Security principles documented
- [ ] Threat model created
- [ ] Architecture Decision Records created
- [ ] Naming conventions defined
- [ ] Error conventions defined
- [ ] Data classification defined
- [ ] Audit-event taxonomy defined
- [ ] Regulatory-pack principle documented
- [ ] AI safety principle documented

## Exit Gate

- [ ] No architecture blocker
- [ ] Critical risks identified
- [ ] Security ownership clear
- [ ] Phase 1 authorized

---

# Phase 1 — Repository, Tooling, CI & Environments

## Goal

Create a safe engineering foundation.

## Checklist

### GitHub

- [ ] Private `avenquis` repository created
- [ ] Main branch protected
- [ ] Pull Request workflow enabled
- [ ] CODEOWNERS prepared
- [ ] Issue/ticket labels prepared

### Monorepo

- [ ] pnpm workspace initialized
- [ ] Web app structure created
- [ ] Worker structure created
- [ ] Shared packages structure created
- [ ] Module boundaries created

### Engineering Tools

- [ ] TypeScript configured
- [ ] ESLint configured
- [ ] Prettier configured
- [ ] Import-boundary rules configured
- [ ] Vitest configured
- [ ] Playwright configured

### CI/CD

- [ ] GitHub Actions configured
- [ ] Formatting check
- [ ] Lint check
- [ ] TypeScript check
- [ ] Unit test
- [ ] Integration test
- [ ] Security scan
- [ ] Build check
- [ ] Preview deployment

### Environment

- [ ] Local environment
- [ ] Development environment
- [ ] Staging environment
- [ ] Private Test environment planned
- [ ] Production environment planned
- [ ] Environment variables separated
- [ ] Secret handling rules implemented

### Infrastructure

- [ ] Supabase development project
- [ ] Vercel development project
- [ ] Sentry development environment
- [ ] PostHog development environment
- [ ] Inngest development environment if needed
- [ ] Cloudflare planning complete

## Exit Gate

- [ ] Repository builds successfully
- [ ] CI passes
- [ ] Preview deploy works
- [ ] Staging deployment works
- [ ] Secrets are protected
- [ ] No architecture boundary violations

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

- [ ] PostgreSQL configured
- [ ] Drizzle configured
- [ ] SQL-first migration process configured
- [ ] Migrations committed to Git
- [ ] Migration validation included in CI
- [ ] Staging migration workflow prepared

### Tenant Model

- [ ] Tenant schema created
- [ ] Membership model created
- [ ] One user can belong to multiple firms
- [ ] Tenant context is not treated as authorization
- [ ] Cross-tenant relationships constrained

### Permissions

- [ ] Permission catalog created
- [ ] Roles created
- [ ] Role permission mapping created
- [ ] Membership role assignment created
- [ ] Resource access grants supported
- [ ] Deny-by-default behavior confirmed

### Audit Events

- [ ] Activity events created
- [ ] Security events created
- [ ] Sensitive event taxonomy created
- [ ] Events append-only
- [ ] Redaction rules created
- [ ] Credentials cannot enter logs
- [ ] Sensitive mutation/event transaction strategy verified

### RLS Foundation

- [ ] RLS helper functions created
- [ ] Tenant request context established
- [ ] RLS enabled on tenant-owned tables
- [ ] RLS policies created
- [ ] Anonymous access denied
- [ ] Wrong-tenant access denied
- [ ] Disabled membership denied
- [ ] Expired membership denied
- [ ] Wrong permission denied

### Test Fixtures

- [ ] Tenant A
- [ ] Tenant B
- [ ] Tenant A Owner
- [ ] Tenant A Partner
- [ ] Tenant A Staff
- [ ] Tenant B Owner
- [ ] External Reviewer
- [ ] Disabled User
- [ ] Expired Membership User

## Exit Gate

- [ ] Tenant A cannot access Tenant B
- [ ] Tenant B cannot access Tenant A
- [ ] Direct RLS tests pass
- [ ] No cross-tenant foreign key mistake
- [ ] Audit/security events work
- [ ] Migration process reproducible
- [ ] No privileged key exposed

---

# Phase 3 — Authentication, Authorization & Permissions

## Goal

Securely establish identity, tenant context, permissions, sessions, and MFA.

## Authentication Checklist

- [ ] Sign in
- [ ] Sign out
- [ ] Invitation
- [ ] Password reset
- [ ] Session handling
- [ ] Session revocation
- [ ] MFA enrollment
- [ ] MFA challenge
- [ ] AAL1 handling
- [ ] AAL2 handling

## Tenant Context Checklist

- [ ] Tenant selected by user is server validated
- [ ] Membership resolved server-side
- [ ] Membership status checked
- [ ] Start date checked
- [ ] Expiry checked
- [ ] Disabled status checked
- [ ] Tenant switch logged
- [ ] No automatic first-membership authorization fallback

## Authorization Checklist

- [ ] RBAC implemented
- [ ] Scoped resource access implemented
- [ ] Permission checks centralized
- [ ] Explicit deny supported where required
- [ ] Resource tenant ownership checked
- [ ] Critical permissions require MFA
- [ ] Role title does not itself grant authority

## Security Checklist

- [ ] Tenant switch manipulation blocked
- [ ] IDOR tests pass
- [ ] Privilege escalation tests pass
- [ ] Disabled membership loses access immediately
- [ ] Expired membership loses access immediately
- [ ] Role changes take effect without relying on stale token roles
- [ ] Security events generated
- [ ] Sensitive data absent from logs

---

# FINAL PHASE 0–3 SECURITY GATE

All must pass before business modules start:

- [ ] AUTHENTICATION = PASS
- [ ] TENANT CONTEXT = PASS
- [ ] RBAC = PASS
- [ ] SCOPED ACCESS = PASS
- [ ] RLS = PASS
- [ ] TENANT ISOLATION = PASS
- [ ] AUDIT EVENTS = PASS
- [ ] MFA = PASS
- [ ] MIGRATIONS = PASS
- [ ] SECRETS = PASS
- [ ] CI/CD = PASS
- [ ] STAGING = PASS
- [ ] BACKUP/RESTORE = PASS
- [ ] THREAT MODEL = PASS
- [ ] CRITICAL SECURITY FINDINGS = 0
- [ ] HIGH SECURITY FINDINGS = 0

Only after this gate passes may Phase 4 begin.

---

# Phase 4 — People & Staff Management

## Checklist

- [ ] Staff profiles
- [ ] Employment information
- [ ] Departments/designations
- [ ] Join/exit lifecycle
- [ ] Staff status
- [ ] Staff permissions
- [ ] Staff listing
- [ ] Staff profile
- [ ] Staff search/filter
- [ ] Audit/security history

---

# Phase 5 — CA Student / Articleship Management

## Checklist

- [ ] Student profile
- [ ] Registration details
- [ ] Articleship period
- [ ] Principal information
- [ ] Training records
- [ ] Leave records
- [ ] Exam records
- [ ] Assignment history
- [ ] Progress tracking
- [ ] Student dashboard
- [ ] Student permissions

---

# Phase 6 — Client CRM

## Checklist

- [ ] Client master
- [ ] Client code
- [ ] Client contacts
- [ ] Addresses
- [ ] Tags
- [ ] Industry
- [ ] Client status
- [ ] Client risk classification
- [ ] Client owner
- [ ] Client history
- [ ] Archive workflow
- [ ] Search/filter

---

# Phase 7 — Engagements & Teams

## Checklist

- [ ] Engagement types
- [ ] Engagement creation
- [ ] Client linkage
- [ ] Engagement period
- [ ] Engagement partner
- [ ] Manager
- [ ] Team assignment
- [ ] Status history
- [ ] Deadlines
- [ ] Confidentiality level
- [ ] Engagement permissions
- [ ] Engagement dashboard

---

# Phase 8 — Tasks, Deadlines, Timesheets & Resource Planning

## Checklist

- [ ] Tasks
- [ ] Assignments
- [ ] Priorities
- [ ] Dependencies
- [ ] Due dates
- [ ] Comments
- [ ] My Work
- [ ] Calendar
- [ ] Timesheet
- [ ] Time entry
- [ ] Submission
- [ ] Approval
- [ ] Resource allocation
- [ ] Workload visibility

---

# Phase 9 — Document Platform

## Checklist

- [ ] Secure document upload
- [ ] Document metadata
- [ ] Versioning
- [ ] File hash
- [ ] Private storage
- [ ] Signed download
- [ ] Access permissions
- [ ] Download logging
- [ ] Malware scanning strategy
- [ ] Preview
- [ ] Archive
- [ ] Retention metadata
- [ ] Client documents
- [ ] Engagement documents

---

# Phase 10 — Basic Audit Files & Working Papers

## Checklist

- [ ] Audit file
- [ ] Audit sections
- [ ] Working papers
- [ ] Workpaper references
- [ ] Workpaper versions
- [ ] Supporting documents
- [ ] Prepared status
- [ ] Review status
- [ ] Locking/version handling
- [ ] Audit evidence linkage

---

# Phase 11 — Review & Signoff

## Checklist

- [ ] Prepared-by signoff
- [ ] Reviewed-by signoff
- [ ] Partner signoff
- [ ] Signoff references exact workpaper version
- [ ] Review notes
- [ ] Review-note assignment
- [ ] Clearance
- [ ] Review history
- [ ] Signoff revocation evidence
- [ ] Segregation-of-duties rules

---

# Phase 12 — Client Document Requests

## Checklist

- [ ] Request creation
- [ ] Request items
- [ ] Required documents
- [ ] Client status tracking
- [ ] Missing item view
- [ ] Request history
- [ ] Reminder-ready workflow
- [ ] Engagement linkage

---

# Phase 13 — Billing, Collections & Office Finance

V1 Office Finance is an operational ledger, not a full accounting system.

## Checklist

- [ ] Invoice
- [ ] Invoice items
- [ ] Invoice number
- [ ] Due date
- [ ] Payment
- [ ] Collection tracking
- [ ] Outstanding balance
- [ ] Income
- [ ] Expenses
- [ ] Expense categories
- [ ] Accounts
- [ ] Engagement billing linkage
- [ ] Basic profitability inputs
- [ ] Finance permissions
- [ ] Immutable payment history

---

# Phase 14 — Notifications & Scheduling

## Checklist

- [ ] In-app notification
- [ ] Email notification
- [ ] Notification preferences
- [ ] Deadline reminder
- [ ] Overdue reminder
- [ ] Client request reminder
- [ ] Assignment notification
- [ ] Background delivery
- [ ] Retry handling
- [ ] Idempotency

---

# Phase 15 — Dashboard & Reporting

## Checklist

- [ ] Firm dashboard
- [ ] My Work summary
- [ ] Engagement summary
- [ ] Deadline summary
- [ ] Staff workload
- [ ] Outstanding client requests
- [ ] Outstanding invoices
- [ ] Operational metrics
- [ ] Permission-filtered reporting
- [ ] No unauthorized aggregate leakage

---

# Phase 16 — Basic AVENQUIS AI Assistant

V1 AI remains operational and controlled.

## Initial Capabilities

- [ ] Pending items
- [ ] Engagement status
- [ ] Overdue jobs
- [ ] Overdue tasks
- [ ] Staff availability
- [ ] Outstanding invoices
- [ ] Missing documents
- [ ] Client request summary
- [ ] Review-note summary

## Safety Checklist

- [ ] AI Gateway only
- [ ] No direct provider calls from modules
- [ ] Tenant-aware context
- [ ] Permission-aware retrieval
- [ ] AI request history
- [ ] AI source tracking
- [ ] Cost tracking
- [ ] No cross-tenant retrieval
- [ ] Restricted-data handling
- [ ] AI cannot finalize professional conclusions

---

# Phase 17 — Security Hardening & Operational Readiness

## Checklist

- [ ] Full RLS regression
- [ ] Permission regression
- [ ] Tenant-isolation regression
- [ ] MFA regression
- [ ] Session testing
- [ ] IDOR testing
- [ ] Rate limiting
- [ ] Security headers
- [ ] Dependency scanning
- [ ] Secret scanning
- [ ] Sensitive export controls
- [ ] Backup
- [ ] Restore test
- [ ] Error monitoring
- [ ] Incident-response process
- [ ] Performance review
- [ ] Critical vulnerabilities = 0
- [ ] High vulnerabilities = 0 or formally resolved

---

# Phase 18 — Private Live Test

AVENQUIS will not be public.

Invite selected real users/firms.

## Live Test Checklist

- [ ] Firm onboarding
- [ ] User onboarding
- [ ] Staff setup
- [ ] Student setup
- [ ] Client setup
- [ ] Engagement setup
- [ ] Team allocation
- [ ] Task workflow
- [ ] Timesheet
- [ ] Documents
- [ ] Audit file
- [ ] Working papers
- [ ] Review
- [ ] Signoff
- [ ] Client requests
- [ ] Billing
- [ ] Collections
- [ ] Dashboard
- [ ] AI assistant

## Observe

- [ ] User confusion
- [ ] Repeated manual work
- [ ] Excel fallback
- [ ] WhatsApp fallback
- [ ] Performance issues
- [ ] Permission problems
- [ ] AI mistakes
- [ ] Missing workflows
- [ ] Data-entry burden
- [ ] UX blockers

---

# Phase 19 — V1 Exit Review

V2 will not start until V1 passes exit review.

## V1 Exit Checklist

### Functional

- [ ] Firm onboarding works
- [ ] Staff management works
- [ ] Student management works
- [ ] Client management works
- [ ] Engagement workflow works
- [ ] Task workflow works
- [ ] Timesheets work
- [ ] Documents work
- [ ] Basic audit working papers work
- [ ] Review/signoff works
- [ ] Client requests work
- [ ] Billing/collections work
- [ ] Dashboard works
- [ ] AI operational assistant works

### Security

- [ ] No cross-tenant leakage
- [ ] RLS fully passing
- [ ] Permission tests passing
- [ ] MFA working
- [ ] Audit events working
- [ ] Sensitive evidence protected
- [ ] Secrets protected
- [ ] No critical security finding
- [ ] No unresolved high security finding

### Operations

- [ ] Staging stable
- [ ] Private Test stable
- [ ] Backup verified
- [ ] Restore verified
- [ ] Monitoring works
- [ ] Error handling works
- [ ] Migration process reliable

### User Validation

- [ ] Real users completed end-to-end workflows
- [ ] Major workflow blockers resolved
- [ ] Major UX blockers resolved
- [ ] Core system reduces manual work
- [ ] V2 requirements identified from evidence

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

**Begin AVENQUIS V1 Phase 0–3 implementation.**

Business modules must not begin until the Phase 0–3 security gate passes.

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
