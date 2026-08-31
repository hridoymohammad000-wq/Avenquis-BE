import React, { useState } from "react";
import {
  Award,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Unlock,
  AlertCircle,
  X,
  FileCheck,
  HelpCircle,
  CheckSquare,
  Square,
  FileText,
  Clock,
  UserCheck,
  Hash,
} from "lucide-react";
import {
  SignOffItem,
  SignOffChecklist,
  DigitalSignatureSeal,
  ReviewNote,
} from "../../types";
import { SignOffSealBadge } from "./SignOffSealBadge";

interface SignOffActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  signoff: SignOffItem | null;
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
  onOpenReviewNotes?: (signoff: SignOffItem) => void;
  onToast?: (message: string, type: "success" | "info" | "error") => void;
}

export const SignOffActionModal: React.FC<SignOffActionModalProps> = ({
  isOpen,
  onClose,
  signoff,
  onApproveAndSignOff,
  onRejectWithReviewNote,
  onRequestClarification,
  onOpenReviewNotes,
  onToast,
}) => {
  // Modal Action Tab: 'signoff' | 'reject' | 'clarify'
  const [activeAction, setActiveAction] = useState<
    "signoff" | "reject" | "clarify"
  >("signoff");

  // Role Level Selection for Signer
  const [signerRole, setSignerRole] = useState<"Manager" | "Partner" | "EQCR">(
    "Manager",
  );
  const [signerComment, setSignerComment] = useState("");

  // Rejection Form State
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSection, setRejectSection] = useState(
    "Section 2: Substantive Sampling & Testing",
  );

  // Clarification Form State
  const [clarifyMessage, setClarifyMessage] = useState("");

  // Interactive Checklist State
  const [checklist, setChecklist] = useState<SignOffChecklist>({
    standardsCompliance: true,
    sufficientEvidence: true,
    analyticalReviewCompleted: true,
    samplingReconciled: true,
    subsequentEventsEvaluated: false,
  });

  // Sync initial state when signoff changes
  React.useEffect(() => {
    if (signoff) {
      if (signoff.checklist) {
        setChecklist(signoff.checklist);
      } else {
        setChecklist({
          standardsCompliance: true,
          sufficientEvidence: true,
          analyticalReviewCompleted: true,
          samplingReconciled: true,
          subsequentEventsEvaluated: false,
        });
      }
      setSignerRole(
        signoff.roleRequired === "Partner Sign-off"
          ? "Partner"
          : signoff.roleRequired === "EQCR Review"
            ? "EQCR"
            : "Manager",
      );
      setSignerComment("");
      setRejectReason("");
      setClarifyMessage("");
      setActiveAction("signoff");
    }
  }, [signoff]);

  if (!isOpen || !signoff) return null;

  const toggleChecklistItem = (key: keyof SignOffChecklist) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const allChecksPassed =
    checklist.standardsCompliance &&
    checklist.sufficientEvidence &&
    checklist.analyticalReviewCompleted &&
    checklist.samplingReconciled;

  const handleApproveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApproveAndSignOff(signoff.id, checklist, signerRole, signerComment);
    onClose();
  };

  const handleRejectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectReason.trim()) return;
    onRejectWithReviewNote(signoff.id, rejectReason.trim(), rejectSection);
    onClose();
  };

  const handleClarifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clarifyMessage.trim()) return;
    onRequestClarification(signoff.id, clarifyMessage.trim());
    onClose();
  };

  const openReviewNotes = (signoff.reviewNotes || []).filter(
    (n) => n.status === "Open",
  );

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
      <div className="bg-white rounded-3xl border border-[#EBE6DD] max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-6 bg-[#FAF7F2] border-b border-[#EBE6DD] flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#113227] bg-[#FAF0DE] px-2.5 py-0.5 rounded-md border border-[#EADBBF]">
                {signoff.paperRef}
              </span>
              <span className="font-mono text-xs font-bold text-[#113227] bg-[#E1F3EE] px-2 py-0.5 rounded border border-[#BCE1D5]">
                {signoff.documentVersion}
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#8A5A18]">
                {signoff.roleRequired}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  signoff.status === "Signed"
                    ? "bg-emerald-100 text-emerald-800"
                    : signoff.status === "Rejected"
                      ? "bg-rose-100 text-rose-800"
                      : signoff.status === "Clarification Requested"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-100 text-amber-800"
                }`}
              >
                {signoff.status}
              </span>
            </div>

            <h2 className="text-lg font-serif font-bold text-[#1C1F1E] mt-1">
              {signoff.title}
            </h2>

            <div className="text-xs text-stone-500 font-medium">
              Client:{" "}
              <strong className="text-stone-800">{signoff.clientName}</strong> •
              Engagement:{" "}
              <strong className="text-stone-800">
                {signoff.engagementCode}
              </strong>{" "}
              ({signoff.financialYear || "FY 2025-26"})
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAF8F5]">
          {/* Working Paper Hash & Metadata Bar */}
          <div className="p-4 rounded-2xl bg-white border border-[#EBE6DD] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#E1F3EE] text-[#113227] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Immutable Cryptographic Hash (SHA-256)
                </div>
                <div className="font-mono text-xs text-[#113227] font-semibold break-all">
                  {signoff.fileHash}
                </div>
              </div>
            </div>

            <div className="text-right text-[11px] text-stone-500 shrink-0">
              Submitted by <strong>{signoff.submittedBy}</strong> on{" "}
              {signoff.submittedDate}
            </div>
          </div>

          {/* Existing Seals Display (if already signed by manager or partner) */}
          {(signoff.managerSeal || signoff.partnerSeal) && (
            <div className="space-y-3">
              <div className="text-xs font-bold font-serif uppercase tracking-wider text-[#1C1F1E] flex items-center gap-1.5">
                <Award className="w-4 h-4 text-[#C58A3E]" />
                <span>Authorized Cryptographic Signatures</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {signoff.managerSeal && (
                  <SignOffSealBadge seal={signoff.managerSeal} type="manager" />
                )}
                {signoff.partnerSeal && (
                  <SignOffSealBadge seal={signoff.partnerSeal} type="partner" />
                )}
              </div>
            </div>
          )}

          {/* Open Review Notes Alert */}
          {openReviewNotes.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <div>
                  <strong>{openReviewNotes.length} Open Review Note(s)</strong>{" "}
                  attached to this working paper. Must be addressed or cleared
                  before partner authorization.
                </div>
              </div>
              {onOpenReviewNotes && (
                <button
                  onClick={() => onOpenReviewNotes(signoff)}
                  className="px-3 py-1 bg-amber-200 text-amber-900 rounded-lg font-bold hover:bg-amber-300 text-[11px] shrink-0 cursor-pointer"
                >
                  View Notes
                </button>
              )}
            </div>
          )}

          {/* Review Checklist Section */}
          <div className="bg-white p-5 rounded-2xl border border-[#EBE6DD] shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-2.5">
              <div className="flex items-center space-x-2">
                <CheckSquare className="w-4 h-4 text-[#113227]" />
                <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-[#1C1F1E]">
                  Audit Quality &amp; Compliance Review Checklist (ISA 220)
                </h4>
              </div>
              <span className="text-[10px] font-bold text-stone-400 uppercase">
                Interactive Verification
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div
                onClick={() => toggleChecklistItem("standardsCompliance")}
                className={`p-3 rounded-xl border flex items-start space-x-3 transition-all cursor-pointer ${
                  checklist.standardsCompliance
                    ? "bg-[#E1F3EE]/60 border-[#BCE1D5]"
                    : "bg-[#FAF8F5] border-[#ECE5D9] hover:bg-[#F2ECE1]"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {checklist.standardsCompliance ? (
                    <CheckSquare className="w-4 h-4 text-[#113227]" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-400" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-stone-900">
                    1. Compliance with ICAB, ISA &amp; IFRS Standards
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Procedures performed align with applicable International
                    Standards on Auditing and financial reporting framework.
                  </div>
                </div>
              </div>

              <div
                onClick={() => toggleChecklistItem("sufficientEvidence")}
                className={`p-3 rounded-xl border flex items-start space-x-3 transition-all cursor-pointer ${
                  checklist.sufficientEvidence
                    ? "bg-[#E1F3EE]/60 border-[#BCE1D5]"
                    : "bg-[#FAF8F5] border-[#ECE5D9] hover:bg-[#F2ECE1]"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {checklist.sufficientEvidence ? (
                    <CheckSquare className="w-4 h-4 text-[#113227]" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-400" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-stone-900">
                    2. Sufficient and Appropriate Audit Evidence (ISA 500)
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    External confirmations, sub-ledger schedules, and source
                    vouchers are attached and verified with checksum proofs.
                  </div>
                </div>
              </div>

              <div
                onClick={() => toggleChecklistItem("analyticalReviewCompleted")}
                className={`p-3 rounded-xl border flex items-start space-x-3 transition-all cursor-pointer ${
                  checklist.analyticalReviewCompleted
                    ? "bg-[#E1F3EE]/60 border-[#BCE1D5]"
                    : "bg-[#FAF8F5] border-[#ECE5D9] hover:bg-[#F2ECE1]"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {checklist.analyticalReviewCompleted ? (
                    <CheckSquare className="w-4 h-4 text-[#113227]" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-400" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-stone-900">
                    3. Analytical Review &amp; Variance Explanations (ISA 520)
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Month-on-month trend comparisons, margin variance analysis,
                    and key ratio tests properly documented.
                  </div>
                </div>
              </div>

              <div
                onClick={() => toggleChecklistItem("samplingReconciled")}
                className={`p-3 rounded-xl border flex items-start space-x-3 transition-all cursor-pointer ${
                  checklist.samplingReconciled
                    ? "bg-[#E1F3EE]/60 border-[#BCE1D5]"
                    : "bg-[#FAF8F5] border-[#ECE5D9] hover:bg-[#F2ECE1]"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {checklist.samplingReconciled ? (
                    <CheckSquare className="w-4 h-4 text-[#113227]" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-400" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-stone-900">
                    4. Sub-ledger to General Ledger Reconciliation (ISA 530)
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Sample items cover tolerable error thresholds and
                    mathematical accuracy is verified.
                  </div>
                </div>
              </div>

              <div
                onClick={() => toggleChecklistItem("subsequentEventsEvaluated")}
                className={`p-3 rounded-xl border flex items-start space-x-3 transition-all cursor-pointer ${
                  checklist.subsequentEventsEvaluated
                    ? "bg-[#E1F3EE]/60 border-[#BCE1D5]"
                    : "bg-[#FAF8F5] border-[#ECE5D9] hover:bg-[#F2ECE1]"
                }`}
              >
                <div className="mt-0.5 shrink-0">
                  {checklist.subsequentEventsEvaluated ? (
                    <CheckSquare className="w-4 h-4 text-[#113227]" />
                  ) : (
                    <Square className="w-4 h-4 text-stone-400" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-stone-900">
                    5. Subsequent Events &amp; Going Concern Assessment (ISA 560
                    / 570)
                  </div>
                  <div className="text-[11px] text-stone-500 mt-0.5">
                    Post-balance sheet realizations, claims, and contingency
                    liabilities evaluated.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Decision Selector */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-2">
              <span className="text-xs font-bold font-serif uppercase tracking-wider text-[#1C1F1E]">
                Sign-off Action Decision
              </span>
              <div className="flex items-center space-x-1.5 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8E1D5]">
                <button
                  onClick={() => setActiveAction("signoff")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    activeAction === "signoff"
                      ? "bg-[#113227] text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Approve &amp; Sign-off
                </button>
                <button
                  onClick={() => setActiveAction("reject")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    activeAction === "reject"
                      ? "bg-rose-800 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Raise Note / Reject
                </button>
                <button
                  onClick={() => setActiveAction("clarify")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    activeAction === "clarify"
                      ? "bg-blue-800 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900"
                  }`}
                >
                  Request Clarification
                </button>
              </div>
            </div>

            {/* Sub-form 1: Approve & Sign-off */}
            {activeAction === "signoff" && (
              <form
                onSubmit={handleApproveSubmit}
                className="bg-white p-5 rounded-2xl border border-[#BCE1D5] bg-gradient-to-b from-[#FAFDFB] to-white space-y-4 animate-fadeIn"
              >
                <div className="flex items-center space-x-2 text-xs font-bold text-[#113227]">
                  <Award className="w-4 h-4 text-[#C58A3E]" />
                  <span>
                    Execute Digital Signature &amp; Immutable Lock (ISA 220)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Signing Authority Level
                    </label>
                    <select
                      value={signerRole}
                      onChange={(e) => setSignerRole(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none font-semibold text-[#113227]"
                    >
                      <option value="Manager">
                        Manager Review Level (Zahirul Islam, FCA)
                      </option>
                      <option value="Partner">
                        Partner Level Sign-off (Fouzia Haque, FCA)
                      </option>
                      <option value="EQCR">
                        EQCR Independent Review Level
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                      Digital Key Certificate Ref
                    </label>
                    <input
                      type="text"
                      readOnly
                      value={`ICAB-CERT-2026-AVQ-${signoff.roleRequired === "Partner Sign-off" ? "PTR-0099" : "MGR-0012"}`}
                      className="w-full px-3 py-2 bg-stone-100 border border-[#E5DDD0] rounded-xl text-xs font-mono text-stone-600 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Signer Quality Assurance Remarks (Optional)
                  </label>
                  <input
                    type="text"
                    value={signerComment}
                    onChange={(e) => setSignerComment(e.target.value)}
                    placeholder="e.g. Substantive analytical testing reviewed; variances reconciled without material misstatement."
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none focus:border-[#113227]"
                  />
                </div>

                <div className="p-3 bg-[#FAF0DE] rounded-xl border border-[#EADBBF] text-xs text-[#8A5A18] flex items-start space-x-2">
                  <Lock className="w-4 h-4 text-[#8A5A18] shrink-0 mt-0.5" />
                  <p className="leading-snug">
                    Authorizing this sign-off will generate an immutable ICAB
                    digital stamp ID, seal the working paper against changes,
                    and advance the engagement audit milestone.
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 rounded-xl hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-forest px-5 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#C58A3E]" />
                    <span>Approve &amp; Sign-off (Immutable Lock)</span>
                  </button>
                </div>
              </form>
            )}

            {/* Sub-form 2: Raise Review Note / Reject */}
            {activeAction === "reject" && (
              <form
                onSubmit={handleRejectSubmit}
                className="bg-white p-5 rounded-2xl border border-rose-200 bg-gradient-to-b from-rose-50/40 to-white space-y-4 animate-fadeIn"
              >
                <div className="flex items-center space-x-2 text-xs font-bold text-rose-800">
                  <AlertCircle className="w-4 h-4" />
                  <span>
                    Raise Mandatory Audit Query &amp; Return to Preparer
                  </span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Target Working Paper Section
                  </label>
                  <select
                    value={rejectSection}
                    onChange={(e) => setRejectSection(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Section 1: Audit Scope & Cut-off">
                      Section 1: Audit Scope &amp; Cut-off
                    </option>
                    <option value="Section 2: Substantive Sampling & Testing">
                      Section 2: Substantive Sampling &amp; Testing
                    </option>
                    <option value="Section 3: Attached Evidence & Confirmations">
                      Section 3: Attached Evidence &amp; Confirmations
                    </option>
                    <option value="Section 4: Analytical Variance & Ratio Explanations">
                      Section 4: Analytical Variance &amp; Ratio Explanations
                    </option>
                    <option value="Section 5: Disclosure & Presentation (IAS/IFRS)">
                      Section 5: Disclosure &amp; Presentation (IAS/IFRS)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Specific Finding / Rejection Reason
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Detail the non-compliance, missing verification schedule, or required recount..."
                    className="w-full p-2.5 bg-white border border-[#E5DDD0] rounded-xl text-xs focus:outline-none focus:border-rose-700"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 rounded-xl hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-800 text-white rounded-xl text-xs font-bold hover:bg-rose-900 shadow-sm cursor-pointer"
                  >
                    Raise Review Note &amp; Reject
                  </button>
                </div>
              </form>
            )}

            {/* Sub-form 3: Request Clarification */}
            {activeAction === "clarify" && (
              <form
                onSubmit={handleClarifySubmit}
                className="bg-white p-5 rounded-2xl border border-blue-200 bg-gradient-to-b from-blue-50/40 to-white space-y-4 animate-fadeIn"
              >
                <div className="flex items-center space-x-2 text-xs font-bold text-blue-900">
                  <HelpCircle className="w-4 h-4" />
                  <span>Request Preparer Clarification (Non-blocking)</span>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Clarification Query
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={clarifyMessage}
                    onChange={(e) => setClarifyMessage(e.target.value)}
                    placeholder="Request specific explanation, recalculation proof, or extra information without formal rejection..."
                    className="w-full p-2.5 bg-white border border-[#E5DDD0] rounded-xl text-xs focus:outline-none focus:border-blue-700"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-stone-600 rounded-xl hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#1D526D] text-white rounded-xl text-xs font-bold hover:bg-[#153D52] shadow-sm cursor-pointer"
                  >
                    Send Clarification Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#EBE6DD] flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#113227]" />
            <span>
              ICAB Code of Ethics &amp; ISA 220 Quality Management Standard
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl border border-[#E5DDD0] text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
