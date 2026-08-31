import React, { useState } from "react";
import {
  Users,
  Briefcase,
  Clock,
  FileSpreadsheet,
  Receipt,
  Bot,
  ArrowRight,
  Check,
  Sparkles,
  Shield,
  Layers,
  FileCheck2,
  ChevronRight,
  X,
} from "lucide-react";
import { CORE_MODULES, ModulePillar } from "../../data/landingData";

interface BentoModulesGridProps {
  onLaunchWorkspaceModule: (moduleId: string) => void;
}

export const BentoModulesGrid: React.FC<BentoModulesGridProps> = ({
  onLaunchWorkspaceModule,
}) => {
  const [selectedModule, setSelectedModule] = useState<ModulePillar | null>(
    null,
  );

  const getModuleIcon = (id: string) => {
    switch (id) {
      case "firm-people":
        return <Users className="w-5 h-5 text-[#1F5946]" />;
      case "client-crm":
        return <Briefcase className="w-5 h-5 text-[#8A5A18]" />;
      case "tasks-timesheets":
        return <Clock className="w-5 h-5 text-[#1D526D]" />;
      case "audit-papers":
        return <FileSpreadsheet className="w-5 h-5 text-[#94631D]" />;
      case "finance-billing":
        return <Receipt className="w-5 h-5 text-[#8E362C]" />;
      case "ai-copilot":
        return <Bot className="w-5 h-5 text-[#5B21B6]" />;
      default:
        return <Layers className="w-5 h-5 text-[#113227]" />;
    }
  };

  return (
    <section id="modules" className="py-20 sm:py-28 relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-12">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF0DE] border border-[#E8D7B8] text-[#8A5A18] text-xs font-bold uppercase tracking-widest mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#C58A3E]" />
            <span>V1 PRODUCT PILLARS</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-[#1C1F1E] tracking-tight leading-[1.15]">
            Six Integrated Pillars Built for Firm Operations
          </h2>
          <p className="text-base sm:text-lg text-[#55615B] mt-4 leading-relaxed">
            Every module connects natively with PostgreSQL Row-Level Security,
            eliminating data silos between audit teams, tax practitioners, and
            managing partners.
          </p>
        </div>

        {/* 6 Bento Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CORE_MODULES.map((module) => (
            <div
              key={module.id}
              onClick={() => setSelectedModule(module)}
              className="motion-card bg-white rounded-3xl p-6 sm:p-7 border border-[#EBE6DD] hover:border-[#113227]/40 shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer text-left relative overflow-hidden"
            >
              {/* Subtle top indicator */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center border"
                    style={{
                      backgroundColor: module.badge.bg,
                      borderColor: module.badge.border,
                    }}
                  >
                    {getModuleIcon(module.id)}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono font-bold text-stone-400">
                      MODULE {module.number}
                    </span>
                    <div className="text-xs font-bold text-[#8A5A18]">
                      {module.category}
                    </div>
                  </div>
                </div>

                <span
                  className="text-[10px] font-bold px-2.5 py-1 rounded-full border"
                  style={{
                    backgroundColor: module.badge.bg,
                    color: module.badge.text,
                    borderColor: module.badge.border,
                  }}
                >
                  {module.badge.label}
                </span>
              </div>

              {/* Title & Headline */}
              <div className="mb-4">
                <h3 className="text-xl font-bold font-serif text-[#1C1F1E] group-hover:text-[#113227] transition-colors">
                  {module.title}
                </h3>
                <p className="text-xs text-[#55615B] mt-2 line-clamp-2 leading-relaxed">
                  {module.headline}
                </p>
              </div>

              {/* Key Highlights Checklist */}
              <div className="space-y-2 py-3 my-2 border-y border-[#F0EBE1] text-xs text-[#3D4742]">
                {module.keyFeatures.slice(0, 3).map((feat, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-[#1F5946] shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{feat}</span>
                  </div>
                ))}
              </div>

              {/* Card Footer: Live Tag & Interactive CTA */}
              <div className="pt-2 flex items-center justify-between text-xs">
                <span className="text-[11px] font-semibold text-stone-500 font-mono">
                  {module.metrics}
                </span>
                <span className="font-bold text-[#113227] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  <span>Explore</span>
                  <ChevronRight className="w-3.5 h-3.5 text-[#C58A3E]" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Module Detail Modal */}
        {selectedModule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#113227]/40 backdrop-blur-xs animate-fadeIn">
            <div
              className="absolute inset-0"
              onClick={() => setSelectedModule(null)}
              aria-hidden="true"
            />
            <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-[#EBE6DD] shadow-2xl p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto text-left">
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedModule(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#FAF7F2] border border-[#E6E0D4] flex items-center justify-center text-[#66706B] hover:text-[#1C1F1E] transition-colors"
                aria-label="Close detail modal"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                  style={{
                    backgroundColor: selectedModule.badge.bg,
                    borderColor: selectedModule.badge.border,
                  }}
                >
                  {getModuleIcon(selectedModule.id)}
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-stone-400">
                    PILLAR {selectedModule.number} • {selectedModule.category}
                  </span>
                  <h3 className="text-2xl font-bold font-serif text-[#1C1F1E]">
                    {selectedModule.title}
                  </h3>
                </div>
              </div>

              <p className="text-sm text-[#55615B] leading-relaxed mb-6">
                {selectedModule.description}
              </p>

              <div className="p-5 rounded-2xl bg-[#FAF7F2] border border-[#ECE6DB] space-y-3 mb-6">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8A5A18] block">
                  Comprehensive Feature Invariants
                </span>
                <ul className="space-y-2 text-xs text-[#3D4742]">
                  {selectedModule.keyFeatures.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <div className="w-4 h-4 rounded-full bg-[#E1F3EE] text-[#1F5946] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3" />
                      </div>
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#EBE6DD]">
                <div className="text-xs text-stone-500 font-mono">
                  Standard:{" "}
                  <span className="font-bold text-[#113227]">
                    {selectedModule.metrics}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedModule(null)}
                    className="px-4 py-2 text-xs font-semibold text-[#66706B] hover:text-[#1C1F1E]"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedModule(null);
                      onLaunchWorkspaceModule(selectedModule.id);
                    }}
                    className="px-6 py-2.5 rounded-full bg-[#113227] text-white text-xs font-bold hover:bg-[#1A4537] transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <span>Launch in Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#C58A3E]" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
