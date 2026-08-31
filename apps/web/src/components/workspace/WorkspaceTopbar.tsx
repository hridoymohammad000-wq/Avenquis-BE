import React, { useState } from "react";
import {
  Search,
  Command,
  Sparkles,
  Bell,
  Menu,
  Building,
  ChevronRight,
  ShieldCheck,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCheck,
  Clock,
  AlertTriangle,
  FileCheck,
} from "lucide-react";
import { UserSession, WorkspaceTab } from "../../types";

interface WorkspaceTopbarProps {
  currentUser: UserSession;
  activeTab: WorkspaceTab;
  onOpenMobileSidebar: () => void;
  onOpenAiAssistant: () => void;
  onOpenCommandPalette: () => void;
  unreadNotificationsCount: number;
  isSidebarCollapsed?: boolean;
  onToggleSidebarCollapse?: () => void;
}

export const WorkspaceTopbar: React.FC<WorkspaceTopbarProps> = ({
  currentUser,
  activeTab,
  onOpenMobileSidebar,
  onOpenAiAssistant,
  onOpenCommandPalette,
  unreadNotificationsCount,
  isSidebarCollapsed,
  onToggleSidebarCollapse,
}) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Group and Label Mapping for Editorial Breadcrumbs
  const getTabDetails = (tab: WorkspaceTab) => {
    switch (tab) {
      case "dashboard":
        return { group: "FIRM", title: "Executive Overview & Dashboard" };
      case "people":
        return { group: "FIRM", title: "People & Staff Directory" };
      case "students":
        return { group: "FIRM", title: "Students & Articleship Management" };
      case "crm":
        return {
          group: "CLIENTS & JOBS",
          title: "Client Relationship Management (CRM)",
        };
      case "engagements":
        return {
          group: "CLIENTS & JOBS",
          title: "Engagements & Multi-Disciplinary Teams",
        };
      case "tasks":
        return { group: "OPERATIONS", title: "Tasks & Deadlines" };
      case "timesheets":
        return { group: "OPERATIONS", title: "Timesheets & Billable Hours" };
      case "documents":
        return { group: "AUDIT & DOCS", title: "Document Vault & Storage" };
      case "audit-files":
        return {
          group: "AUDIT & DOCS",
          title: "Working Papers & ISA Compliance",
        };
      case "reviews":
        return { group: "AUDIT & DOCS", title: "Review & Sign-offs Queue" };
      case "client-requests":
        return {
          group: "PRACTICE MGMT",
          title: "Client Requests (PBC Portal)",
        };
      case "finance":
        return { group: "PRACTICE MGMT", title: "Office Finance & Billing" };
      case "settings":
        return {
          group: "PRACTICE MGMT",
          title: "Firm Settings & Quality Controls",
        };
      default:
        return { group: "FIRM OS", title: "Workspace" };
    }
  };

  const { group, title } = getTabDetails(activeTab);

  return (
    <header className="sticky top-0 z-30 h-16 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#EBE6DD] px-4 sm:px-6 lg:px-8 flex items-center justify-between transition-colors">
      {/* Left: Collapse Button (Mobile/Desktop) & Editorial Breadcrumbs */}
      <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
        {/* Mobile Menu Trigger */}
        <button
          id="topbar-mobile-menu-btn"
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 rounded-xl bg-white border border-[#E5DDD0] text-[#1C1F1E] hover:bg-[#F5EFE6] transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* Desktop Quick Collapse/Expand Button in Topbar */}
        {onToggleSidebarCollapse && (
          <button
            onClick={onToggleSidebarCollapse}
            title={
              isSidebarCollapsed
                ? "Expand sidebar (260px)"
                : "Collapse sidebar (72px)"
            }
            className="hidden lg:flex p-2 rounded-xl bg-white hover:bg-[#F5EFE6] border border-[#E5DDD0] text-[#66706B] hover:text-[#113227] transition-colors cursor-pointer"
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4 text-[#113227]" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Global Breadcrumbs with Tenant Indicator */}
        <div className="flex items-center space-x-2 text-xs text-[#66706B] min-w-0">
          {/* Active Tenant Indicator */}
          <div className="hidden sm:flex items-center space-x-1.5 px-2 py-0.8 rounded-lg bg-[#F5EFE6] border border-[#E8DFC0] font-semibold text-[#113227] shrink-0 text-[11px]">
            <Building className="w-3 h-3 text-[#C58A3E]" />
            <span className="truncate max-w-[150px]">{currentUser.tenant}</span>
          </div>

          <span className="text-[#C8D1CC] hidden sm:inline">/</span>

          {/* Group Name */}
          <span className="hidden md:inline font-bold tracking-wider text-[10.5px] uppercase text-[#8A9691] shrink-0">
            {group}
          </span>

          <ChevronRight className="w-3.5 h-3.5 text-[#A8B2AD] shrink-0 hidden md:inline" />

          {/* Active View Title */}
          <span className="font-bold text-[#1C1F1E] truncate text-xs sm:text-sm">
            {title}
          </span>
        </div>
      </div>

      {/* Right: Search Shortcut, AI Copilot, Audit Status, Notifications, User Badge */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Global Search / Command Bar Trigger (Cmd + K) */}
        <button
          id="global-command-palette-btn"
          onClick={onOpenCommandPalette}
          className="flex items-center space-x-2 px-2.5 sm:px-3 py-1.5 bg-white hover:bg-[#FDFBF7] border border-[#E5DDD0] rounded-xl text-xs text-[#78857F] hover:text-[#1C1F1E] shadow-2xs transition-all cursor-pointer group"
        >
          <Search className="w-3.5 h-3.5 text-[#8A9691] group-hover:text-[#113227]" />
          <span className="hidden md:inline font-medium text-[11.5px]">
            Search papers, clients, tasks...
          </span>
          <span className="md:hidden font-medium text-[11.5px]">Search...</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[9px] font-mono font-semibold text-[#66706B] bg-[#F2ECE1] border border-[#DDD5C7] rounded">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </button>

        {/* AI Assistant Quick Trigger ("Ask ISA AI") */}
        <button
          id="topbar-ask-ai-btn"
          onClick={onOpenAiAssistant}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-[#E1F3EE] hover:bg-[#D2EFE7] border border-[#BDE5D9] text-[#1F5946] text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#C58A3E]" />
          <span className="hidden sm:inline">Ask ISA AI</span>
        </button>

        {/* Firm Status Indicator Pill */}
        <div className="hidden xl:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#FAF0DE] border border-[#EADBBF] text-[#8A5A18] text-[10.5px] font-bold">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span>Audit Season Live</span>
        </div>

        {/* Notification Bell & Popover Trigger */}
        <div className="relative">
          <button
            id="topbar-notifications-btn"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 rounded-xl bg-white border border-[#E5DDD0] text-[#66706B] hover:text-[#1C1F1E] hover:bg-[#F5EFE6] transition-colors relative cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#8E362C] rounded-full ring-2 ring-white" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {notificationsOpen && (
            <div className="motion-popover absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-[#E5DDD0] p-4 z-50 animate-fadeIn text-left">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
                <div>
                  <h4 className="text-xs font-bold text-[#1C1F1E]">
                    Practice &amp; Audit Alerts
                  </h4>
                  <p className="text-[10px] text-[#78857F]">
                    {unreadNotificationsCount} actionable items require your
                    sign-off
                  </p>
                </div>
                <span className="text-[10px] font-semibold text-[#113227] bg-[#E1F3EE] px-2 py-0.5 rounded-full">
                  Real-time
                </span>
              </div>

              <div className="py-2.5 space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                <div className="p-2.5 rounded-xl bg-[#FDF8F0] border border-[#F2E5D0]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#8A5A18] flex items-center gap-1">
                      <FileCheck className="w-3 h-3" /> Working Paper B-200
                      Submitted
                    </span>
                    <span className="text-[9px] text-[#A3ADA8]">10m ago</span>
                  </div>
                  <p className="text-xs text-[#3D4742] mt-1 leading-relaxed">
                    Sabbir Ahmed uploaded Bank Reconciliation working paper for
                    Apex Footwear.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#FDF0EE] border border-[#F4D9D5]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#8E362C] flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Client PBC Overdue
                    </span>
                    <span className="text-[9px] text-[#A3ADA8]">1h ago</span>
                  </div>
                  <p className="text-xs text-[#3D4742] mt-1 leading-relaxed">
                    Fixed Asset Register from Orbit Textiles is past target due
                    date.
                  </p>
                </div>

                <div className="p-2.5 rounded-xl bg-[#EBF7F2] border border-[#CFEFE2]">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#1F5946] flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Timesheet Batch Logged
                    </span>
                    <span className="text-[9px] text-[#A3ADA8]">3h ago</span>
                  </div>
                  <p className="text-xs text-[#3D4742] mt-1 leading-relaxed">
                    42.5 billable hours verified and synced with practice
                    accounting.
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-[#F0EBE1] flex items-center justify-between text-[11px]">
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="font-bold text-[#113227] hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all as read
                </button>
                <span className="text-[#8A9691] text-[10px]">
                  AVENQUIS Notification Hub
                </span>
              </div>
            </div>
          )}
        </div>

        {/* User Mini Avatar */}
        <div className="hidden sm:flex items-center space-x-2 pl-1 border-l border-[#E5DDD0]">
          <div
            title={`${currentUser.name} (${currentUser.role})`}
            className="w-8 h-8 rounded-full bg-[#113227] text-white font-bold text-xs flex items-center justify-center border border-[#C58A3E] shadow-2xs select-none"
          >
            {currentUser.initials}
          </div>
        </div>
      </div>
    </header>
  );
};
