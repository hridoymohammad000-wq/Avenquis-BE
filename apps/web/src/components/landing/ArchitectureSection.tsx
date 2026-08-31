import React from "react";
import {
  ShieldCheck,
  Lock,
  Database,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Terminal,
  Key,
  Layers,
  Sparkles,
} from "lucide-react";
import { ARCHITECTURE_INVARIANTS } from "../../data/landingData";

export const ArchitectureSection: React.FC = () => {
  return (
    <section
      id="architecture"
      className="py-20 sm:py-28 bg-[#FAF7F2] border-t border-[#EBE6DD] relative"
    >
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#E1F3EE] border border-[#C8E9DE] text-[#1F5946] text-xs font-bold uppercase tracking-widest mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ENTERPRISE ARCHITECTURE &amp; COMPLIANCE</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#1C1F1E] tracking-tight leading-[1.15]">
            Built with Strict Security Invariants
          </h2>
          <p className="text-base sm:text-lg text-[#55615B] mt-4 leading-relaxed">
            Accounting, audit, and tax practices handle sensitive financial
            statements and trade secrets. AVENQUIS is engineered from the
            database layer upwards to guarantee isolation and non-repudiation.
          </p>
        </div>

        {/* 4 Invariant Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {ARCHITECTURE_INVARIANTS.map((inv) => (
            <div
              key={inv.id}
              className="motion-card bg-white rounded-3xl p-7 border border-[#EBE6DD] hover:border-[#113227]/30 shadow-xs transition-all flex flex-col justify-between text-left"
            >
              <div>
                {/* Code & Impact */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[#FAF0DE] text-[#8A5A18] border border-[#E8D7B8]">
                    {inv.code}
                  </span>
                  <span className="text-xs font-semibold text-[#1F5946] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {inv.securityImpact}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-bold font-serif text-[#1C1F1E] mb-2">
                  {inv.title}
                </h3>

                {/* Description */}
                <p className="text-xs sm:text-sm text-[#55615B] leading-relaxed mb-4">
                  {inv.description}
                </p>
              </div>

              {/* Standard Citation Footer */}
              <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-xs font-mono text-stone-500">
                <span>Compliance Benchmark</span>
                <span className="font-bold text-[#113227]">
                  {inv.standardCitation}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Visual Architecture Comparison Table */}
        <div className="bg-white rounded-3xl border border-[#EBE6DD] p-6 sm:p-10 shadow-sm text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-[#EBE6DD]">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#8A5A18]">
                PARADIGM COMPARISON
              </span>
              <h3 className="text-2xl font-bold font-serif text-[#1C1F1E] mt-1">
                Legacy Fragmented Practice vs. AVENQUIS Firm OS
              </h3>
            </div>
            <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-[#E1F3EE] text-[#1F5946] font-bold border border-[#C8E9DE]">
              Zero-Trust Architecture
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Legacy Approach */}
            <div className="p-6 rounded-2xl bg-[#FFF8F7] border border-[#FADCD9] space-y-4">
              <div className="flex items-center gap-2 text-[#8E362C] font-bold text-sm uppercase tracking-wide">
                <AlertTriangle className="w-4 h-4" />
                <span>The Legacy Dilemma (Vulnerable &amp; Disconnected)</span>
              </div>
              <ul className="space-y-3 text-xs text-[#6B2F27]">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>
                    Unversioned Excel files shared over unencrypted email
                    attachments.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>
                    Client PBC documents requested and received across messy
                    WhatsApp threads.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>
                    Timesheets tracked on paper with untracked overtime and
                    delayed client billing.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 font-bold">✕</span>
                  <span>
                    No immutable audit trail or proof of partner review prior to
                    report release.
                  </span>
                </li>
              </ul>
            </div>

            {/* AVENQUIS Approach */}
            <div className="p-6 rounded-2xl bg-[#F0F8F5] border border-[#C8E9DE] space-y-4">
              <div className="flex items-center gap-2 text-[#1F5946] font-bold text-sm uppercase tracking-wide">
                <ShieldCheck className="w-4 h-4" />
                <span>
                  The AVENQUIS Standard (Unified &amp; Cryptographically Sealed)
                </span>
              </div>
              <ul className="space-y-3 text-xs text-[#1F5946]">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>
                    PostgreSQL Row-Level Security ensures 100% tenant isolation
                    per firm.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>
                    Encrypted client portal with status-tagged document requests
                    and automated reminders.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>
                    Integrated timesheets convert directly into statutory 15%
                    VAT fee tax invoices.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-700 font-bold">✓</span>
                  <span>
                    Cryptographic SHA-256 digital seals with immutable review
                    logs for ISA 220 compliance.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
