import React, { useState } from "react";
import {
  Settings,
  ShieldCheck,
  Building,
  Key,
  Database,
  Sliders,
  CheckCircle2,
  Lock,
  Globe,
  Smartphone,
  Laptop,
  AlertTriangle,
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw,
  LogOut,
  Image as ImageIcon,
  Check,
} from "lucide-react";
import {
  UserSession,
  FirmProfile,
  UserSessionRecord,
  SecurityEventLog,
} from "../../types";
import { TotpMfaModal } from "./settings/TotpMfaModal";

interface SettingsViewProps {
  currentUser: UserSession;
  firmProfile: FirmProfile;
  userSessions: UserSessionRecord[];
  securityLogs: SecurityEventLog[];
  onUpdateTenantName: (newName: string) => void;
  onUpdateFirmProfile: (profile: Partial<FirmProfile>) => void;
  onRevokeSession: (sessionId: string) => void;
  onRevokeAllOtherSessions: () => void;
  onToggleMfa: (enabled: boolean) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  currentUser,
  firmProfile,
  userSessions,
  securityLogs,
  onUpdateTenantName,
  onUpdateFirmProfile,
  onRevokeSession,
  onRevokeAllOtherSessions,
  onToggleMfa,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<
    "profile" | "security" | "audit_logs" | "quality_defaults"
  >("profile");

  // Firm Profile Local State
  const [profileForm, setProfileForm] = useState<FirmProfile>(firmProfile);
  const [selectedLogo, setSelectedLogo] = useState<string>("crest-gold");

  // Security State
  const [isMfaEnabled, setIsMfaEnabled] = useState(true);
  const [isTotpModalOpen, setIsTotpModalOpen] = useState(false);

  // Quality & Defaults
  const [isa220Enforced, setIsa220Enforced] = useState(true);
  const [immutableHashing, setImmutableHashing] = useState(true);
  const [vatRate, setVatRate] = useState(15);
  const [currency, setCurrency] = useState("BDT");

  // Audit Logs Filter
  const [logSearch, setLogSearch] = useState("");
  const [logFilter, setLogFilter] = useState<string>("All");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateFirmProfile(profileForm);
    onUpdateTenantName(profileForm.firmName);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleMfaToggle = (checked: boolean) => {
    if (checked) {
      setIsTotpModalOpen(true);
    } else {
      setIsMfaEnabled(false);
      onToggleMfa(false);
    }
  };

  const handleMfaConfirmed = () => {
    setIsMfaEnabled(true);
    onToggleMfa(true);
  };

  const filteredLogs = securityLogs.filter((log) => {
    const matchesSearch =
      log.actor.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.actionSummary.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.ipAddress.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.eventType.toLowerCase().includes(logSearch.toLowerCase());

    const matchesType =
      logFilter === "All" ||
      log.eventType === logFilter ||
      log.severity === logFilter;
    return matchesSearch && matchesType;
  });

  const handleExportAuditTrail = () => {
    const jsonStr = JSON.stringify(securityLogs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `security-audit-trail-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left max-w-6xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-2 bg-[#FAF0DE] px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-[#8A5A18] mb-2">
            <span>PRACTICE GOVERNANCE &amp; SECURITY CONTROLS</span>
            <span className="text-[#C58A3E] font-serif">✦</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1F1E] tracking-tight">
            Firm Settings &amp; Security Center
          </h1>
          <p className="text-xs sm:text-sm text-[#66706B] mt-1">
            ICAB registration profile, TOTP multi-factor security, concurrent
            user session management, and immutable audit logs.
          </p>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center space-x-1.5 bg-[#FAF7F2] p-1.5 rounded-2xl border border-[#E8E1D5] shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab("profile")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeSubTab === "profile"
                ? "bg-[#113227] text-white shadow-xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <Building className="w-4 h-4" />
            <span>Firm Profile</span>
          </button>
          <button
            onClick={() => setActiveSubTab("security")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeSubTab === "security"
                ? "bg-[#113227] text-white shadow-xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              Security &amp; Sessions (
              {userSessions.filter((s) => s.status === "Active").length})
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab("audit_logs")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeSubTab === "audit_logs"
                ? "bg-[#113227] text-white shadow-xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Security Event Logs</span>
          </button>
          <button
            onClick={() => setActiveSubTab("quality_defaults")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              activeSubTab === "quality_defaults"
                ? "bg-[#113227] text-white shadow-xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>ISA 220 &amp; Billing</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-[#E1F3EE] border border-[#BDE5D9] text-[#1F5946] text-xs font-bold flex items-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-[#1F5946]" />
          <span>
            Practice profile and settings synchronized across all active
            workspace terminals.
          </span>
        </div>
      )}

      {/* 1. Firm Profile Form */}
      {activeSubTab === "profile" && (
        <form onSubmit={handleProfileSave} className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div className="flex items-center space-x-2.5">
                <Building className="w-4 h-4 text-[#113227]" />
                <h3 className="text-sm font-bold text-[#1C1F1E]">
                  Chartered Accountancy Practice Identity
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF0DE] text-[#8A5A18]">
                ICAB Regulated Unit
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                  Firm Legal Name *
                </label>
                <input
                  type="text"
                  value={profileForm.firmName}
                  onChange={(e) =>
                    setProfileForm({ ...profileForm, firmName: e.target.value })
                  }
                  required
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] font-medium focus:outline-none focus:border-[#113227]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                  ICAB Firm Registration No (FRN) *
                </label>
                <input
                  type="text"
                  value={profileForm.firmRegistrationNo}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      firmRegistrationNo: e.target.value,
                    })
                  }
                  required
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs font-mono font-bold text-[#113227] focus:outline-none focus:border-[#113227]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                  Trade License Number
                </label>
                <input
                  type="text"
                  value={profileForm.tradeLicenseNo || ""}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      tradeLicenseNo: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                  Taxpayer TIN (12-Digit)
                </label>
                <input
                  type="text"
                  value={profileForm.taxIdentificationNo}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      taxIdentificationNo: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs font-mono text-[#1C1F1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                  Business Identification Number (BIN)
                </label>
                <input
                  type="text"
                  value={profileForm.binNumber}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      binNumber: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs font-mono text-[#1C1F1E] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                Principal Office Address (for Letterheads &amp; Invoices) *
              </label>
              <input
                type="text"
                value={profileForm.principalAddress}
                onChange={(e) =>
                  setProfileForm({
                    ...profileForm,
                    principalAddress: e.target.value,
                  })
                }
                required
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:border-[#113227]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                  Official Contact Email
                </label>
                <input
                  type="email"
                  value={profileForm.contactEmail}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      contactEmail: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                  Telephone &amp; Mobile Desk
                </label>
                <input
                  type="text"
                  value={profileForm.contactPhone}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      contactPhone: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                  Managing / Quality Partner
                </label>
                <input
                  type="text"
                  value={profileForm.managingPartner}
                  onChange={(e) =>
                    setProfileForm({
                      ...profileForm,
                      managingPartner: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs font-semibold text-[#113227] focus:outline-none"
                />
              </div>
            </div>

            {/* Firm Logo & Seal Selector */}
            <div className="pt-3 border-t border-[#F0EBE1] space-y-3">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                Official Practice Crest &amp; Letterhead Seal
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setSelectedLogo("crest-gold")}
                  className={`p-3.5 rounded-2xl border flex items-center space-x-3 cursor-pointer transition-all ${
                    selectedLogo === "crest-gold"
                      ? "border-[#113227] bg-[#FAF8F5] ring-2 ring-[#113227]/20 shadow-xs"
                      : "border-[#EBE6DD] bg-white hover:bg-[#FAF8F5]"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#113227] text-[#C58A3E] flex items-center justify-center font-serif font-bold text-sm">
                    AQ
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1C1F1E]">
                      Classic Gold Emblem
                    </div>
                    <div className="text-[10px] text-stone-500">
                      ICAB Standard Seal
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedLogo("crest-emerald")}
                  className={`p-3.5 rounded-2xl border flex items-center space-x-3 cursor-pointer transition-all ${
                    selectedLogo === "crest-emerald"
                      ? "border-[#113227] bg-[#FAF8F5] ring-2 ring-[#113227]/20 shadow-xs"
                      : "border-[#EBE6DD] bg-white hover:bg-[#FAF8F5]"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#1F5946] text-white flex items-center justify-center font-serif font-bold text-sm">
                    FR
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1C1F1E]">
                      Emerald Executive
                    </div>
                    <div className="text-[10px] text-stone-500">
                      FAMES &amp; R Practice
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setSelectedLogo("crest-modern")}
                  className={`p-3.5 rounded-2xl border flex items-center space-x-3 cursor-pointer transition-all ${
                    selectedLogo === "crest-modern"
                      ? "border-[#113227] bg-[#FAF8F5] ring-2 ring-[#113227]/20 shadow-xs"
                      : "border-[#EBE6DD] bg-white hover:bg-[#FAF8F5]"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-stone-900 text-[#C58A3E] flex items-center justify-center font-serif font-bold text-sm">
                    ✦
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#1C1F1E]">
                      Minimalist Monogram
                    </div>
                    <div className="text-[10px] text-stone-500">
                      International Advisory
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#F0EBE1] flex justify-end">
              <button
                type="submit"
                className="btn-forest px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs cursor-pointer"
              >
                <Check className="w-4 h-4 text-[#C58A3E]" />
                <span>Save Practice Profile</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 2. Security, TOTP MFA & Active Sessions */}
      {activeSubTab === "security" && (
        <div className="space-y-6">
          {/* TOTP MFA Status Toggle Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-4 h-4 text-[#1F5946]" />
                <h3 className="text-sm font-bold text-[#1C1F1E]">
                  Two-Factor Authentication (TOTP MFA)
                </h3>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isMfaEnabled
                    ? "bg-[#E1F3EE] text-[#1F5946]"
                    : "bg-[#FDE6E2] text-[#8E362C]"
                }`}
              >
                {isMfaEnabled ? "MFA Enforced" : "MFA Disabled"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D9]">
              <div className="space-y-1">
                <span className="text-xs font-bold text-[#1C1F1E] block">
                  Time-based One-Time Password (RFC 6238 TOTP)
                </span>
                <p className="text-xs text-[#66706B] max-w-xl">
                  Require 6-digit authenticator code on login and cryptographic
                  digital signature stamp execution (ISA 220 compliance).
                </p>
              </div>

              <div className="flex items-center space-x-3 shrink-0">
                {isMfaEnabled && (
                  <button
                    type="button"
                    onClick={() => setIsTotpModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5DDD0] text-stone-700 text-xs font-semibold cursor-pointer"
                  >
                    Reconfigure Key
                  </button>
                )}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMfaEnabled}
                    onChange={(e) => handleMfaToggle(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#113227]" />
                </label>
              </div>
            </div>
          </div>

          {/* Active Concurrent User Sessions */}
          <div className="p-6 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0EBE1]">
              <div className="flex items-center space-x-2.5">
                <Laptop className="w-4 h-4 text-[#113227]" />
                <div>
                  <h3 className="text-sm font-bold text-[#1C1F1E]">
                    Active Concurrent User Sessions
                  </h3>
                  <p className="text-xs text-stone-500">
                    Inspect all devices logged into your chartered accountancy
                    user credentials.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onRevokeAllOtherSessions}
                className="px-3 py-1.5 rounded-xl bg-[#FDE6E2] hover:bg-[#F9D2CB] text-[#8E362C] text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer self-start sm:self-auto"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Revoke All Other Sessions</span>
              </button>
            </div>

            <div className="space-y-3">
              {userSessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                    session.isCurrentSession
                      ? "bg-[#E1F3EE]/40 border-[#BDE5D9]"
                      : session.status === "Revoked"
                        ? "bg-stone-50 border-stone-200 opacity-60"
                        : "bg-[#FAF8F5] border-[#E8E1D5]"
                  }`}
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-9 h-9 rounded-xl bg-white border border-[#E5DDD0] text-[#113227] flex items-center justify-center shrink-0 shadow-2xs">
                      {session.device.includes("iPhone") ||
                      session.device.includes("Android") ? (
                        <Smartphone className="w-4 h-4" />
                      ) : (
                        <Laptop className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[#1C1F1E]">
                          {session.device}
                        </span>
                        {session.isCurrentSession && (
                          <span className="text-[9px] font-extrabold uppercase tracking-wider bg-[#113227] text-white px-2 py-0.2 rounded-full">
                            Current Session
                          </span>
                        )}
                        {session.status === "Revoked" && (
                          <span className="text-[9px] font-bold bg-[#FDE6E2] text-[#8E362C] px-2 py-0.2 rounded-full">
                            Revoked
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-[#66706B] mt-0.5 space-x-2">
                        <span>
                          Browser:{" "}
                          <strong className="text-stone-700">
                            {session.browser}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          IP:{" "}
                          <strong className="font-mono text-stone-700">
                            {session.ipAddress}
                          </strong>
                        </span>
                      </div>
                      <div className="text-[10.5px] text-stone-400 mt-0.5">
                        Location: {session.location} • Last Activity:{" "}
                        <strong className="text-stone-600">
                          {session.lastActive}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    {!session.isCurrentSession &&
                      session.status === "Active" && (
                        <button
                          onClick={() => onRevokeSession(session.id)}
                          className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FDE6E2] border border-[#E5DDD0] hover:border-[#F5C7C1] text-stone-600 hover:text-[#8E362C] text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Revoke Access
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Append-Only Security Event Log Viewer */}
      {activeSubTab === "audit_logs" && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0EBE1]">
              <div>
                <div className="flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-[#113227]" />
                  <h3 className="text-sm font-bold text-[#1C1F1E]">
                    Immutable Security Event Log
                  </h3>
                </div>
                <p className="text-xs text-stone-500 mt-0.5">
                  Append-only cryptographic security audit trail capturing
                  authentication, sign-off seals, and key rotations.
                </p>
              </div>

              <button
                onClick={handleExportAuditTrail}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5DDD0] text-stone-700 text-xs font-semibold flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer self-start sm:self-auto"
              >
                <Download className="w-3.5 h-3.5 text-[#C58A3E]" />
                <span>Export Audit Trail (JSON)</span>
              </button>
            </div>

            {/* Filter / Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Filter logs by actor, IP, or keyword..."
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:border-[#113227]"
                />
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto">
                <Filter className="w-3.5 h-3.5 text-stone-400" />
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="px-2.5 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs font-semibold text-[#1C1F1E] focus:outline-none"
                >
                  <option value="All">All Event Types</option>
                  <option value="AUTH_LOGIN">AUTH_LOGIN</option>
                  <option value="MFA_VERIFY">MFA_VERIFY</option>
                  <option value="SIGNOFF_SEAL">SIGNOFF_SEAL</option>
                  <option value="EXPORT_LEDGER">EXPORT_LEDGER</option>
                  <option value="KEY_ROTATION">KEY_ROTATION</option>
                  <option value="SESSION_REVOKED">SESSION_REVOKED</option>
                </select>
              </div>
            </div>

            {/* Security Logs Table */}
            <div className="border border-[#EBE6DD] rounded-2xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#EBE6DD] text-[#7A8782] font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Timestamp &amp; Event</th>
                    <th className="px-4 py-3">Actor &amp; Role</th>
                    <th className="px-4 py-3">IP Address &amp; Resource</th>
                    <th className="px-4 py-3">Action Details</th>
                    <th className="px-4 py-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1] text-[#1C1F1E]">
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="hover:bg-[#FAF8F5] transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="font-mono text-[11px] font-bold text-stone-800">
                          {log.timestamp}
                        </div>
                        <span
                          className={`text-[9.5px] font-mono font-bold px-1.5 py-0.2 rounded mt-1 inline-block ${
                            log.severity === "Warning"
                              ? "bg-[#FDE6E2] text-[#8E362C]"
                              : log.severity === "Notice"
                                ? "bg-[#FAF0DE] text-[#8A5A18]"
                                : "bg-[#E1F3EE] text-[#1F5946]"
                          }`}
                        >
                          {log.eventType}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 font-medium">
                        <div className="text-stone-900 font-semibold">
                          {log.actor}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          {log.actorRole}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 font-mono text-[11px] text-stone-600">
                        <div>{log.ipAddress}</div>
                        {log.resourceRef && (
                          <div className="text-[10px] text-stone-400">
                            Ref: {log.resourceRef}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-stone-700 text-xs max-w-sm">
                        {log.actionSummary}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E1F3EE] text-[#1F5946] border border-[#BDE5D9]">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. ISA 220 & Billing Defaults */}
      {activeSubTab === "quality_defaults" && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-[#F0EBE1]">
              <ShieldCheck className="w-4 h-4 text-[#1F5946]" />
              <h3 className="text-sm font-bold text-[#1C1F1E]">
                International Standards on Auditing (ISA 220) Controls
              </h3>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D9]">
                <div>
                  <span className="text-xs font-bold text-[#1C1F1E] block">
                    Mandatory Manager &amp; EQCR Sign-Off Enactment
                  </span>
                  <span className="text-[11px] text-[#66706B]">
                    Lock all final audit reports until 100% of working papers
                    are signed by a certified Partner.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={isa220Enforced}
                  onChange={(e) => setIsa220Enforced(e.target.checked)}
                  className="w-4 h-4 accent-[#113227] cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D9]">
                <div>
                  <span className="text-xs font-bold text-[#1C1F1E] block">
                    Cryptographic SHA-256 Workpaper Hashing
                  </span>
                  <span className="text-[11px] text-[#66706B]">
                    Automatically compute and append tamper-evident SHA-256
                    hashes to uploaded PBC files and working papers.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={immutableHashing}
                  onChange={(e) => setImmutableHashing(e.target.checked)}
                  className="w-4 h-4 accent-[#113227] cursor-pointer"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs space-y-4">
            <div className="flex items-center space-x-2.5 pb-3 border-b border-[#F0EBE1]">
              <Sliders className="w-4 h-4 text-[#8A5A18]" />
              <h3 className="text-sm font-bold text-[#1C1F1E]">
                Fee Billing, Currency &amp; VAT Parameters
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Standard Statutory VAT Rate (%)
                </label>
                <input
                  type="number"
                  value={vatRate}
                  onChange={(e) => setVatRate(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Primary Practice Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none font-semibold"
                >
                  <option value="BDT">BDT - Bangladeshi Taka (৳)</option>
                  <option value="USD">USD - US Dollar ($)</option>
                  <option value="EUR">EUR - Euro (€)</option>
                  <option value="SGD">SGD - Singapore Dollar (S$)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOTP Setup Modal */}
      <TotpMfaModal
        isOpen={isTotpModalOpen}
        onClose={() => setIsTotpModalOpen(false)}
        onConfirmEnable={handleMfaConfirmed}
      />
    </div>
  );
};
