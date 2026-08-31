import React from "react";
import {
  X,
  Check,
  ArrowRight,
  ShieldCheck,
  Mail,
  Users,
  Calendar,
  PieChart,
  FileText,
  Send,
  Sparkles,
} from "lucide-react";
import { FeatureItem } from "../types";
import { PRICING_TIERS, FEATURES } from "../data/content";

interface ModalsProps {
  activeModal: string | null;
  selectedFeature: FeatureItem | null;
  onClose: () => void;
  onSelectFeature?: (feature: FeatureItem) => void;
  onSignInFromModal?: () => void;
}

export const Modals: React.FC<ModalsProps> = ({
  activeModal,
  selectedFeature,
  onClose,
  onSelectFeature,
  onSignInFromModal,
}) => {
  if (!activeModal && !selectedFeature) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#113227]/40 backdrop-blur-xs animate-fadeIn">
      {/* Backdrop overlay click */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      {/* Modal Dialog Body */}
      <div className="motion-dialog relative w-full max-w-2xl bg-white rounded-3xl border border-[#EBE6DD] shadow-2xl p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto text-left">
        {/* Close Button */}
        <button
          id="modal-close-btn"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E6E0D4] flex items-center justify-center text-[#66706B] hover:text-[#1C1F1E] hover:bg-[#F2ECE1] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* 1. Feature Detail Modal */}
        {selectedFeature && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ backgroundColor: selectedFeature.badge.bg }}
              >
                {selectedFeature.iconName === "users" && (
                  <Users className="w-6 h-6 text-[#1F5946]" />
                )}
                {selectedFeature.iconName === "calendar" && (
                  <Calendar className="w-6 h-6 text-[#8A5A18]" />
                )}
                {selectedFeature.iconName === "pie-chart" && (
                  <PieChart className="w-6 h-6 text-[#8E362C]" />
                )}
                {selectedFeature.iconName === "file-text" && (
                  <FileText className="w-6 h-6 text-[#1D526D]" />
                )}
              </div>
              <div>
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{
                    backgroundColor: selectedFeature.badge.bg,
                    color: selectedFeature.badge.text,
                  }}
                >
                  {selectedFeature.badge.label}
                </span>
                <h3 className="text-xl font-bold font-serif text-[#1C1F1E] mt-1">
                  {selectedFeature.title}
                </h3>
              </div>
            </div>

            <p className="text-sm text-[#55615B] leading-relaxed">
              {selectedFeature.description}
            </p>

            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#ECE6DB] space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#7C8782] block">
                Key Highlights
              </span>
              <ul className="text-xs text-[#3D4742] space-y-1.5 list-disc pl-4">
                <li>Automated data synchronizations across departments.</li>
                <li>Granular role-based permissions and access policies.</li>
                <li>Comprehensive audit logs with instant PDF export.</li>
              </ul>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-[#66706B] hover:text-[#1C1F1E]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSignInFromModal?.();
                }}
                className="px-5 py-2 rounded-full bg-[#113227] text-white text-xs font-semibold hover:bg-[#174234] transition-colors"
              >
                Try in Workspace →
              </button>
            </div>
          </div>
        )}

        {/* 2. About Modal */}
        {activeModal === "about" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-[#C58A3E]">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-bold tracking-widest uppercase">
                About AVENQUIS
              </span>
            </div>
            <h3 className="text-2xl font-bold font-serif text-[#1C1F1E]">
              Built for Modern, Elevated Workspaces
            </h3>
            <p className="text-sm text-[#55615B] leading-relaxed">
              AVENQUIS was conceived to eliminate the cluttered, fragmented
              tooling that slows down forward-thinking professional practices.
              We combine people management, attendance tracking, audit working
              paper governance, client CRM, and document compliance in one
              harmonious, luxury editorial interface.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] text-center border border-[#ECE6DB]">
                <div className="text-xl font-bold font-serif text-[#113227]">
                  99.99%
                </div>
                <div className="text-[11px] text-[#66706B] mt-0.5">
                  Uptime SLA
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] text-center border border-[#ECE6DB]">
                <div className="text-xl font-bold font-serif text-[#C58A3E]">
                  450+
                </div>
                <div className="text-[11px] text-[#66706B] mt-0.5">
                  Firms &amp; Offices
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] text-center border border-[#ECE6DB]">
                <div className="text-xl font-bold font-serif text-[#1F5946]">
                  4.9 / 5
                </div>
                <div className="text-[11px] text-[#66706B] mt-0.5">Rating</div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Features Modal */}
        {activeModal === "features" && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-[#113227]">
              <Sparkles className="w-5 h-5 text-[#C58A3E]" />
              <span className="text-xs font-bold tracking-widest uppercase">
                Firm OS Capabilities
              </span>
            </div>
            <h3 className="text-2xl font-bold font-serif text-[#1C1F1E]">
              Unified Architecture for Your Entire Team
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {FEATURES.map((feat) => (
                <div
                  key={feat.id}
                  onClick={() => onSelectFeature?.(feat)}
                  className="p-3.5 rounded-2xl border border-[#EBE6DD] bg-[#FAF7F2] hover:bg-white hover:border-[#113227]/30 transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 rounded-md"
                      style={{
                        backgroundColor: feat.badge.bg,
                        color: feat.badge.text,
                      }}
                    >
                      {feat.badge.label}
                    </span>
                    <h4 className="text-xs font-bold text-[#1C1F1E]">
                      {feat.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#66706B] line-clamp-2">
                    {feat.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Pricing Modal */}
        {activeModal === "pricing" && (
          <div className="space-y-6">
            <div>
              <span className="text-xs font-bold text-[#C58A3E] tracking-widest uppercase">
                Transparent Plans
              </span>
              <h3 className="text-2xl font-bold font-serif text-[#1C1F1E] mt-1">
                Predictable plans for every company size
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {PRICING_TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`p-4 rounded-2xl border ${
                    tier.featured
                      ? "border-[#113227] bg-[#FAF7F2] ring-1 ring-[#113227]"
                      : "border-[#EBE6DD] bg-white"
                  } flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-[#1C1F1E]">
                        {tier.name}
                      </span>
                      {tier.featured && (
                        <span className="text-[9px] font-bold uppercase bg-[#113227] text-white px-2 py-0.5 rounded-full">
                          Recommended
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-1 my-2">
                      <span className="text-2xl font-bold font-serif text-[#1C1F1E]">
                        {tier.price}
                      </span>
                      <span className="text-xs text-[#7C8782]">
                        {tier.period}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#66706B] mb-3">
                      {tier.description}
                    </p>
                    <ul className="text-[11px] text-[#3D4742] space-y-1.5">
                      {tier.features.map((f) => (
                        <li key={f} className="flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-[#1F5946] shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSignInFromModal?.();
                    }}
                    className={`mt-4 w-full py-2 rounded-xl text-xs font-semibold transition-colors ${
                      tier.featured
                        ? "bg-[#113227] text-white hover:bg-[#174234]"
                        : "bg-[#F2ECE1] text-[#1C1F1E] hover:bg-[#E8DFCF]"
                    }`}
                  >
                    Select Plan
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Forgot Password Dialog */}
        {activeModal === "forgot-password" && (
          <div className="space-y-4">
            <div className="w-11 h-11 rounded-2xl bg-[#FCEFD9] text-[#8A5A18] flex items-center justify-center border border-[#F8DCB4]">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-serif text-[#1C1F1E]">
                Reset your password
              </h3>
              <p className="text-xs text-[#66706B] mt-1">
                Enter your workspace corporate email address and we'll send you
                recovery instructions.
              </p>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                alert("Password reset link sent to your corporate email!");
                onClose();
              }}
              className="space-y-3"
            >
              <input
                type="email"
                placeholder="name@avenquis.com"
                required
                className="w-full px-3.5 py-2.5 bg-[#FAF7F2] border border-[#E5DFD3] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#113227]/20"
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#113227] text-white text-xs font-semibold hover:bg-[#174234] transition-colors"
              >
                Send Reset Link →
              </button>
            </form>
          </div>
        )}

        {/* 6. Legal & Support Modals */}
        {activeModal === "privacy" && (
          <div className="space-y-3 text-xs text-[#55615B] leading-relaxed">
            <h3 className="text-xl font-bold font-serif text-[#1C1F1E]">
              Privacy Policy
            </h3>
            <p>
              At AVENQUIS, we adhere to strict international privacy standards
              including GDPR, CCPA, and SOC 2 Type II compliance. Your
              organizational employee data, payroll figures, and attendance
              records are end-to-end encrypted at rest (AES-256) and in transit
              (TLS 1.3).
            </p>
            <p>
              We never monetize, sell, or share company operational data with
              third-party advertising brokers.
            </p>
          </div>
        )}

        {activeModal === "terms" && (
          <div className="space-y-3 text-xs text-[#55615B] leading-relaxed">
            <h3 className="text-xl font-bold font-serif text-[#1C1F1E]">
              Terms of Service
            </h3>
            <p>
              Welcome to the AVENQUIS cloud workspace. By signing in, your
              organization agrees to our enterprise master services agreement,
              guaranteeing 99.99% service availability and data durability.
            </p>
          </div>
        )}

        {activeModal === "support" && (
          <div className="space-y-4">
            <h3 className="text-xl font-bold font-serif text-[#1C1F1E]">
              24/7 Office Concierge &amp; Support
            </h3>
            <p className="text-xs text-[#55615B]">
              Need help configuring custom practice policies, multi-tier payroll
              runs, or Single Sign-On (SAML/Okta)?
            </p>
            <div className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#ECE6DB] flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-[#1C1F1E]">
                  Direct Concierge Desk
                </div>
                <div className="text-[11px] text-[#66706B]">
                  support@avenquis.com
                </div>
              </div>
              <a
                href="mailto:support@avenquis.com"
                className="px-3 py-1.5 rounded-lg bg-[#113227] text-white text-xs font-semibold hover:bg-[#174234]"
              >
                Contact
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
