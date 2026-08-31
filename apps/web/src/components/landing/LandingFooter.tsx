import React from "react";
import { ShieldCheck, ArrowUpRight, Lock, Building2 } from "lucide-react";

interface LandingFooterProps {
  onOpenModal: (modalId: string) => void;
  onLaunchWorkspace: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onOpenModal,
  onLaunchWorkspace,
}) => {
  return (
    <footer className="relative bg-[#1C1F1E] text-[#A6B2AC] pt-16 sm:pt-20 pb-12 border-t border-[#2F3633] text-left">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        {/* Top Row: Brand Statement & Quick Workspace Launch */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pb-12 border-b border-[#2F3633]">
          <div className="max-w-xl">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-[#113227] text-white flex items-center justify-center font-serif font-bold text-base border border-[#235846]">
                A
              </div>
              <span className="text-xl font-serif font-black tracking-[0.16em] text-white uppercase">
                AVEN
                <span className="text-[#C58A3E] font-sans font-light tracking-normal mx-0.5">
                  —
                </span>
                QUIS
              </span>
            </div>
            <p className="text-xs text-[#8A9691] leading-relaxed">
              The unified, security-first Operating System for modern chartered
              accountancy, audit, tax, and professional advisory firms.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onLaunchWorkspace}
              className="px-6 py-3 rounded-full bg-[#113227] hover:bg-[#1A4537] text-white text-xs font-bold transition-colors flex items-center gap-2 border border-[#235846] shadow-sm cursor-pointer"
            >
              <span>Launch Live Workspace</span>
              <ArrowUpRight className="w-3.5 h-3.5 text-[#C58A3E]" />
            </button>
          </div>
        </div>

        {/* 4-Column Navigation Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 text-xs">
          {/* Column 1: Core Modules */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-4">
              Core Modules
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="#modules"
                  className="hover:text-white transition-colors"
                >
                  Firm OS &amp; People
                </a>
              </li>
              <li>
                <a
                  href="#modules"
                  className="hover:text-white transition-colors"
                >
                  Client CRM &amp; Engagements
                </a>
              </li>
              <li>
                <a
                  href="#modules"
                  className="hover:text-white transition-colors"
                >
                  Tasks &amp; Weekly Timesheets
                </a>
              </li>
              <li>
                <a
                  href="#modules"
                  className="hover:text-white transition-colors"
                >
                  Audit Working Papers (ISA 220)
                </a>
              </li>
              <li>
                <a
                  href="#modules"
                  className="hover:text-white transition-colors"
                >
                  Office Finance &amp; 15% VAT
                </a>
              </li>
              <li>
                <a
                  href="#modules"
                  className="hover:text-white transition-colors"
                >
                  Permission-Safe AI Copilot
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Architecture */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-4">
              Architecture
            </h4>
            <ul className="space-y-2.5">
              <li>
                <a
                  href="#architecture"
                  className="hover:text-white transition-colors"
                >
                  PostgreSQL Row-Level Security
                </a>
              </li>
              <li>
                <a
                  href="#architecture"
                  className="hover:text-white transition-colors"
                >
                  SHA-256 Digital Signatures
                </a>
              </li>
              <li>
                <a
                  href="#architecture"
                  className="hover:text-white transition-colors"
                >
                  Zero-Trust Session Isolation
                </a>
              </li>
              <li>
                <a
                  href="#architecture"
                  className="hover:text-white transition-colors"
                >
                  Append-Only Audit Trails
                </a>
              </li>
              <li>
                <a
                  href="#architecture"
                  className="hover:text-white transition-colors"
                >
                  Controlled AI Boundaries
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: Compliance & Statutes */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-4">
              Regulatory Compliance
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenModal("icab")}
                  className="hover:text-white transition-colors text-left"
                >
                  ICAB Quality Management
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenModal("isa220")}
                  className="hover:text-white transition-colors text-left"
                >
                  ISA 220 &amp; ISA 230 Standards
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenModal("vat")}
                  className="hover:text-white transition-colors text-left"
                >
                  NBR 15% VAT &amp; TDS Rules
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenModal("soc2")}
                  className="hover:text-white transition-colors text-left"
                >
                  SOC 2 Type II &amp; ISO 27001
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Practice & Legal */}
          <div>
            <h4 className="font-bold text-white uppercase tracking-wider text-[11px] mb-4">
              Practice &amp; Legal
            </h4>
            <ul className="space-y-2.5">
              <li>
                <button
                  type="button"
                  onClick={() => onOpenModal("privacy")}
                  className="hover:text-white transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenModal("terms")}
                  className="hover:text-white transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenModal("dpa")}
                  className="hover:text-white transition-colors text-left"
                >
                  Data Processing Agreement (DPA)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onOpenModal("support")}
                  className="hover:text-white transition-colors text-left"
                >
                  Practice Concierge Desk
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Line */}
        <div className="pt-8 border-t border-[#2F3633] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#6E7B75]">
          <div>
            <span>
              © 2026 AVENQUIS. All rights reserved. Professional Firm Operating
              System.
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1 text-[#C58A3E]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C58A3E]" />
              Private Practice V1 Active
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
