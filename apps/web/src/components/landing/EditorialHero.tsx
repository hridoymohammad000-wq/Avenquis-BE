import React, { useState } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileCheck,
  Users,
  Briefcase,
  Clock,
  DollarSign,
  Bot,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  Layers,
} from "lucide-react";

interface EditorialHeroProps {
  onStartTesting: () => void;
  onExploreArchitecture: () => void;
  onLaunchWorkspace: () => void;
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  onStartTesting,
  onExploreArchitecture,
  onLaunchWorkspace,
}) => {
  const [activePreviewTab, setActivePreviewTab] = useState<
    "audit" | "crm" | "timesheet" | "finance"
  >("audit");

  return (
    <section
      id="hero"
      className="relative pt-6 sm:pt-12 pb-16 lg:pb-24 overflow-hidden"
    >
      {/* Subtle Background Glow Accents */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-[#113227]/5 via-[#C58A3E]/10 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

      <div className="max-w-7xl mx-auto px-6 sm:px-12 text-center">
        {/* Eyebrow Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FAF0DE] border border-[#E8D7B8] text-[#8A5A18] text-xs font-bold tracking-widest uppercase mb-8 shadow-2xs"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="w-2 h-2 rounded-full bg-[#C58A3E] animate-pulse" />
          <span>PROFESSIONAL FIRM OPERATING SYSTEM</span>
          <span className="text-[#C58A3E] font-serif text-sm">✦</span>
        </motion.div>

        {/* High-Impact Editorial Main Headline */}
        <motion.h1
          className="text-4xl sm:text-6xl lg:text-7xl font-serif leading-[1.08] tracking-tight text-[#1C1F1E] max-w-5xl mx-auto mb-6"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.44, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
        >
          <span>The Operating System for</span>
          <br />
          <span>Modern Professional Firms.</span>
          <br />
          <span className="italic font-normal text-[#C58A3E] inline-block mt-1">
            Audit. Tax. Advisory.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="text-base sm:text-xl text-[#55615B] leading-relaxed max-w-3xl mx-auto mb-10 font-normal"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
        >
          Replace fragmented spreadsheets, insecure chats, and disconnected
          tools with a unified, security-first workspace built specifically for
          chartered accountants, auditors, and advisory practices.
        </motion.p>

        {/* Dual Primary / Secondary CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            type="button"
            id="hero-primary-cta-btn"
            onClick={onStartTesting}
            className="w-full sm:w-auto bg-[#113227] hover:bg-[#1A4537] text-white px-8 py-4 rounded-full font-bold text-sm sm:text-base shadow-lg shadow-emerald-950/15 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer group"
          >
            <span>Start Private Testing</span>
            <ArrowRight className="w-4 h-4 text-[#C58A3E] group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            type="button"
            id="hero-secondary-cta-btn"
            onClick={onExploreArchitecture}
            className="w-full sm:w-auto bg-white/90 hover:bg-white text-[#1C1F1E] border border-[#DCD5C7] px-8 py-4 rounded-full font-bold text-sm sm:text-base shadow-2xs hover:border-[#113227]/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Explore Platform</span>
            <ExternalLink className="w-4 h-4 text-[#8A5A18]" />
          </button>
        </motion.div>

        {/* Perspective Preview Mockup Container */}
        <motion.div
          className="relative max-w-6xl mx-auto"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.46, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Mockup Frame Header & Switcher */}
          <div className="bg-[#1C1F1E] text-white rounded-t-3xl border-t border-x border-[#343A38] p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl">
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
              {/* Window Controls */}
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#FF5F56]" />
                <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                <div className="w-3 h-3 rounded-full bg-[#27C93F]" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#2B312E] border border-[#3E4643] text-[11px] text-[#A6B2AC]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#C58A3E]" />
                <span className="font-mono">
                  firm-os.avenquis.internal • Rahman Rahman &amp; Co. CA
                </span>
              </div>
            </div>

            {/* Interactive Preview View Tabs */}
            <div className="flex items-center gap-1 bg-[#111413] p-1 rounded-xl border border-[#2B312E] text-xs overflow-x-auto max-w-full scrollbar-none">
              <button
                type="button"
                onClick={() => setActivePreviewTab("audit")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activePreviewTab === "audit"
                    ? "bg-[#113227] text-white font-bold"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                Audit Papers (ISA 220)
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab("crm")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activePreviewTab === "crm"
                    ? "bg-[#113227] text-white font-bold"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                Engagements &amp; Stage Gates
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab("timesheet")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activePreviewTab === "timesheet"
                    ? "bg-[#113227] text-white font-bold"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                Timesheets &amp; WIP
              </button>
              <button
                type="button"
                onClick={() => setActivePreviewTab("finance")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all whitespace-nowrap ${
                  activePreviewTab === "finance"
                    ? "bg-[#113227] text-white font-bold"
                    : "text-stone-400 hover:text-white"
                }`}
              >
                Billing &amp; Tax Ledgers
              </button>
            </div>
          </div>

          {/* Mockup Screen Body */}
          <div className="bg-[#FAF7F2] border-x border-b border-[#DCD5C7] rounded-b-3xl p-4 sm:p-7 text-left shadow-2xl overflow-hidden transition-all">
            {/* 1. Audit Papers Preview */}
            {activePreviewTab === "audit" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EBE6DD]">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-[#8A5A18] uppercase">
                      ISA 230 AUDIT WORKING PAPERS REPOSITORY
                    </span>
                    <h3 className="text-lg font-bold font-serif text-[#1C1F1E]">
                      WP-REV-01: Revenue Recognition Substantive Testing (ISA
                      500)
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-[#E1F3EE] text-[#1F5946] border border-[#C8E9DE] text-xs font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Two-Partner Signed &amp; Sealed
                    </span>
                    <span className="text-xs font-mono px-2 py-1 bg-stone-100 rounded text-stone-600 border border-stone-200">
                      SHA-256: 8f4a...29c1
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-[#EBE6DD] shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      Materiality Threshold
                    </span>
                    <div className="text-lg font-bold text-[#113227] font-serif mt-0.5">
                      BDT 25,000,000
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Overall Planning Materiality (5% PBT)
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-[#EBE6DD] shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      Sample Population
                    </span>
                    <div className="text-lg font-bold text-[#C58A3E] font-serif mt-0.5">
                      148 Invoices Sampled
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      MUS Monetary Unit Sampling Calculator
                    </p>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-white border border-[#EBE6DD] shadow-2xs">
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      Review Note Resolution
                    </span>
                    <div className="text-lg font-bold text-[#1F5946] font-serif mt-0.5">
                      4 of 4 Cleared
                    </div>
                    <p className="text-[11px] text-stone-500 mt-1">
                      Audit Manager &amp; Engagement Partner
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#EBE6DD] p-4 text-xs">
                  <div className="flex items-center justify-between text-stone-400 font-bold uppercase text-[10px] pb-2 border-b border-stone-100">
                    <span>Working Paper Item / Lead Schedule</span>
                    <span>Standard Reference</span>
                    <span>Auditor Initials</span>
                    <span>Status</span>
                  </div>
                  <div className="divide-y divide-stone-100">
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="font-semibold text-stone-800">
                        WP-A01: Letter of Engagement &amp; Independence
                        Declaration
                      </span>
                      <span className="font-mono text-stone-500">
                        ISA 210 § 4.2
                      </span>
                      <span className="text-stone-600">MR / ZC</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        Partner Signed
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="font-semibold text-stone-800">
                        WP-B04: Trade Receivables Circularization Confirmation
                      </span>
                      <span className="font-mono text-stone-500">
                        ISA 505 § 7.1
                      </span>
                      <span className="text-stone-600">TH / AK</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        98% Reconciled
                      </span>
                    </div>
                    <div className="py-2.5 flex items-center justify-between">
                      <span className="font-semibold text-stone-800">
                        WP-C02: Going Concern Assessment Matrix
                      </span>
                      <span className="font-mono text-stone-500">
                        ISA 570 § 12
                      </span>
                      <span className="text-stone-600">MR (Partner)</span>
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                        Concluded
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Engagements & Stage Gates Preview */}
            {activePreviewTab === "crm" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EBE6DD]">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-[#8A5A18] uppercase">
                      ACTIVE AUDIT &amp; TAX ENGAGEMENT PORTFOLIO
                    </span>
                    <h3 className="text-lg font-bold font-serif text-[#1C1F1E]">
                      Stage-Gated Practice Workflow
                    </h3>
                  </div>
                  <span className="text-xs font-semibold text-stone-600 bg-[#EFE9DD] px-3 py-1 rounded-full">
                    8 Active Statutory Engagements
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-3 rounded-2xl bg-white border border-[#EBE6DD]">
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="text-stone-600">Phase 1: Planning</span>
                      <span className="text-emerald-700">100%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#113227] w-full" />
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-[#EBE6DD]">
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="text-stone-600">
                        Phase 2: Risk Assess
                      </span>
                      <span className="text-emerald-700">100%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#113227] w-full" />
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-[#EBE6DD]">
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="text-stone-600">Phase 3: Fieldwork</span>
                      <span className="text-[#C58A3E]">75%</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-[#C58A3E] w-3/4" />
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-white border border-[#EBE6DD]">
                    <div className="flex items-center justify-between text-xs font-bold mb-2">
                      <span className="text-stone-600">
                        Phase 4: Final Sign-off
                      </span>
                      <span className="text-stone-400">Pending</span>
                    </div>
                    <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full bg-stone-300 w-1/4" />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-2xl border border-[#EBE6DD] flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-stone-800 text-sm">
                      Square Textiles PLC — Annual Statutory Audit FY25
                    </span>
                    <p className="text-stone-500 mt-0.5">
                      Engagement Partner: Masud Rahman, FCA • Team: 5 Auditors
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#FAF0DE] text-[#8A5A18] font-bold border border-[#E8D7B8]">
                    In Review Gate
                  </span>
                </div>
              </div>
            )}

            {/* 3. Timesheet & WIP Preview */}
            {activePreviewTab === "timesheet" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-[#EBE6DD]">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-[#8A5A18] uppercase">
                      WEEKLY BILLABLE TIMESHEET ENGINE
                    </span>
                    <h3 className="text-lg font-bold font-serif text-[#1C1F1E]">
                      Week 35 • Audit Fieldwork Allocations
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-[#113227]">
                      42.5 Billable Hrs Logged
                    </span>
                    <div className="text-[10px] text-stone-500">
                      WIP Accrued: BDT 170,000
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-[#EBE6DD] p-4 text-xs space-y-2">
                  <div className="flex items-center justify-between text-stone-400 font-bold uppercase text-[10px]">
                    <span>Staff Auditor</span>
                    <span>Engagement</span>
                    <span>Activity Code</span>
                    <span>Logged Hours</span>
                    <span>Approval</span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-t border-stone-100">
                    <span className="font-medium text-stone-800">
                      Tariq Hasan (Senior Auditor)
                    </span>
                    <span className="text-stone-600">Beximco Pharma Audit</span>
                    <span className="text-stone-500 font-mono">AUD-SUB-01</span>
                    <span className="font-bold text-stone-800">8.0 hrs</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      Approved
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1 border-t border-stone-100">
                    <span className="font-medium text-stone-800">
                      Nabila Karim (Audit Manager)
                    </span>
                    <span className="text-stone-600">
                      Square Textiles Review
                    </span>
                    <span className="text-stone-500 font-mono">MGR-REV-04</span>
                    <span className="font-bold text-stone-800">6.5 hrs</span>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      Approved
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Finance & 15% VAT Billing Preview */}
            {activePreviewTab === "finance" && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-[#EBE6DD]">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-[#8A5A18] uppercase">
                      OFFICE OPERATING REVENUE &amp; 15% VAT LEDGER
                    </span>
                    <h3 className="text-lg font-bold font-serif text-[#1C1F1E]">
                      Fee Tax Invoice #INV-2026-081
                    </h3>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#E1F3EE] text-[#1F5946] font-bold text-xs border border-[#C8E9DE]">
                    Paid &amp; Reconciled via BEFTN
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-3.5 bg-white rounded-2xl border border-[#EBE6DD]">
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      Professional Audit Fee
                    </span>
                    <div className="text-lg font-bold text-stone-800 font-serif">
                      BDT 1,000,000
                    </div>
                  </div>
                  <div className="p-3.5 bg-white rounded-2xl border border-[#EBE6DD]">
                    <span className="text-[10px] uppercase font-bold text-[#8A5A18]">
                      Statutory 15% VAT
                    </span>
                    <div className="text-lg font-bold text-[#C58A3E] font-serif">
                      BDT 150,000
                    </div>
                  </div>
                  <div className="p-3.5 bg-white rounded-2xl border border-[#EBE6DD]">
                    <span className="text-[10px] uppercase font-bold text-[#1F5946]">
                      Total Tax Invoice Amount
                    </span>
                    <div className="text-lg font-bold text-[#113227] font-serif">
                      BDT 1,150,000
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Mockup Footer Trigger */}
            <div className="pt-4 mt-4 border-t border-[#EBE6DD] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-stone-500">
                <Sparkles className="w-4 h-4 text-[#C58A3E]" />
                <span>
                  Live interactive preview running on simulated multi-tenant
                  practice database.
                </span>
              </div>
              <button
                type="button"
                onClick={onLaunchWorkspace}
                className="font-bold text-[#113227] hover:text-[#1A4537] flex items-center gap-1 cursor-pointer underline"
              >
                <span>Enter Full Interactive Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
