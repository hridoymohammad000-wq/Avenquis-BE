import React, { useState } from "react";
import { ChevronDown, Sparkles, HelpCircle, MessageSquare } from "lucide-react";
import { FAQ_ITEMS } from "../../data/landingData";

export const FaqSection: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const categories = [
    "All",
    "Compliance & Security",
    "Operations & Billing",
    "AI & Privacy",
    "Onboarding",
  ];

  const filteredFaqs =
    activeCategory === "All"
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((f) => f.category === activeCategory);

  return (
    <section
      id="faq"
      className="py-20 sm:py-28 bg-white/70 border-t border-[#EBE6DD] relative"
    >
      <div className="max-w-5xl mx-auto px-6 sm:px-12">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF0DE] border border-[#E8D7B8] text-[#8A5A18] text-xs font-bold uppercase tracking-widest mb-4">
            <HelpCircle className="w-3.5 h-3.5 text-[#C58A3E]" />
            <span>PRACTICE INTELLIGENCE FAQ</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-[#1C1F1E] tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm sm:text-base text-[#55615B] mt-3">
            Common architectural and regulatory inquiries from managing partners
            and practice administrators.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setActiveCategory(cat);
                setOpenIndex(null);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-[#113227] text-white shadow-xs"
                  : "bg-[#FAF7F2] text-[#55615B] hover:bg-[#EAE3D7] border border-[#E0D8CA]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4 text-left">
          {filteredFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.question}
                className={`rounded-2xl border transition-all ${
                  isOpen
                    ? "bg-white border-[#113227]/40 shadow-sm"
                    : "bg-[#FAF7F2] border-[#EBE6DD] hover:border-[#D6CEC0]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between gap-4 text-left focus:outline-none cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold text-[#8A5A18] px-2 py-0.5 rounded bg-[#FAF0DE] border border-[#E8D7B8] shrink-0">
                      {faq.category}
                    </span>
                    <span className="font-bold text-sm sm:text-base text-[#1C1F1E] font-serif">
                      {faq.question}
                    </span>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full bg-[#FAF7F2] border border-[#E0D8CA] flex items-center justify-center text-stone-500 transition-transform ${
                      isOpen
                        ? "rotate-180 bg-[#113227] text-white border-[#113227]"
                        : ""
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-xs sm:text-sm text-[#55615B] leading-relaxed border-t border-[#F0EBE1] mt-1 animate-fadeIn">
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Additional Inquiry Help Card */}
        <div className="mt-12 p-6 rounded-2xl bg-[#FAF7F2] border border-[#EBE6DD] flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#DCD5C7] flex items-center justify-center text-[#113227] shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-[#1C1F1E] font-serif">
                Have specific statutory or firm workflow questions?
              </h4>
              <p className="text-xs text-[#55615B] mt-0.5">
                Our team can review your firm's current working paper index and
                timesheet structures.
              </p>
            </div>
          </div>
          <a
            href="mailto:inquiries@avenquis.com"
            className="px-5 py-2 rounded-full bg-white hover:bg-stone-50 border border-[#DCD5C7] text-xs font-bold text-[#113227] shadow-2xs whitespace-nowrap"
          >
            Contact Practice Team
          </a>
        </div>
      </div>
    </section>
  );
};
