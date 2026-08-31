export interface MetricItem {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  highlight: string;
  description: string;
}

export interface ModulePillar {
  id: string;
  number: string;
  title: string;
  category: string;
  headline: string;
  description: string;
  badge: {
    label: string;
    bg: string;
    text: string;
    border: string;
  };
  keyFeatures: string[];
  metrics: string;
  previewSnippet: {
    type: "audit" | "crm" | "timesheet" | "finance" | "people" | "ai";
    label: string;
    status: string;
  };
}

export interface ArchitectureInvariant {
  id: string;
  code: string;
  title: string;
  description: string;
  standardCitation: string;
  securityImpact: string;
}

export interface FaqItem {
  question: string;
  answer: string;
  category:
    | "Compliance & Security"
    | "Operations & Billing"
    | "AI & Privacy"
    | "Onboarding";
}

export const LANDING_NAV_LINKS = [
  { id: "features", label: "Features", href: "#features" },
  { id: "modules", label: "Core Modules", href: "#modules" },
  {
    id: "architecture",
    label: "Architecture & Security",
    href: "#architecture",
  },
  { id: "pricing", label: "Roadmap & Pricing", href: "#pricing" },
  { id: "faq", label: "FAQ", href: "#faq" },
];

export const TRUST_METRICS: MetricItem[] = [
  {
    id: "rls",
    title: "Multi-Tenant Isolation",
    subtitle: "Strict PostgreSQL RLS",
    tag: "Zero Cross-Tenant Leakage",
    highlight: "100% Isolated",
    description:
      "Every SQL query executes inside an active tenant transaction with fail-closed cryptographic boundaries.",
  },
  {
    id: "immutable",
    title: "Immutable Evidence",
    subtitle: "Versioned Sign-Offs & Hashes",
    tag: "ISA 220 & ISA 230 Compliant",
    highlight: "SHA-256 Seals",
    description:
      "Working paper revisions, partner reviews, and sign-offs are cryptographically sealed with permanent audit trails.",
  },
  {
    id: "controlled-ai",
    title: "Controlled AI Assistant",
    subtitle: "Human-in-the-Loop Protocol",
    tag: "Zero Training on Client Data",
    highlight: "Read-Only Context",
    description:
      "AI assists with PBC checklists and working paper summaries within isolated tenant boundaries. Only authorized humans sign off.",
  },
  {
    id: "bd-first",
    title: "Chartered Firm Specialized",
    subtitle: "ICAB & NBR Regulatory Ready",
    tag: "Statutory Standards Built-in",
    highlight: "Bangladesh & Global",
    description:
      "Pre-configured for local 15% VAT, TDS withholding rules, and international ISA audit governance.",
  },
];

export const CORE_MODULES: ModulePillar[] = [
  {
    id: "firm-people",
    number: "01",
    title: "Firm OS & People",
    category: "Practice Governance",
    headline:
      "Chartered practice hierarchy, student articleship tracking, and capacity allocations.",
    description:
      "Manage partner equity allocations, manager portfolios, senior auditors, and CA article student registration periods. Monitor statutory leaves, ICAB training records, and active utilization.",
    badge: {
      label: "Staff & Roles",
      bg: "#E1F3EE",
      text: "#1F5946",
      border: "#C8E9DE",
    },
    keyFeatures: [
      "Role-based security tiers (Managing Partner to Article Student)",
      "CA Articleship term tracking with ICAB registration numbers",
      "Leave authorization pipeline with partner multi-level sign-offs",
      "Live team availability and weekly capacity heatmaps",
    ],
    metrics: "99.4% Resource Utilization",
    previewSnippet: {
      type: "people",
      label: "Partner & Senior Staff Directory",
      status: "Active Hierarchy",
    },
  },
  {
    id: "client-crm",
    number: "02",
    title: "Client CRM & Engagements",
    category: "Engagement Lifecycle",
    headline:
      "Statutory audit, tax filing, and advisory pipelines with strict stage gates.",
    description:
      "Track client KYC, beneficial ownership registers, and engagement life cycles across six standardized audit phases from Engagement Acceptance to Final Opinion & Seal.",
    badge: {
      label: "Audit & Tax CRM",
      bg: "#FCEFD9",
      text: "#8A5A18",
      border: "#F8DCB4",
    },
    keyFeatures: [
      "Stage-gate milestone tracking (Planning, Fieldwork, Review, Sign-off)",
      "Client document portal with encrypted PBC requests",
      "Risk classification matrix (High, Medium, Normal) & materiality thresholds",
      "Multi-entity corporate group hierarchies and TIN/BIN registries",
    ],
    metrics: "6-Phase Standardized Gate",
    previewSnippet: {
      type: "crm",
      label: "Beximco Pharma Statutory Audit FY25",
      status: "Fieldwork (65%)",
    },
  },
  {
    id: "tasks-timesheets",
    number: "03",
    title: "Tasks & Timesheets",
    category: "Productivity & WIP",
    headline:
      "Time tracking linked directly to billable engagement codes and real-time WIP.",
    description:
      "Eliminate untracked hours. Staff log daily activities directly against engagement milestones, providing instant work-in-progress (WIP) valuation and partner timesheet approvals.",
    badge: {
      label: "Billable Tracking",
      bg: "#E2F1F8",
      text: "#1D526D",
      border: "#C7E4F2",
    },
    keyFeatures: [
      "Weekly interactive timesheet grid with rapid bulk log entries",
      "Direct conversion from approved hours into client tax invoices",
      "Overtime calculations and non-billable training categorization",
      "Engagement budget variance alerts before cost overruns occur",
    ],
    metrics: "100% Billable Capture",
    previewSnippet: {
      type: "timesheet",
      label: "Weekly Timesheet • 42.5 Billable Hrs",
      status: "Partner Approved",
    },
  },
  {
    id: "audit-papers",
    number: "04",
    title: "Audit Working Papers",
    category: "ISA & ICAB Compliance",
    headline:
      "Permanent & current audit files, immutable versioning, and SHA-256 seals.",
    description:
      "The core audit execution engine. Standardized ISA working paper templates, automated sample size calculators, tickmark registries, review note resolution, and two-partner cryptographic sign-offs.",
    badge: {
      label: "ISA 220 & 230",
      bg: "#FAF0DE",
      text: "#94631D",
      border: "#E8D5B5",
    },
    keyFeatures: [
      "Permanent vs. Current audit file structuring (ISA 230)",
      "Materiality benchmarks & monetary unit sampling calculators",
      "Tickmark legend & cross-referencing between lead schedules",
      "Cryptographic SHA-256 digital signature seals with QR verification",
    ],
    metrics: "SHA-256 Sealed Files",
    previewSnippet: {
      type: "audit",
      label: "WP-REV-01 • Revenue Substantive Testing",
      status: "Signed Off • SHA-256 Sealed",
    },
  },
  {
    id: "finance-billing",
    number: "05",
    title: "Office Finance & Invoicing",
    category: "Firm Cash Flow",
    headline:
      "Statutory VAT invoicing, bank money receipts, and automated fee collections.",
    description:
      "Designed for professional firm billing dynamics. Generate milestone or hourly fee tax invoices with 15% statutory VAT calculations, record BEFTN/RTGS collections, and track aged receivables.",
    badge: {
      label: "Ledger & VAT",
      bg: "#FDE6E2",
      text: "#8E362C",
      border: "#F9CCC4",
    },
    keyFeatures: [
      "15% VAT & statutory tax invoice generation with official crest",
      "One-click invoice generation from unbilled staff timesheet hours",
      "Operating money receipts ledger with BEFTN & cheque reconciliation",
      "Aged debtor analysis (0-30, 31-60, 61-90, 90+ days overdue)",
    ],
    metrics: "15% VAT Ready & Reconciled",
    previewSnippet: {
      type: "finance",
      label: "Invoice #INV-2026-081 • BDT 1,150,000",
      status: "Dispatched & Cleared",
    },
  },
  {
    id: "ai-copilot",
    number: "06",
    title: "Permission-Safe AI Copilot",
    category: "Intelligent Assistance",
    headline:
      "Context-protected assistant for instant review summaries and PBC drafting.",
    description:
      "An intelligent in-app companion operating strictly in read-only tenant boundaries. Drafts ISA 500-compliant client reminder notices, flags overdue audit checklist items, and calculates WIP balances.",
    badge: {
      label: "Safe Intelligence",
      bg: "#EDE9FE",
      text: "#5B21B6",
      border: "#DDD6FE",
    },
    keyFeatures: [
      "Zero external data transmission: firm files remain strictly private",
      "Instant ISA 220 review queue summarization and blocker identification",
      "Automated PBC reminder email drafting with specific missing documents",
      "One-click navigation directly to affected working papers and ledgers",
    ],
    metrics: "Strict Read-Only Scope",
    previewSnippet: {
      type: "ai",
      label: "AI Audit Review Summary",
      status: "3 Sign-offs Pending",
    },
  },
];

export const ARCHITECTURE_INVARIANTS: ArchitectureInvariant[] = [
  {
    id: "rls-isolation",
    code: "SEC-INV-01",
    title: "PostgreSQL Row Level Security (RLS)",
    description:
      "Every single SQL query executed by the backend is parameterized with the authenticated tenant ID. Hardware-enforced kernel-level database filters guarantee zero cross-tenant data visibility.",
    standardCitation: "ISO 27001 § A.9.4 & SOC 2 CC6.1",
    securityImpact: "Guaranteed Multi-Tenant Isolation",
  },
  {
    id: "immutable-audit-trail",
    code: "SEC-INV-02",
    title: "Cryptographic Hash-Chained Audit Logs",
    description:
      "Every working paper review, document upload, status transition, and financial transaction creates an append-only log record signed with SHA-256 hashes, preventing retro-active alteration.",
    standardCitation: "ISA 230 (Audit Documentation) & ISA 220",
    securityImpact: "Tamper-Proof Working Papers",
  },
  {
    id: "human-in-loop-ai",
    code: "SEC-INV-03",
    title: 'Controlled AI "Human-in-the-Loop" Gate',
    description:
      "The AI copilot operates under strict read-only context boundaries. AI can analyze, summarize, and draft recommendations, but cannot finalize working papers or issue invoices without partner approval.",
    standardCitation: "IAASB Guidance on Emerging Technologies",
    securityImpact: "Professional Skepticism Preserved",
  },
  {
    id: "zero-trust-auth",
    code: "SEC-INV-04",
    title: "Zero-Trust Session Isolation & TOTP MFA",
    description:
      "Multi-factor authentication enforced for senior review personnel. Real-time active session monitoring allows instantaneous device revocation across the practice network.",
    standardCitation: "NIST SP 800-63B Authenticator Assurance",
    securityImpact: "Enterprise Access Hardening",
  },
];

export const PRICING_ROADMAP = [
  {
    id: "private-testing",
    badge: "Current Stage (Private V1)",
    name: "Private Firm Deployment",
    price: "Invited Practice Alpha",
    period: "Exclusive Pilot",
    description:
      "Dedicated instance deployment for invited chartered accountancy & consulting practices.",
    featured: true,
    features: [
      "Full Access to all 6 Core Modules",
      "Unlimited Engagements, Clients & Working Papers",
      "Up to 50 Staff & CA Article Students",
      "ICAB & ISA 220 Working Paper Checklists",
      "Statutory 15% VAT & Operating Finance Ledger",
      "Dedicated Migration Concierge (Excel / Legacy tools)",
      "Direct Weekly Feature Requests with Engineering Team",
    ],
    ctaText: "Start Private Testing",
    note: "Active for verified accounting practices during current deployment phase.",
  },
  {
    id: "public-saas",
    badge: "Upcoming Public Release",
    name: "Enterprise Multi-Office",
    price: "$49",
    period: "/ seat / month",
    description:
      "Scale multi-branch chartered firms and corporate advisory groups across regional offices.",
    featured: false,
    features: [
      "Everything in Private Practice Edition",
      "Multi-Branch & Multi-Tenant Practice Consolidation",
      "Custom ERP, Banking & Tax Portal Integrations",
      "Dedicated VPC or On-Premise Container Option",
      "SSO (SAML 2.0 / Okta / Azure AD)",
      "24/7 Dedicated Partner SLA & Security Audits",
      "Automated NBR Return Dispatch Connectors",
    ],
    ctaText: "Request Enterprise Briefing",
    note: "Public SaaS rollout scheduled following V5 deployment milestone.",
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    category: "Compliance & Security",
    question:
      "How does AVENQUIS comply with ICAB and International Standards on Auditing (ISA)?",
    answer:
      "AVENQUIS is engineered from the ground up to support ISA 220 (Quality Management for an Audit of Financial Statements) and ISA 230 (Audit Documentation). Working papers feature immutable version logs, mandatory partner review sign-offs, tickmark documentation, and cryptographic SHA-256 seals.",
  },
  {
    category: "Compliance & Security",
    question: "Where is firm and client financial data stored?",
    answer:
      "All practice data is hosted in high-security, ISO 27001-certified cloud infrastructure with PostgreSQL Row-Level Security (RLS) guaranteeing strict tenant isolation. Data is encrypted at rest using AES-256 and in transit via TLS 1.3.",
  },
  {
    category: "AI & Privacy",
    question:
      "Does the AI Copilot use our confidential audit working papers to train public models?",
    answer:
      "No. The AI Copilot operates strictly in a read-only, ephemeral context window. Your working papers, client financials, and internal notes are never used for model training or shared across tenants.",
  },
  {
    category: "Operations & Billing",
    question:
      "Can we convert unbilled staff timesheet hours into client fee invoices automatically?",
    answer:
      "Yes. The Office Finance & Invoicing engine directly aggregates approved staff billable hours for active engagements, allows custom billing rates, applies the statutory 15% VAT, and generates official ICAB-compliant fee tax invoices with one click.",
  },
  {
    category: "Onboarding",
    question:
      "How do we migrate our existing Excel audit working papers and client rosters into AVENQUIS?",
    answer:
      "AVENQUIS provides built-in CSV/Excel data import utilities for client records, active engagements, and staff lists. During the Private Testing phase, our technical team provides complimentary white-glove migration assistance.",
  },
  {
    category: "Operations & Billing",
    question:
      "How does CA student articleship tracking work within the system?",
    answer:
      "The Firm OS & People module maintains records of student registration numbers, principal partner assignments, required articleship duration (e.g. 3 or 4 years), leave allowances, and mandatory training milestones under ICAB guidelines.",
  },
];
