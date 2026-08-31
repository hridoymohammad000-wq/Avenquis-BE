import React, { useState, useMemo } from "react";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  Clock,
  User,
  Calendar,
  FileCheck,
  Filter,
  Search,
  MessageSquare,
  HelpCircle,
  Plus,
  Eye,
  ChevronRight,
  Sparkles,
  Layers,
} from "lucide-react";
import {
  SignOffItem,
  SignOffChecklist,
  ReviewNote,
  WorkingPaper,
} from "../../types";
import { SignOffActionModal } from "./SignOffActionModal";
import { ReviewNotesDrawer } from "./ReviewNotesDrawer";
import { SignOffSealBadge } from "./SignOffSealBadge";

interface SignOffWorkflowViewProps {
  signoffs: SignOffItem[];
  workingPapers?: WorkingPaper[];
  onApproveAndSignOff: (
    signoffId: string,
    checklist: SignOffChecklist,
    roleLevel: "Manager" | "Partner" | "EQCR",
    signerComment: string,
  ) => void;
  onRejectWithReviewNote: (
    signoffId: string,
    reason: string,
    targetSection: string,
  ) => void;
  onRequestClarification: (signoffId: string, message: string) => void;
  onAddReviewNote: (
    signoffId: string,
    note: Omit<ReviewNote, "id" | "timestamp" | "status">,
  ) => void;
  onReplyReviewNote: (
    signoffId: string,
    noteId: string,
    replyContent: string,
  ) => void;
  onUpdateNoteStatus: (
    signoffId: string,
    noteId: string,
    status: ReviewNote["status"],
  ) => void;
  onToast?: (message: string, type: "success" | "info" | "error") => void;
}

export const SignOffWorkflowView: React.FC<SignOffWorkflowViewProps> = ({
  signoffs,
  workingPapers = [],
  onApproveAndSignOff,
  onRejectWithReviewNote,
  onRequestClarification,
  onAddReviewNote,
  onReplyReviewNote,
  onUpdateNoteStatus,
  onToast,
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<
    "All" | "Manager Sign-off" | "Partner Sign-off" | "EQCR Review"
  >("All");
  const [statusFilter, setStatusFilter] = useState<
    "All" | "Pending" | "Signed" | "Rejected" | "Clarification Requested"
  >("All");
  const [clientFilter, setClientFilter] = useState("All");

  // Modal States
  const [selectedForAction, setSelectedForAction] =
    useState<SignOffItem | null>(null);
  const [selectedForNotes, setSelectedForNotes] = useState<SignOffItem | null>(
    null,
  );

  // Filtered Sign-offs
  const filteredSignoffs = useMemo(() => {
    return signoffs.filter((item) => {
      if (roleFilter !== "All" && item.roleRequired !== roleFilter)
        return false;
      if (statusFilter !== "All" && item.status !== statusFilter) return false;
      if (clientFilter !== "All" && item.clientName !== clientFilter)
        return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesRef = item.paperRef.toLowerCase().includes(q);
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesClient = item.clientName.toLowerCase().includes(q);
        const matchesAuthor = item.submittedBy.toLowerCase().includes(q);
        const matchesCode = item.engagementCode.toLowerCase().includes(q);
        if (
          !matchesRef &&
          !matchesTitle &&
          !matchesClient &&
          !matchesAuthor &&
          !matchesCode
        ) {
          return false;
        }
      }
      return true;
    });
  }, [signoffs, roleFilter, statusFilter, clientFilter, searchQuery]);

  // Unique clients for filter
  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    signoffs.forEach((s) => set.add(s.clientName));
    return Array.from(set);
  }, [signoffs]);

  // Statistics
  const pendingManagerCount = signoffs.filter(
    (s) => s.roleRequired === "Manager Sign-off" && s.status === "Pending",
  ).length;

  const pendingPartnerCount = signoffs.filter(
    (s) => s.roleRequired === "Partner Sign-off" && s.status === "Pending",
  ).length;

  const signedCount = signoffs.filter((s) => s.status === "Signed").length;

  const totalOpenNotes = signoffs.reduce((acc, s) => {
    return (
      acc + (s.reviewNotes || []).filter((n) => n.status === "Open").length
    );
  }, 0);

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Sign-off Action Modal */}
      <SignOffActionModal
        isOpen={Boolean(selectedForAction)}
        onClose={() => setSelectedForAction(null)}
        signoff={selectedForAction}
        onApproveAndSignOff={onApproveAndSignOff}
        onRejectWithReviewNote={onRejectWithReviewNote}
        onRequestClarification={onRequestClarification}
        onOpenReviewNotes={(s) => {
          setSelectedForAction(null);
          setSelectedForNotes(s);
        }}
        onToast={onToast}
      />

      {/* Review Notes Thread Drawer */}
      {selectedForNotes && (
        <ReviewNotesDrawer
          isOpen={Boolean(selectedForNotes)}
          onClose={() => setSelectedForNotes(null)}
          signoff={selectedForNotes}
          onAddReviewNote={onAddReviewNote}
          onReplyReviewNote={onReplyReviewNote}
          onUpdateNoteStatus={onUpdateNoteStatus}
          onToast={onToast}
        />
      )}

      {/* Metric Cards Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Manager Review Queue */}
        <div
          onClick={() => {
            setRoleFilter("Manager Sign-off");
            setStatusFilter("Pending");
          }}
          className="p-5 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs cursor-pointer hover:border-[#113227] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Manager Review Level
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#FAF0DE] text-[#8A5A18] flex items-center justify-center font-bold">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1F1E] mt-2">
            {pendingManagerCount}{" "}
            <span className="text-xs font-normal text-stone-400">
              papers waiting
            </span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Detailed substantive checks &amp; ISA 500 audit sampling
          </div>
        </div>

        {/* Metric 2: Partner Sign-off Queue */}
        <div
          onClick={() => {
            setRoleFilter("Partner Sign-off");
            setStatusFilter("Pending");
          }}
          className="p-5 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs cursor-pointer hover:border-[#113227] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Partner Sign-off Level
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E1F3EE] text-[#113227] flex items-center justify-center font-bold">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#113227] mt-2">
            {pendingPartnerCount}{" "}
            <span className="text-xs font-normal text-stone-400">
              ready for seal
            </span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Key Audit Matters &amp; immutable ICAB partner authorization
          </div>
        </div>

        {/* Metric 3: Total Signed & Sealed */}
        <div
          onClick={() => setStatusFilter("Signed")}
          className="p-5 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs cursor-pointer hover:border-[#113227] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Certified Sealed Papers
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-emerald-900 mt-2">
            {signedCount}{" "}
            <span className="text-xs font-normal text-stone-400">
              completed
            </span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Locked with cryptographic digital signature proofs
          </div>
        </div>

        {/* Metric 4: Open Audit Queries */}
        <div
          onClick={() => setStatusFilter("Rejected")}
          className="p-5 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs cursor-pointer hover:border-[#113227] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Open Review Notes
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-rose-900 mt-2">
            {totalOpenNotes}{" "}
            <span className="text-xs font-normal text-stone-400">
              open queries
            </span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Threaded notes pending preparer resolution
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EBE6DD] shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Paper Ref, Client, Title, or Preparer..."
            className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:border-[#113227]"
          />
        </div>

        {/* 2-Tier Role Matrix Filters */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-stone-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="All">All Review Tiers</option>
            <option value="Manager Sign-off">
              Tier 1: Manager Review Level
            </option>
            <option value="Partner Sign-off">
              Tier 2: Partner Sign-off Level
            </option>
            <option value="EQCR Review">Tier 2: EQCR Quality Review</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-stone-700 focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending Sign-off</option>
            <option value="Signed">Signed &amp; Sealed</option>
            <option value="Rejected">Rejected / Review Notes</option>
            <option value="Clarification Requested">
              Clarification Requested
            </option>
          </select>

          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-stone-700 focus:outline-none cursor-pointer"
          >
            <option value="All">All Clients</option>
            {uniqueClients.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {(roleFilter !== "All" ||
            statusFilter !== "All" ||
            clientFilter !== "All" ||
            searchQuery) && (
            <button
              onClick={() => {
                setRoleFilter("All");
                setStatusFilter("All");
                setClientFilter("All");
                setSearchQuery("");
              }}
              className="px-3 py-2 rounded-xl text-xs text-stone-500 hover:text-stone-800 hover:bg-stone-100 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Two-Tier Review Matrix Items Grid */}
      <div className="space-y-4">
        {filteredSignoffs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#EBE6DD] text-stone-400 text-xs">
            <Award className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="font-semibold text-stone-700">
              No sign-off items match your current filter.
            </p>
            <p className="text-stone-400 mt-1">
              Try resetting filters to inspect the full review matrix queue.
            </p>
          </div>
        ) : (
          filteredSignoffs.map((item) => {
            const openNotes = (item.reviewNotes || []).filter(
              (n) => n.status === "Open",
            );
            const totalNotes = item.reviewNotes?.length || 0;
            const isSigned = item.status === "Signed";

            return (
              <div
                key={item.id}
                className={`p-6 rounded-3xl bg-white border transition-all shadow-xs space-y-5 text-left ${
                  isSigned
                    ? "border-[#BCE1D5] bg-gradient-to-r from-white to-[#F6FBF9]"
                    : "border-[#EBE6DD] hover:border-[#C58A3E]/60"
                }`}
              >
                {/* Item Top Bar */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#113227] bg-[#FAF0DE] px-2.5 py-0.5 rounded-md border border-[#EADBBF]">
                        {item.paperRef}
                      </span>
                      <span className="font-mono text-xs font-bold text-[#113227] bg-[#E1F3EE] px-2 py-0.5 rounded border border-[#BCE1D5]">
                        {item.documentVersion}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          item.roleRequired === "Partner Sign-off"
                            ? "bg-[#113227] text-white"
                            : item.roleRequired === "EQCR Review"
                              ? "bg-purple-100 text-purple-900"
                              : "bg-[#FAF7F2] text-[#8A5A18] border border-[#E8E1D5]"
                        }`}
                      >
                        {item.roleRequired}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          item.status === "Signed"
                            ? "bg-[#E1F3EE] text-[#1F5946] border border-[#BCE1D5]"
                            : item.status === "Rejected"
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : item.status === "Clarification Requested"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h3 className="text-base font-serif font-bold text-[#1C1F1E] mt-1">
                      {item.title}
                    </h3>

                    <div className="text-xs text-stone-500 font-medium">
                      Client:{" "}
                      <strong className="text-stone-800">
                        {item.clientName}
                      </strong>{" "}
                      • {item.engagementCode} (
                      {item.financialYear || "FY 2025-26"})
                    </div>
                  </div>

                  {/* Top Action Triggers */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {/* Review Notes Button */}
                    <button
                      onClick={() => setSelectedForNotes(item)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                        openNotes.length > 0
                          ? "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100"
                          : "bg-[#FAF8F5] text-stone-700 border-[#E5DDD0] hover:bg-stone-100"
                      }`}
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Review Notes ({totalNotes})</span>
                      {openNotes.length > 0 && (
                        <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                      )}
                    </button>

                    {/* Open Sign-off Action Panel */}
                    <button
                      onClick={() => setSelectedForAction(item)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer ${
                        isSigned
                          ? "bg-[#E1F3EE] text-[#113227] border border-[#BCE1D5] hover:bg-[#D1ECE3]"
                          : "btn-forest"
                      }`}
                    >
                      {isSigned ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-[#113227]" />
                          <span>View Sealed Stamps</span>
                        </>
                      ) : (
                        <>
                          <Award className="w-3.5 h-3.5 text-[#C58A3E]" />
                          <span>Review &amp; Sign-off Panel</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Audit Submission Notes */}
                {item.notes && (
                  <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D9] text-xs text-[#3D4742]">
                    <strong className="text-stone-800">
                      Preparer Audit Summary:
                    </strong>{" "}
                    {item.notes}
                  </div>
                )}

                {/* Checklist Summary Strip */}
                {item.checklist && (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-[11px] border-t border-[#F0EBE1]">
                    <div className="flex items-center space-x-1.5">
                      {item.checklist.standardsCompliance ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                      <span
                        className={
                          item.checklist.standardsCompliance
                            ? "text-stone-800 font-medium"
                            : "text-stone-400"
                        }
                      >
                        ICAB/ISA Aligned
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {item.checklist.sufficientEvidence ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                      <span
                        className={
                          item.checklist.sufficientEvidence
                            ? "text-stone-800 font-medium"
                            : "text-stone-400"
                        }
                      >
                        Evidence Attached
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {item.checklist.analyticalReviewCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                      <span
                        className={
                          item.checklist.analyticalReviewCompleted
                            ? "text-stone-800 font-medium"
                            : "text-stone-400"
                        }
                      >
                        Analytical Review
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {item.checklist.samplingReconciled ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                      <span
                        className={
                          item.checklist.samplingReconciled
                            ? "text-stone-800 font-medium"
                            : "text-stone-400"
                        }
                      >
                        Sampling Reconciled
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      {item.checklist.subsequentEventsEvaluated ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      )}
                      <span
                        className={
                          item.checklist.subsequentEventsEvaluated
                            ? "text-stone-800 font-medium"
                            : "text-stone-400"
                        }
                      >
                        Subsequent Events
                      </span>
                    </div>
                  </div>
                )}

                {/* Cryptographic Seals Strip (if signed) */}
                {(item.managerSeal || item.partnerSeal) && (
                  <div className="pt-3 border-t border-[#F0EBE1]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {item.managerSeal && (
                        <SignOffSealBadge
                          seal={item.managerSeal}
                          type="manager"
                        />
                      )}
                      {item.partnerSeal && (
                        <SignOffSealBadge
                          seal={item.partnerSeal}
                          type="partner"
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Item Footer Info */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500 pt-2 border-t border-[#F0EBE1]">
                  <div className="flex items-center space-x-2">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>
                      Submitted by:{" "}
                      <strong className="text-stone-700">
                        {item.submittedBy}
                      </strong>{" "}
                      ({item.submittedDate})
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-stone-400">
                    Hash: {item.fileHash}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
