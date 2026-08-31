import { FeatureItem, NavLinkItem } from "../types";

export const NAV_LINKS: NavLinkItem[] = [
  { id: "about", label: "About", href: "#about" },
  { id: "features", label: "Features", href: "#features" },
  { id: "pricing", label: "Pricing", href: "#pricing" },
];

export const FEATURES: FeatureItem[] = [
  {
    id: "team",
    title: "Team Management",
    subtitle: "Profiles, roles & hierarchy",
    iconName: "users",
    badge: {
      label: "Team",
      bg: "#E1F3EE",
      text: "#1F5946",
      border: "#C8E9DE",
    },
    metrics: "99.4% engagement",
    description:
      "Empower department leaders with unified employee directories, role assignments, and seamless onboarding workflows.",
  },
  {
    id: "attendance",
    title: "Attendance Tracking",
    subtitle: "Shifts, leaves & timesheets",
    iconName: "calendar",
    badge: {
      label: "Attendance",
      bg: "#FCEFD9",
      text: "#8A5A18",
      border: "#F8DCB4",
    },
    metrics: "Live punch-in GPS",
    description:
      "Real-time clock-in monitoring, smart overtime calculations, and instant leave approval pipelines.",
  },
  {
    id: "accounts",
    title: "Accounts & Finance",
    subtitle: "Payroll, invoices & budget",
    iconName: "pie-chart",
    badge: {
      label: "Accounts",
      bg: "#FDE6E2",
      text: "#8E362C",
      border: "#F9CCC4",
    },
    metrics: "Automated payroll",
    description:
      "Effortless expense reconciliations, tax-compliant payroll generation, and department budget forecasts.",
  },
  {
    id: "documents",
    title: "Documents & Reports",
    subtitle: "Compliance, audit & analytics",
    iconName: "file-text",
    badge: {
      label: "Documents",
      bg: "#E2F1F8",
      text: "#1D526D",
      border: "#C7E4F2",
    },
    metrics: "Instant PDF export",
    description:
      "Centralized document repository with role-based access control, cryptographic e-signatures, and BI exports.",
  },
];

export const PRICING_TIERS = [
  {
    name: "Starter Office",
    price: "$29",
    period: "/month",
    description:
      "Essential toolkit for growing boutiques & startups up to 25 team members.",
    features: [
      "Up to 25 Active Employees",
      "Basic Attendance & Shifts",
      "Monthly Payroll Run",
      "Standard Reports (PDF)",
    ],
    badge: "Popular for Small Teams",
  },
  {
    name: "Business Suite",
    price: "$79",
    period: "/month",
    description:
      "Comprehensive office management system for established enterprises.",
    features: [
      "Up to 150 Active Employees",
      "Multi-location Attendance GPS",
      "Multi-currency Payroll & Taxes",
      "Custom Audit Logs & API",
      "Dedicated Account Manager",
    ],
    badge: "Most Popular",
    featured: true,
  },
  {
    name: "Custom Enterprise",
    price: "Custom",
    period: "",
    description:
      "Tailored on-premise or dedicated cloud deployments with SLA guarantees.",
    features: [
      "Unlimited Members & Entities",
      "Custom ERP/HRIS Integrations",
      "Custom Compliance & SOC2",
      "24/7 Priority Support",
    ],
    badge: "Enterprise",
  },
];
