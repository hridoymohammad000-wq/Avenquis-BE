import React from "react";
import {
  ShieldCheck,
  Database,
  FileKey,
  Bot,
  CheckCircle2,
  Award,
} from "lucide-react";
import { TRUST_METRICS } from "../../data/landingData";

export const TrustMetricStrip: React.FC = () => {
  return (
    <section className="relative z-10 py-12 border-y border-[#EBE6DD] bg-white/70 backdrop-blur-xs">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        {/* Strip Header */}
        <div className="text-center mb-8">
          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#8A5A18]">
            TRUSTED OPERATIONAL INVARIANTS
          </span>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#1C1F1E] mt-1">
            Engineered for Strict Audit &amp; Legal Compliance
          </h2>
        </div>

        {/* 4 Trust Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {TRUST_METRICS.map((metric, idx) => (
            <div
              key={metric.id}
              className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8E2D5] hover:border-[#113227]/30 transition-all text-left shadow-2xs group flex flex-col justify-between"
            >
              <div>
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#E3DDD0] flex items-center justify-center text-[#113227] group-hover:scale-105 transition-transform">
                    {idx === 0 && (
                      <Database className="w-4 h-4 text-[#113227]" />
                    )}
                    {idx === 1 && (
                      <FileKey className="w-4 h-4 text-[#8A5A18]" />
                    )}
                    {idx === 2 && <Bot className="w-4 h-4 text-[#1F5946]" />}
                    {idx === 3 && <Award className="w-4 h-4 text-[#C58A3E]" />}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-[#E3DDD0] text-stone-600">
                    {metric.tag}
                  </span>
                </div>

                {/* Title & Subtitle */}
                <h3 className="font-bold text-sm text-[#1C1F1E] font-serif">
                  {metric.title}
                </h3>
                <div className="text-xs font-semibold text-[#8A5A18] mt-0.5">
                  {metric.subtitle}
                </div>

                {/* Description */}
                <p className="text-xs text-[#55615B] leading-relaxed mt-2">
                  {metric.description}
                </p>
              </div>

              {/* Bottom Indicator */}
              <div className="mt-4 pt-3 border-t border-[#EAE3D7] flex items-center justify-between text-[11px] font-mono text-stone-500">
                <span>Status</span>
                <span className="font-bold text-[#113227] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#113227]" />
                  {metric.highlight}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
