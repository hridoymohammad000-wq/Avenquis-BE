import React, { useState } from "react";
import {
  FileCheck,
  Award,
  Inbox,
  FileBox,
  CheckCircle2,
  Lock,
  Search,
  Upload,
  AlertCircle,
  FileText,
  ShieldCheck,
  Download,
  CheckSquare,
} from "lucide-react";
import {
  DocumentVaultItem,
  WorkingPaper,
  SignOffItem,
  ClientRequestItem,
  SignOffChecklist,
  ReviewNote,
} from "../../types";
import { DocumentVaultExplorer } from "./DocumentVaultExplorer";
import { WorkingPapersExplorer } from "./WorkingPapersExplorer";
import { SignOffWorkflowView } from "./SignOffWorkflowView";
import { ClientRequestTrackerView } from "./ClientRequestTrackerView";

interface AuditReviewDocsViewProps {
  initialTab?: "documents" | "audit-files" | "reviews" | "client-requests";
  documents: DocumentVaultItem[];
  workingPapers: WorkingPaper[];
  signoffs: SignOffItem[];
  clientRequests: ClientRequestItem[];
  onQuickSignOff: (signoffId: string) => void;
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
  onAddDocument: (doc: Partial<DocumentVaultItem>) => void;
  onAddWorkingPaper: (wp: Partial<WorkingPaper>) => void;
  onUpdateWorkingPaper?: (wpId: string, updated: Partial<WorkingPaper>) => void;
  onCreateClientRequest: (
    request: Omit<ClientRequestItem, "id" | "ticketNo" | "requestedDate">,
  ) => void;
  onUpdateClientRequestStatus: (
    reqId: string,
    status: ClientRequestItem["status"],
  ) => void;
  onToggleFileReceived: (
    requestId: string,
    fileId: string,
    received: boolean,
  ) => void;
  onSendInstantReminder: (requestId: string) => void;
  onToast?: (message: string, type: "success" | "info" | "error") => void;
}

export const AuditReviewDocsView: React.FC<AuditReviewDocsViewProps> = ({
  initialTab = "audit-files",
  documents,
  workingPapers,
  signoffs,
  clientRequests,
  onQuickSignOff,
  onApproveAndSignOff,
  onRejectWithReviewNote,
  onRequestClarification,
  onAddReviewNote,
  onReplyReviewNote,
  onUpdateNoteStatus,
  onAddDocument,
  onAddWorkingPaper,
  onUpdateWorkingPaper,
  onCreateClientRequest,
  onUpdateClientRequestStatus,
  onToggleFileReceived,
  onSendInstantReminder,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<
    "documents" | "audit-files" | "reviews" | "client-requests"
  >(initialTab);

  const pendingSignOffsCount = signoffs.filter(
    (s) => s.status === "Pending",
  ).length;
  const pendingRequestsCount = clientRequests.filter(
    (r) => r.status !== "Accepted" && r.status !== "Resolved",
  ).length;

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-2 bg-[#FAF0DE] px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-[#8A5A18] mb-2">
            <span>ISA 220 AUDIT QUALITY &amp; REPOSITORIES</span>
            <span className="text-[#C58A3E] font-serif">✦</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1F1E] tracking-tight">
            Audit Documentation, Reviews &amp; Client Portal
          </h1>
          <p className="text-xs sm:text-sm text-[#66706B] mt-1">
            Two-tier review sign-off matrix, SHA-256 sealed working papers, and
            PBC requisition tracker.
          </p>
        </div>

        {/* 4-Tab Navigation Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#FAF7F2] p-1.5 rounded-2xl border border-[#E8E1D5] shrink-0">
          <button
            onClick={() => setActiveTab("audit-files")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "audit-files"
                ? "bg-[#113227] text-white shadow-xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <FileCheck className="w-3.5 h-3.5" />
            <span>Working Papers ({workingPapers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("documents")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "documents"
                ? "bg-[#113227] text-white shadow-xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <FileBox className="w-3.5 h-3.5" />
            <span>Document Vault ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab("reviews")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "reviews"
                ? "bg-[#113227] text-white shadow-xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>
              Reviews &amp; Sign-offs{" "}
              {pendingSignOffsCount > 0 && `(${pendingSignOffsCount})`}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("client-requests")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "client-requests"
                ? "bg-[#113227] text-white shadow-xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <Inbox className="w-3.5 h-3.5" />
            <span>
              PBC Client Requests{" "}
              {pendingRequestsCount > 0 && `(${pendingRequestsCount})`}
            </span>
          </button>
        </div>
      </div>

      {/* Tab 1: Audit Working Papers Explorer */}
      {activeTab === "audit-files" && (
        <WorkingPapersExplorer
          workingPapers={workingPapers}
          onAddWorkingPaper={onAddWorkingPaper}
          onUpdateWorkingPaper={onUpdateWorkingPaper}
          onToast={onToast}
        />
      )}

      {/* Tab 2: Document Vault Explorer */}
      {activeTab === "documents" && (
        <DocumentVaultExplorer
          documents={documents}
          onAddDocument={onAddDocument}
          onToast={onToast}
        />
      )}

      {/* Tab 3: Formal Review & Sign-off Workflow (Two-Tier Review Matrix) */}
      {activeTab === "reviews" && (
        <SignOffWorkflowView
          signoffs={signoffs}
          workingPapers={workingPapers}
          onApproveAndSignOff={onApproveAndSignOff}
          onRejectWithReviewNote={onRejectWithReviewNote}
          onRequestClarification={onRequestClarification}
          onAddReviewNote={onAddReviewNote}
          onReplyReviewNote={onReplyReviewNote}
          onUpdateNoteStatus={onUpdateNoteStatus}
          onToast={onToast}
        />
      )}

      {/* Tab 4: Client Information Request Tracker (PBC) */}
      {activeTab === "client-requests" && (
        <ClientRequestTrackerView
          requests={clientRequests}
          onCreateRequest={onCreateClientRequest}
          onUpdateStatus={onUpdateClientRequestStatus}
          onToggleFileReceived={onToggleFileReceived}
          onSendInstantReminder={onSendInstantReminder}
          onToast={onToast}
        />
      )}
    </div>
  );
};
