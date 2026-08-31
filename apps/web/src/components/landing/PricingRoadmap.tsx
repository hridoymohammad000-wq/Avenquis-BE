import React from "react";
import {
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  HelpCircle,
} from "lucide-react";
import { PRICING_ROADMAP } from "../../data/landingData";

interface PricingRoadmapProps {
  onStartPrivateTesting: () => void;
  onRequestEnterprise: () => void;
}

export const PricingRoadmap: React.FC<PricingRoadmapProps> = ({
  onStartPrivateTesting,
  onRequestEnterprise,
}) => {
  return (
    <section id="pricing" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF0DE] border border-[#E8D7B8] text-[#8A5A18] text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#C58A3E]" />
            <span>DEPLOYMENT &amp; ACCESS ROADMAP</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#1C1F1E] tracking-tight leading-[1.15]">
            Transparent Rollout for Professional Practices
          </h2>
          <p className="text-base sm:text-lg text-[#55615B] mt-4 leading-relaxed">
            AVENQUIS is currently in high-fidelity private testing with
            chartered accountancy firms before general multi-office public
            availability.
          </p>
        </div>

        {/* 2 Tier Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {PRICING_ROADMAP.map((tier) => (
            <div
              key={tier.id}
              className={`rounded-3xl p-8 sm:p-10 border transition-all flex flex-col justify-between text-left relative ${
                tier.featured
                  ? "bg-white border-[#113227] shadow-xl ring-2 ring-[#113227]/10"
                  : "bg-[#FAF7F2] border-[#EBE6DD] shadow-xs"
              }`}
            >
              {/* Featured Badge */}
              {tier.featured && (
                <div className="absolute -top-3.5 left-8 px-3.5 py-1 rounded-full bg-[#113227] text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C58A3E]" />
                  <span>{tier.badge}</span>
                </div>
              )}

              <div>
                {!tier.featured && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#8A5A18] mb-2 block">
                    {tier.badge}
                  </span>
                )}

                <h3 className="text-2xl font-bold font-serif text-[#1C1F1E] mb-2">
                  {tier.name}
                </h3>
                <p className="text-xs text-[#55615B] leading-relaxed mb-6">
                  {tier.description}
                </p>

                {/* Price Display */}
                <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-[#F0EBE1]">
                  <span className="text-3xl sm:text-4xl font-serif font-bold text-[#113227]">
                    {tier.price}
                  </span>
                  <span className="text-xs text-stone-500 font-medium">
                    {tier.period}
                  </span>
                </div>

                {/* Feature Checklist */}
                <div className="space-y-3 mb-8">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 block">
                    Included Capabilities
                  </span>
                  <ul className="space-y-2.5 text-xs text-[#3D4742]">
                    {tier.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <div className="w-4 h-4 rounded-full bg-[#E1F3EE] text-[#1F5946] flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button & Note */}
              <div>
                <button
                  type="button"
                  onClick={
                    tier.featured ? onStartPrivateTesting : onRequestEnterprise
                  }
                  className={`w-full py-4 rounded-full font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    tier.featured
                      ? "bg-[#113227] hover:bg-[#1A4537] text-white shadow-md shadow-emerald-950/10"
                      : "bg-white hover:bg-stone-50 text-[#1C1F1E] border border-[#DCD5C7]"
                  }`}
                >
                  <span>{tier.ctaText}</span>
                  <ArrowRight className="w-4 h-4 text-[#C58A3E]" />
                </button>
                <p className="text-[11px] text-stone-400 text-center mt-3">
                  {tier.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
