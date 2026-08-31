import React, { useState } from "react";
import {
  Building2,
  ChevronDown,
  LayoutDashboard,
  Users,
  GraduationCap,
  Briefcase,
  FolderGit2,
  CheckSquare,
  Clock,
  FileBox,
  FileCheck,
  Award,
  Inbox,
  CreditCard,
  Settings,
  Sparkles,
  LogOut,
  X,
  ExternalLink,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  Check,
  Building,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { WorkspaceTab, UserSession } from "../../types";
import { AVAILABLE_TENANTS as DEFAULT_TENANTS } from "../../data/workspaceData";

export interface TenantItem {
  id: string;
  name: string;
  location: string;
  activeEngagements: number;
}

interface WorkspaceSidebarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  currentUser: UserSession;
  onSwitchTenant: (tenantName: string) => void;
  onOpenAiAssistant: () => void;
  onSignOut: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  pendingReviewsCount: number;
  openRequestsCount: number;
  availableTenants?: TenantItem[];
  onAddNewTenant?: (tenant: TenantItem) => void;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onSwitchTenant,
  onOpenAiAssistant,
  onSignOut,
  isOpenMobile,
  onCloseMobile,
  isCollapsed = false,
  onToggleCollapse,
  pendingReviewsCount,
  openRequestsCount,
  availableTenants = DEFAULT_TENANTS,
  onAddNewTenant,
}) => {
  const [tenantDropdownOpen, setTenantDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAddFirmModalOpen, setIsAddFirmModalOpen] = useState(false);
  const [newFirmName, setNewFirmName] = useState("");
  const [newFirmLocation, setNewFirmLocation] = useState("");

  // Exact Requested Navigation Groupings
  const navSections = [
    {
      group: "FIRM",
      items: [
        {
          id: "dashboard" as WorkspaceTab,
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        { id: "people" as WorkspaceTab, label: "People & Staff", icon: Users },
        {
          id: "students" as WorkspaceTab,
          label: "Students/Articleship",
          icon: GraduationCap,
        },
      ],
    },
    {
      group: "CLIENTS & JOBS",
      items: [
        { id: "crm" as WorkspaceTab, label: "Client CRM", icon: Briefcase },
        {
          id: "engagements" as WorkspaceTab,
          label: "Engagements & Teams",
          icon: FolderGit2,
        },
      ],
    },
    {
      group: "OPERATIONS",
      items: [
        {
          id: "tasks" as WorkspaceTab,
          label: "Tasks & Deadlines",
          icon: CheckSquare,
        },
        { id: "timesheets" as WorkspaceTab, label: "Timesheets", icon: Clock },
      ],
    },
    {
      group: "AUDIT & DOCS",
      items: [
        {
          id: "documents" as WorkspaceTab,
          label: "Document Vault",
          icon: FileBox,
        },
        {
          id: "audit-files" as WorkspaceTab,
          label: "Working Papers",
          icon: FileCheck,
        },
        {
          id: "reviews" as WorkspaceTab,
          label: "Review & Sign-offs",
          icon: Award,
          badge: pendingReviewsCount > 0 ? `${pendingReviewsCount}` : undefined,
          badgeColor: "bg-[#C58A3E] text-white",
        },
      ],
    },
    {
      group: "PRACTICE MGMT",
      items: [
        {
          id: "client-requests" as WorkspaceTab,
          label: "Client Requests",
          icon: Inbox,
          badge: openRequestsCount > 0 ? `${openRequestsCount}` : undefined,
          badgeColor: "bg-[#8E362C] text-white",
        },
        {
          id: "finance" as WorkspaceTab,
          label: "Office Finance",
          icon: CreditCard,
        },
        { id: "settings" as WorkspaceTab, label: "Settings", icon: Settings },
      ],
    },
  ];

  const handleCreateFirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFirmName.trim()) return;

    const newTenant: TenantItem = {
      id: `firm-${Date.now()}`,
      name: newFirmName.trim(),
      location: newFirmLocation.trim() || "Principal Office",
      activeEngagements: 0,
    };

    onAddNewTenant?.(newTenant);
    onSwitchTenant(newTenant.name);
    setNewFirmName("");
    setNewFirmLocation("");
    setIsAddFirmModalOpen(false);
    setTenantDropdownOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="motion-backdrop fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container: 260px expanded / 72px collapsed */}
      <aside
        className={`motion-drawer fixed top-0 bottom-0 left-0 z-50 bg-[#FAF7F2] border-r border-[#EBE6DD] flex flex-col transition-all duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        } ${isCollapsed ? "w-[72px]" : "w-[260px]"}`}
      >
        {/* Top Header: Brand & Tenant Switcher */}
        <div className="p-3.5 border-b border-[#EBE6DD] bg-white/70">
          <div className="flex items-center justify-between mb-2.5">
            {!isCollapsed ? (
              <div className="flex items-center space-x-2 min-w-0">
                <span className="text-sm font-serif font-black tracking-[0.14em] text-[#113227] select-none uppercase truncate">
                  AVEN
                  <span className="text-[#C58A3E] font-sans font-light tracking-normal mx-0.5">
                    —
                  </span>
                  QUIS
                </span>
                <span className="text-[8.5px] bg-[#113227] text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider shrink-0">
                  FIRM OS
                </span>
              </div>
            ) : (
              <div className="mx-auto">
                <div className="w-8 h-8 rounded-lg bg-[#113227] text-[#C58A3E] font-serif font-bold text-xs flex items-center justify-center shadow-2xs">
                  AQ
                </div>
              </div>
            )}

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-[#66706B] hover:text-[#1C1F1E] rounded-md"
              aria-label="Close sidebar"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Desktop Collapse / Expand Toggle */}
            {onToggleCollapse && (
              <button
                id="sidebar-toggle-collapse-btn"
                onClick={onToggleCollapse}
                title={
                  isCollapsed
                    ? "Expand sidebar (260px)"
                    : "Collapse sidebar (72px)"
                }
                className="hidden lg:flex p-1 text-[#78857F] hover:text-[#113227] hover:bg-[#FAF7F2] rounded-md transition-colors cursor-pointer"
                aria-label="Toggle sidebar collapse"
              >
                {isCollapsed ? (
                  <PanelLeftOpen className="w-4 h-4 text-[#113227]" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}
          </div>

          {/* Active Tenant Selector */}
          {!isCollapsed ? (
            <div className="relative">
              <button
                id="tenant-switcher-btn"
                onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
                className="w-full flex items-center justify-between p-2 rounded-xl bg-[#F5EFE6] hover:bg-[#EFE7DC] border border-[#E5DDD0] text-left transition-colors cursor-pointer"
              >
                <div className="flex items-center space-x-2 truncate">
                  <div className="w-6 h-6 rounded-lg bg-[#113227] text-[#C58A3E] flex items-center justify-center shrink-0">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#1C1F1E] truncate leading-tight">
                      {currentUser.tenant}
                    </p>
                    <p className="text-[10px] text-[#78857F] leading-none mt-0.5 truncate">
                      Current Firm
                    </p>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#66706B] shrink-0 ml-1" />
              </button>

              {/* Multi-Tenant Switcher Dropdown */}
              {tenantDropdownOpen && (
                <div className="motion-popover absolute top-full left-0 right-0 mt-1.5 p-1.5 bg-white rounded-xl shadow-xl border border-[#E5DDD0] z-50 animate-fadeIn">
                  <div className="px-2 py-1 text-[9.5px] font-bold uppercase tracking-wider text-[#8A9691] border-b border-[#F0EBE1] flex items-center justify-between">
                    <span>Active Firm Memberships</span>
                    <span className="text-[8px] bg-stone-100 text-stone-600 px-1 py-0.2 rounded font-mono">
                      {availableTenants.length} Units
                    </span>
                  </div>
                  <div className="py-1 max-h-48 overflow-y-auto space-y-1">
                    {availableTenants.map((t) => {
                      const isActive = currentUser.tenant === t.name;
                      return (
                        <button
                          key={t.id}
                          onClick={() => {
                            onSwitchTenant(t.name);
                            setTenantDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between cursor-pointer ${
                            isActive
                              ? "bg-[#E1F3EE] text-[#113227] font-semibold"
                              : "hover:bg-[#FAF7F2] text-[#333]"
                          }`}
                        >
                          <div className="truncate pr-2">
                            <span className="font-bold truncate block">
                              {t.name}
                            </span>
                            <span className="text-[10px] opacity-75 block truncate">
                              {t.location} • {t.activeEngagements} Engagements
                            </span>
                          </div>
                          {isActive && (
                            <Check className="w-3.5 h-3.5 text-[#113227] shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* "+ Add New Firm" Option */}
                  <div className="pt-1.5 border-t border-[#F0EBE1]">
                    <button
                      id="sidebar-add-new-firm-btn"
                      onClick={() => setIsAddFirmModalOpen(true)}
                      className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-2 rounded-lg text-xs font-semibold text-[#113227] bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-dashed border-[#DDD5C7] transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#C58A3E]" />
                      <span>Add New Firm</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Collapsed Tenant Icon */
            <div className="flex justify-center">
              <button
                onClick={() => setTenantDropdownOpen(!tenantDropdownOpen)}
                title={`Active: ${currentUser.tenant}`}
                className="w-9 h-9 rounded-xl bg-[#F5EFE6] hover:bg-[#EFE7DC] border border-[#E5DDD0] flex items-center justify-center cursor-pointer text-[#113227]"
              >
                <Building2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* AI Quick Trigger Button */}
        <div className="px-2.5 pt-2.5">
          {!isCollapsed ? (
            <button
              id="sidebar-ai-btn"
              onClick={onOpenAiAssistant}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-gradient-to-r from-[#113227] to-[#1E4D3E] text-white shadow-2xs hover:opacity-95 transition-all cursor-pointer group"
            >
              <div className="flex items-center space-x-2 truncate">
                <div className="w-6 h-6 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#C58A3E] group-hover:scale-110 transition-transform" />
                </div>
                <div className="text-left truncate">
                  <p className="text-xs font-bold leading-tight flex items-center gap-1">
                    <span>AI Copilot</span>
                    <span className="text-[8px] bg-[#C58A3E] text-black px-1 rounded-full font-bold">
                      ISA
                    </span>
                  </p>
                  <p className="text-[9.5px] text-[#A6C4B9] leading-tight truncate">
                    Audit &amp; Tax Research
                  </p>
                </div>
              </div>
              <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 shrink-0" />
            </button>
          ) : (
            <div className="flex justify-center">
              <button
                id="sidebar-ai-collapsed-btn"
                onClick={onOpenAiAssistant}
                title="AI Audit Copilot (ISA & Tax Guidance)"
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#113227] to-[#1E4D3E] text-white flex items-center justify-center shadow-2xs hover:scale-105 transition-transform cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-[#C58A3E]" />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Sections: FIRM, CLIENTS & JOBS, OPERATIONS, AUDIT & DOCS, PRACTICE MGMT */}
        <div className="flex-1 overflow-y-auto px-2.5 py-2 space-y-3.5 custom-scrollbar">
          {navSections.map((sec, idx) => (
            <div key={idx}>
              {!isCollapsed ? (
                <p className="px-2 text-[9px] font-extrabold uppercase tracking-widest text-[#88948F] mb-1">
                  {sec.group}
                </p>
              ) : (
                <div className="h-px bg-[#EBE6DD] my-1.5 mx-1" />
              )}
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      id={`sidebar-nav-${item.id}`}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobile();
                      }}
                      title={isCollapsed ? item.label : undefined}
                      className={`w-full flex items-center ${
                        isCollapsed
                          ? "justify-center px-0 py-2.5"
                          : "justify-between px-2.5 py-1.5"
                      } motion-nav-item rounded-xl text-xs font-medium transition-all cursor-pointer group relative ${
                        isActive
                          ? "bg-[#113227] text-white shadow-2xs font-semibold"
                          : "text-[#3D4742] hover:bg-white/80 hover:text-[#113227]"
                      }`}
                    >
                      <div
                        className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-2"} truncate`}
                      >
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive
                              ? "text-[#C58A3E]"
                              : "text-[#66706B] group-hover:text-[#113227]"
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate">{item.label}</span>
                        )}
                      </div>

                      {!isCollapsed && item.badge && (
                        <span
                          className={`motion-badge text-[9.5px] font-bold px-1.5 py-0.2 rounded-full ${
                            item.badgeColor || "bg-stone-200 text-stone-700"
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}

                      {/* Collapsed Mode Badge Indicator */}
                      {isCollapsed && item.badge && (
                        <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#C58A3E] ring-1 ring-white" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User Profile Footer & Session Switcher */}
        <div className="p-2.5 border-t border-[#EBE6DD] bg-white/70">
          {!isCollapsed ? (
            <div className="relative">
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#FAF7F2] border border-[#EAE4D8]">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 truncate text-left flex-1 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-[#113227] text-white font-bold text-xs flex items-center justify-center shrink-0 border border-[#C58A3E]">
                    {currentUser.initials}
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-[#1C1F1E] truncate leading-tight">
                      {currentUser.name}
                    </p>
                    <p className="text-[9.5px] text-[#1F5946] font-semibold truncate leading-tight">
                      {currentUser.role}
                    </p>
                  </div>
                </button>

                <button
                  id="sidebar-signout-btn"
                  onClick={onSignOut}
                  title="Sign Out to Landing Portal"
                  className="p-1.5 text-[#66706B] hover:text-[#8E362C] hover:bg-white rounded-lg transition-colors cursor-pointer shrink-0 ml-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* User Session Quick Switcher Flyout */}
              {userMenuOpen && (
                <div className="motion-popover absolute bottom-full left-0 right-0 mb-2 p-2 bg-white rounded-xl shadow-xl border border-[#E5DDD0] z-50 animate-fadeIn text-xs">
                  <div className="pb-1.5 border-b border-[#F0EBE1]">
                    <p className="font-bold text-[#1C1F1E]">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-[#78857F] truncate">
                      {currentUser.email}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-[9.5px] font-semibold text-[#113227] bg-[#E1F3EE] px-1.5 py-0.5 rounded w-fit">
                      <UserCheck className="w-3 h-3" /> Active Session
                    </div>
                  </div>
                  <div className="pt-1.5 space-y-1">
                    <button
                      onClick={() => {
                        onSelectTab("settings");
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left p-1.5 rounded-md hover:bg-[#FAF7F2] text-[#333] flex items-center space-x-1.5"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#66706B]" />
                      <span>Security &amp; Preferences</span>
                    </button>
                    <button
                      onClick={onSignOut}
                      className="w-full text-left p-1.5 rounded-md hover:bg-red-50 text-[#8E362C] font-semibold flex items-center space-x-1.5"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Collapsed Profile Avatar */
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={onSignOut}
                title={`${currentUser.name} (${currentUser.role}) — Click to Sign Out`}
                className="w-8 h-8 rounded-full bg-[#113227] text-white font-bold text-xs flex items-center justify-center border border-[#C58A3E] hover:ring-2 hover:ring-[#113227] cursor-pointer"
              >
                {currentUser.initials}
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Add New Firm Modal */}
      {isAddFirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5DDD0] animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#113227] text-[#C58A3E] flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-serif text-[#1C1F1E]">
                    Add New Firm / Entity
                  </h3>
                  <p className="text-[11px] text-[#78857F]">
                    Create a separated multi-tenant workspace
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddFirmModalOpen(false)}
                className="p-1 rounded-md text-[#66706B] hover:text-[#1C1F1E] hover:bg-[#FAF7F2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateFirm}
              className="mt-4 space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-[#1C1F1E] mb-1">
                  Firm or Entity Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sterling &amp; Co. Chartered Accountants"
                  value={newFirmName}
                  onChange={(e) => setNewFirmName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#113227]/20"
                />
              </div>

              <div>
                <label className="block font-bold text-[#1C1F1E] mb-1">
                  Practice Location / Regional Hub
                </label>
                <input
                  type="text"
                  placeholder="e.g. Singapore / Metro Hub Branch"
                  value={newFirmLocation}
                  onChange={(e) => setNewFirmLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#113227]/20"
                />
              </div>

              <div className="p-3 bg-[#FAF7F2] border border-[#EAE4D8] rounded-xl text-[11px] text-[#55615B] leading-relaxed">
                <span className="font-semibold text-[#113227]">
                  Multi-Tenant Isolation:
                </span>{" "}
                New firms will receive isolated working paper registers, staff
                lists, and ICAB/ISA compliance governance.
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-[#F0EBE1]">
                <button
                  type="button"
                  onClick={() => setIsAddFirmModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl border border-[#E5DDD0] text-[#66706B] hover:bg-[#FAF7F2] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#113227] text-white hover:bg-[#1A4B3A] font-bold shadow-xs flex items-center space-x-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Workspace</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
