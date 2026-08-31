import React, { useState, useEffect } from "react";
import {
  Search,
  Command,
  Briefcase,
  Users,
  CheckSquare,
  FileCheck,
  CreditCard,
  Sparkles,
  ArrowRight,
  X,
} from "lucide-react";
import { WorkspaceTab } from "../../types";

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: WorkspaceTab) => void;
  onOpenAi: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onOpenAi,
}) => {
  const [query, setQuery] = useState("");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // Toggle or open handled by parent
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNavItems = [
    {
      label: "Dashboard & Practice Cockpit",
      tab: "dashboard" as WorkspaceTab,
      icon: Briefcase,
      category: "Overview",
    },
    {
      label: "Active Audit Engagements (Apex, Novartis, Green Delta)",
      tab: "engagements" as WorkspaceTab,
      icon: Briefcase,
      category: "Audit",
    },
    {
      label: "Audit Working Papers & Hashes (ISA 220)",
      tab: "audit-files" as WorkspaceTab,
      icon: FileCheck,
      category: "Quality",
    },
    {
      label: "Pending Manager & Partner Sign-offs",
      tab: "reviews" as WorkspaceTab,
      icon: FileCheck,
      category: "Review",
    },
    {
      label: "Staff & Qualified Personnel Directory",
      tab: "people" as WorkspaceTab,
      icon: Users,
      category: "People",
    },
    {
      label: "CA Articleship Trainees & ICAB Registration",
      tab: "students" as WorkspaceTab,
      icon: Users,
      category: "Students",
    },
    {
      label: "Live Audit Timer & Timesheets",
      tab: "timesheets" as WorkspaceTab,
      icon: CheckSquare,
      category: "Operations",
    },
    {
      label: "Invoices, VAT Challans & Office Billing",
      tab: "finance" as WorkspaceTab,
      icon: CreditCard,
      category: "Finance",
    },
    {
      label: "Client PBC Requests & Portal Tracking",
      tab: "client-requests" as WorkspaceTab,
      icon: CheckSquare,
      category: "Client",
    },
  ];

  const filteredItems = quickNavItems.filter(
    (i) =>
      i.label.toLowerCase().includes(query.toLowerCase()) ||
      i.category.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20 text-left">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity"
      />

      <div className="relative mx-auto max-w-xl bg-white rounded-3xl border border-[#EBE6DD] shadow-2xl overflow-hidden animate-fadeIn">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#EBE6DD] bg-[#FAF8F5]">
          <Search className="w-4 h-4 text-stone-400 mr-2.5 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, working paper ref, or client name..."
            className="w-full bg-transparent text-xs text-[#1C1F1E] placeholder-stone-400 focus:outline-none"
          />
          <kbd className="text-[10px] font-mono text-stone-400 bg-white px-1.5 py-0.5 rounded border border-[#E5DDD0]">
            ESC
          </kbd>
        </div>

        {/* AI Action Quick Trigger */}
        <div className="p-2 bg-[#FAF0DE] border-b border-[#EADBBF] flex items-center justify-between px-4">
          <div className="flex items-center space-x-2 text-xs text-[#8A5A18]">
            <Sparkles className="w-3.5 h-3.5 text-[#C58A3E]" />
            <span className="font-semibold">
              Ask ISA / IFRS AI Research Assistant
            </span>
          </div>
          <button
            onClick={() => {
              onClose();
              onOpenAi();
            }}
            className="text-[11px] font-bold text-[#113227] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Launch Copilot</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filteredItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={idx}
                onClick={() => {
                  onSelectTab(item.tab);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-[#FAF8F5] text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-center space-x-3 truncate">
                  <div className="w-7 h-7 rounded-lg bg-[#FAF0DE] flex items-center justify-center text-[#8A5A18] shrink-0 group-hover:bg-[#113227] group-hover:text-white transition-colors">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-semibold text-[#1C1F1E] truncate">
                    {item.label}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider">
                  {item.category}
                </span>
              </button>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="p-6 text-center text-xs text-stone-400">
              No matching modules or files found for &quot;{query}&quot;
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-[#FAF8F5] border-t border-[#EBE6DD] text-center text-[10px] text-stone-400">
          Navigation Shortcut: Use <kbd className="font-mono">↑</kbd>{" "}
          <kbd className="font-mono">↓</kbd> to navigate,{" "}
          <kbd className="font-mono">ENTER</kbd> to select.
        </div>
      </div>
    </div>
  );
};
