import React from "react";
import {
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Building2,
  Lock,
} from "lucide-react";

interface BottomCtaBannerProps {
  onAccessWorkspace: () => void;
  onOpenSignIn: () => void;
}

export const BottomCtaBanner: React.FC<BottomCtaBannerProps> = ({
  onAccessWorkspace,
  onOpenSignIn,
}) => {
  return (
    <section className="py-16 sm:py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        {/* Luxury Forest Green Card */}
        <div className="relative rounded-[2.5rem] bg-[#113227] text-white p-8 sm:p-16 lg:p-20 overflow-hidden shadow-2xl border border-[#235846] text-center">
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-radial from-[#C58A3E]/20 to-transparent blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-[450px] h-[450px] bg-radial from-[#1F5946]/40 to-transparent blur-3xl pointer-events-none -ml-20 -mb-20" />

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1F5946]/80 border border-[#2D735B] text-[#E1F3EE] text-xs font-bold uppercase tracking-widest mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#C58A3E]" />
            <span>INSTANT PRACTICE DEPLOYMENT</span>
          </div>

          {/* Headline with Gold Typography */}
          <h2 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold text-white tracking-tight max-w-4xl mx-auto leading-[1.12] mb-6">
            Ready to elevate your firm's{" "}
            <span className="italic font-normal text-[#C58A3E]">
              operating standard?
            </span>
          </h2>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-[#C7D7D0] max-w-2xl mx-auto leading-relaxed mb-10 font-normal">
            Join forward-thinking chartered accountants and audit leaders
            standardizing engagement governance, working papers, timesheets, and
            VAT billing on AVENQUIS.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button
              type="button"
              id="bottom-cta-launch-btn"
              onClick={onAccessWorkspace}
              className="w-full sm:w-auto bg-[#C58A3E] hover:bg-[#D4984C] text-[#113227] px-9 py-4 rounded-full font-bold text-sm sm:text-base shadow-lg shadow-amber-950/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>Access Firm Workspace</span>
              <ArrowRight className="w-4 h-4 text-[#113227] group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              id="bottom-cta-signin-btn"
              onClick={onOpenSignIn}
              className="w-full sm:w-auto bg-[#1F5946]/70 hover:bg-[#1F5946] text-white border border-[#2D735B] px-8 py-4 rounded-full font-bold text-sm sm:text-base transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4 text-[#C58A3E]" />
              <span>Practice Member Sign In</span>
            </button>
          </div>

          {/* Security Assurance Badge Strip */}
          <div className="mt-12 pt-8 border-t border-[#1F5946] flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs text-[#A6BFB5] font-mono">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C58A3E]" />
              <span>Designed for ISO 27001 &amp; SOC 2 Standards</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#C58A3E]" />
              <span>ICAB &amp; ISA 220 Aligned Workflows</span>
            </div>
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-[#C58A3E]" />
              <span>AES-256 Encrypted Practice Data</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
