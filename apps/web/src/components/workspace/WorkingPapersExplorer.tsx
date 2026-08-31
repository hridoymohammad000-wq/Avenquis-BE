import React, { useState, useMemo } from "react";
import {
  FileCheck,
  CheckCircle2,
  Lock,
  Unlock,
  ShieldCheck,
  FileText,
  Download,
  Eye,
  Plus,
  Search,
  Filter,
  CheckSquare,
  Square,
  Clock,
  User,
  Calendar,
  AlertCircle,
  GitBranch,
  ArrowRight,
  X,
  Layers,
  Paperclip,
  Tag,
} from "lucide-react";
import {
  WorkingPaper,
  WorkingPaperProcedure,
  WorkingPaperEvidence,
  WorkingPaperRevision,
} from "../../types";
import { EvidencePreviewModal } from "./EvidencePreviewModal";

interface WorkingPapersExplorerProps {
  workingPapers: WorkingPaper[];
  onAddWorkingPaper: (wp: Partial<WorkingPaper>) => void;
  onUpdateWorkingPaper?: (wpId: string, updated: Partial<WorkingPaper>) => void;
  onToast?: (message: string, type: "success" | "info" | "error") => void;
}

export const WorkingPapersExplorer: React.FC<WorkingPapersExplorerProps> = ({
  workingPapers,
  onAddWorkingPaper,
  onUpdateWorkingPaper,
  onToast,
}) => {
  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  // Selected Working Paper for Slide-over Detail View
  const [selectedWp, setSelectedWp] = useState<WorkingPaper | null>(null);

  // Evidence Preview Modal State
  const [previewEvidence, setPreviewEvidence] =
    useState<WorkingPaperEvidence | null>(null);

  // New WP Modal State
  const [isNewWpModalOpen, setIsNewWpModalOpen] = useState(false);
  const [newWpData, setNewWpData] = useState({
    wpRef: "D-401 Trade Receivables",
    clientName: "Apex Footwear & Polymer Ltd.",
    engagementCode: "AUD-2026-081",
    financialYear: "FY 2025-26",
    title:
      "Trade Receivables - Customer Balances Circularization & Expected Credit Loss Testing (IFRS 9 / ISA 505)",
    objective:
      "To obtain independent positive confirmation for customer balances exceeding threshold and verify the adequacy of ECL impairment provisions under IFRS 9 simplified matrix.",
    scope:
      "Covers 45 major export and domestic institutional receivables accounts totaling BDT 142.5M.",
    preparedBy: "Zahirul Islam, FCA",
  });

  // New Procedure Form State inside Detail View
  const [isAddingProcedure, setIsAddingProcedure] = useState(false);
  const [newProcedureDesc, setNewProcedureDesc] = useState("");
  const [newProcedureIsa, setNewProcedureIsa] = useState(
    "ISA 500 (Audit Evidence)",
  );

  // New Evidence Form State inside Detail View
  const [isAttachingEvidence, setIsAttachingEvidence] = useState(false);
  const [newEvidenceFileName, setNewEvidenceFileName] = useState("");

  // Commit New Revision Form State inside Detail View
  const [isCommittingRevision, setIsCommittingRevision] = useState(false);
  const [revisionSummary, setRevisionSummary] = useState("");
  const [revisionVersionTag, setRevisionVersionTag] = useState("");

  // Filtered List
  const filteredWorkingPapers = useMemo(() => {
    return workingPapers.filter((wp) => {
      if (clientFilter !== "All" && wp.clientName !== clientFilter)
        return false;
      if (statusFilter !== "All" && wp.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesRef = wp.wpRef.toLowerCase().includes(q);
        const matchesTitle = wp.title.toLowerCase().includes(q);
        const matchesClient = wp.clientName.toLowerCase().includes(q);
        const matchesPrep = wp.preparedBy.toLowerCase().includes(q);
        if (!matchesRef && !matchesTitle && !matchesClient && !matchesPrep)
          return false;
      }
      return true;
    });
  }, [workingPapers, clientFilter, statusFilter, searchQuery]);

  // Clients list for filter
  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    workingPapers.forEach((wp) => set.add(wp.clientName));
    return Array.from(set);
  }, [workingPapers]);

  // Handle New WP Submit
  const handleCreateWpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWpData.title.trim()) return;

    const initialRevision: WorkingPaperRevision = {
      version: "v1.0",
      timestamp: `${new Date().toISOString().split("T")[0]} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      author: newWpData.preparedBy,
      authorRole: "Audit In-charge",
      hash: `SHA-256: ${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      changeSummary:
        "Initial working paper generation and scope baseline setup.",
      isLocked: false,
    };

    const created: WorkingPaper = {
      id: `wp-${Date.now()}`,
      wpRef: newWpData.wpRef,
      clientName: newWpData.clientName,
      engagementCode: newWpData.engagementCode,
      financialYear: newWpData.financialYear,
      title: newWpData.title,
      objective: newWpData.objective,
      scope: newWpData.scope,
      preparedBy: newWpData.preparedBy,
      preparedDate: new Date().toISOString().split("T")[0],
      status: "Ready for Review",
      version: "v1.0",
      fileHash: initialRevision.hash,
      isLocked: false,
      findingsCount: 0,
      checklistComplete: false,
      procedures: [
        {
          id: `pr-${Date.now()}-1`,
          stepNumber: 1,
          description:
            "Obtain General Ledger sub-ledger balance listing and reconcile to Trial Balance.",
          completed: true,
          performer: newWpData.preparedBy,
          performedDate: new Date().toISOString().split("T")[0],
          isaReference: "ISA 500",
        },
        {
          id: `pr-${Date.now()}-2`,
          stepNumber: 2,
          description:
            "Sample positive confirmation letters to be dispatched to top 15 debtors.",
          completed: false,
          performer: newWpData.preparedBy,
          isaReference: "ISA 505",
        },
      ],
      evidenceFiles: [],
      revisions: [initialRevision],
    };

    onAddWorkingPaper(created);
    setIsNewWpModalOpen(false);
    if (onToast) {
      onToast(
        `Working Paper "${created.wpRef}" created with immutable audit hash.`,
        "success",
      );
    }
  };

  // Toggle procedure completion
  const handleToggleProcedure = (wpId: string, procId: string) => {
    const targetWp = workingPapers.find((w) => w.id === wpId);
    if (!targetWp) return;

    const updatedProcedures = (targetWp.procedures || []).map((p) => {
      if (p.id === procId) {
        const nextCompleted = !p.completed;
        return {
          ...p,
          completed: nextCompleted,
          performedDate: nextCompleted
            ? new Date().toISOString().split("T")[0]
            : undefined,
          performer: nextCompleted ? "Zahirul Islam, FCA" : p.performer,
        };
      }
      return p;
    });

    const allDone = updatedProcedures.every((p) => p.completed);
    const updated = {
      ...targetWp,
      procedures: updatedProcedures,
      checklistComplete: allDone,
    };

    if (onUpdateWorkingPaper) {
      onUpdateWorkingPaper(wpId, updated);
    }
    if (selectedWp && selectedWp.id === wpId) {
      setSelectedWp(updated);
    }
  };

  // Add procedure step
  const handleAddProcedureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWp || !newProcedureDesc.trim()) return;

    const newProc: WorkingPaperProcedure = {
      id: `pr-${Date.now()}`,
      stepNumber: (selectedWp.procedures?.length || 0) + 1,
      description: newProcedureDesc.trim(),
      completed: false,
      performer: "Zahirul Islam, FCA",
      isaReference: newProcedureIsa,
    };

    const updatedProcedures = [...(selectedWp.procedures || []), newProc];
    const updatedWp: WorkingPaper = {
      ...selectedWp,
      procedures: updatedProcedures,
    };

    if (onUpdateWorkingPaper) {
      onUpdateWorkingPaper(selectedWp.id, updatedWp);
    }
    setSelectedWp(updatedWp);
    setNewProcedureDesc("");
    setIsAddingProcedure(false);
    if (onToast) {
      onToast(`Procedure step added to ${selectedWp.wpRef}.`, "info");
    }
  };

  // Attach new evidence file
  const handleAttachEvidenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWp || !newEvidenceFileName.trim()) return;

    const newEvidence: WorkingPaperEvidence = {
      id: `ev-${Date.now()}`,
      fileName: newEvidenceFileName.trim(),
      fileSize: `${(Math.random() * 4 + 1.1).toFixed(1)} MB`,
      uploadedAt: `${new Date().toISOString().split("T")[0]} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      uploadedBy: "Zahirul Islam, FCA",
      hash: `sha256:${Array.from({ length: 24 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
    };

    const updatedEvidence = [...(selectedWp.evidenceFiles || []), newEvidence];
    const updatedWp: WorkingPaper = {
      ...selectedWp,
      evidenceFiles: updatedEvidence,
    };

    if (onUpdateWorkingPaper) {
      onUpdateWorkingPaper(selectedWp.id, updatedWp);
    }
    setSelectedWp(updatedWp);
    setNewEvidenceFileName("");
    setIsAttachingEvidence(false);
    if (onToast) {
      onToast(
        `Evidence "${newEvidence.fileName}" attached and checksummed.`,
        "success",
      );
    }
  };

  // Commit immutable revision
  const handleCommitRevisionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWp || !revisionSummary.trim()) return;

    const nextVer =
      revisionVersionTag.trim() ||
      `v${(parseFloat(selectedWp.version.replace("v", "")) + 0.1).toFixed(1)}`;
    const newHash = `SHA-256: ${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;

    const newRev: WorkingPaperRevision = {
      version: nextVer,
      timestamp: `${new Date().toISOString().split("T")[0]} ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      author: "Zahirul Islam, FCA",
      authorRole: "Audit & Tax Manager",
      hash: newHash,
      changeSummary: revisionSummary.trim(),
      isLocked: false,
    };

    const updatedRevisions = [newRev, ...(selectedWp.revisions || [])];
    const updatedWp: WorkingPaper = {
      ...selectedWp,
      version: nextVer,
      fileHash: newHash,
      revisions: updatedRevisions,
    };

    if (onUpdateWorkingPaper) {
      onUpdateWorkingPaper(selectedWp.id, updatedWp);
    }
    setSelectedWp(updatedWp);
    setRevisionSummary("");
    setRevisionVersionTag("");
    setIsCommittingRevision(false);
    if (onToast) {
      onToast(
        `Revision ${nextVer} sealed into immutable audit ledger.`,
        "success",
      );
    }
  };

  // Toggle Finalized Lock State
  const handleToggleLock = (wp: WorkingPaper) => {
    const nextLocked = !wp.isLocked;
    const updated: WorkingPaper = {
      ...wp,
      isLocked: nextLocked,
      status: nextLocked ? "Partner Signed-off" : "Ready for Review",
    };
    if (onUpdateWorkingPaper) {
      onUpdateWorkingPaper(wp.id, updated);
    }
    if (selectedWp && selectedWp.id === wp.id) {
      setSelectedWp(updated);
    }
    if (onToast) {
      onToast(
        nextLocked
          ? `Working paper "${wp.wpRef}" locked & sealed against modifications (ISA 220).`
          : `Working paper "${wp.wpRef}" unlocked for manager revisions.`,
        "info",
      );
    }
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Evidence Preview Modal */}
      <EvidencePreviewModal
        isOpen={Boolean(previewEvidence)}
        onClose={() => setPreviewEvidence(null)}
        evidence={previewEvidence}
      />

      {/* Action and Filter Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#EBE6DD] shadow-xs">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search WP Ref, Title, Author, or Client..."
            className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:border-[#113227]"
          />
        </div>

        {/* Filters and New WP Button */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-stone-700 focus:outline-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Ready for Review">Ready for Review</option>
            <option value="Manager Approved">Manager Approved</option>
            <option value="Partner Signed-off">Partner Signed-off</option>
          </select>

          <button
            onClick={() => setIsNewWpModalOpen(true)}
            className="btn-forest px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#C58A3E]" />
            <span>Create Working Paper</span>
          </button>
        </div>
      </div>

      {/* Working Paper List Table */}
      <div className="bg-white rounded-3xl border border-[#EBE6DD] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF7F2] border-b border-[#EBE6DD] text-[#7A8782] font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-5 py-3.5">WP Reference &amp; Title</th>
                <th className="px-4 py-3.5">Client &amp; Engagement</th>
                <th className="px-4 py-3.5">Prepared By</th>
                <th className="px-4 py-3.5">Version &amp; Lock</th>
                <th className="px-4 py-3.5">Content Hash / Checksum</th>
                <th className="px-4 py-3.5 text-right">Review Status</th>
                <th className="px-4 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE1] text-[#1C1F1E]">
              {filteredWorkingPapers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-10 text-center text-stone-400"
                  >
                    No working papers match your current search or filter query.
                  </td>
                </tr>
              ) : (
                filteredWorkingPapers.map((wp) => (
                  <tr
                    key={wp.id}
                    className="hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                    onClick={() => setSelectedWp(wp)}
                  >
                    {/* Ref & Title */}
                    <td className="px-5 py-4 max-w-sm">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-xs font-bold text-[#113227] bg-[#FAF0DE] px-2 py-0.5 rounded-md border border-[#EADBBF] shrink-0">
                          {wp.wpRef}
                        </span>
                        <span className="font-bold text-sm text-[#1C1F1E] truncate">
                          {wp.title}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 mt-1 line-clamp-1">
                        {wp.objective ||
                          "Audit Procedures & Substantive Testing"}
                      </div>
                    </td>

                    {/* Client & Engagement */}
                    <td className="px-4 py-4">
                      <div className="font-semibold text-stone-800">
                        {wp.clientName}
                      </div>
                      <div className="text-[10px] font-mono text-stone-400 mt-0.5">
                        {wp.engagementCode || "AUD-2026-081"} •{" "}
                        {wp.financialYear || "FY 2025-26"}
                      </div>
                    </td>

                    {/* Prepared By */}
                    <td className="px-4 py-4 text-[11px] text-stone-600">
                      <div className="font-medium text-stone-800">
                        {wp.preparedBy}
                      </div>
                      <span className="text-[10px] text-stone-400">
                        {wp.preparedDate}
                      </span>
                    </td>

                    {/* Version & Lock State */}
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[11px] font-bold text-[#113227] bg-[#E1F3EE] px-2 py-0.5 rounded border border-[#BCE1D5]">
                          {wp.version || "v1.0"}
                        </span>
                        {wp.isLocked ? (
                          <span
                            className="p-1 rounded bg-emerald-50 text-emerald-800 border border-emerald-200"
                            title="Finalized & Locked against edits (ISA 220)"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLock(wp);
                            }}
                          >
                            <Lock className="w-3.5 h-3.5" />
                          </span>
                        ) : (
                          <span
                            className="p-1 rounded bg-amber-50 text-amber-800 border border-amber-200"
                            title="Editable Draft"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleLock(wp);
                            }}
                          >
                            <Unlock className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Hash / Checksum */}
                    <td className="px-4 py-4">
                      <span
                        className="font-mono text-[10px] text-stone-600 bg-[#FAF7F2] border border-[#E5DDD0] px-2 py-1 rounded inline-block max-w-[140px] truncate"
                        title={wp.fileHash}
                      >
                        {wp.fileHash}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-4 text-right">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                          wp.status === "Partner Signed-off"
                            ? "bg-[#E1F3EE] text-[#1F5946] border border-[#BCE1D5]"
                            : wp.status === "Manager Approved"
                              ? "bg-[#E2F1F8] text-[#1D526D] border border-[#BDE0EE]"
                              : "bg-[#FAF0DE] text-[#8A5A18] border border-[#EADBBF]"
                        }`}
                      >
                        {wp.status}
                      </span>
                    </td>

                    {/* Action Trigger */}
                    <td className="px-4 py-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedWp(wp);
                        }}
                        className="px-2.5 py-1 rounded-xl bg-[#FAF8F5] border border-[#E5DDD0] text-xs font-semibold text-[#113227] hover:bg-[#E1F3EE] flex items-center space-x-1 mx-auto cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Working Paper Detail Drawer */}
      {selectedWp && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex justify-end z-50 animate-fadeIn">
          <div className="bg-white w-full max-w-3xl h-full shadow-2xl flex flex-col overflow-hidden text-left border-l border-[#EBE6DD]">
            {/* Drawer Header */}
            <div className="p-6 bg-[#FAF7F2] border-b border-[#EBE6DD] flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-xs font-bold text-[#113227] bg-[#FAF0DE] px-2.5 py-1 rounded-md border border-[#EADBBF]">
                    {selectedWp.wpRef}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#113227] bg-[#E1F3EE] px-2 py-0.5 rounded border border-[#BCE1D5]">
                    {selectedWp.version || "v1.0"}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      selectedWp.status === "Partner Signed-off"
                        ? "bg-[#E1F3EE] text-[#1F5946]"
                        : "bg-[#FAF0DE] text-[#8A5A18]"
                    }`}
                  >
                    {selectedWp.status}
                  </span>
                </div>
                <h2 className="text-lg font-serif font-bold text-[#1C1F1E] mt-1">
                  {selectedWp.title}
                </h2>
                <div className="text-xs text-stone-500 font-medium">
                  Client:{" "}
                  <strong className="text-stone-800">
                    {selectedWp.clientName}
                  </strong>{" "}
                  • {selectedWp.engagementCode || "AUD-2026-081"} (
                  {selectedWp.financialYear || "FY 2025-26"})
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleToggleLock(selectedWp)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                    selectedWp.isLocked
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                      : "bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100"
                  }`}
                  title={
                    selectedWp.isLocked
                      ? "Click to Unlock"
                      : "Click to Finalize & Lock"
                  }
                >
                  {selectedWp.isLocked ? (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Finalized &amp; Locked</span>
                    </>
                  ) : (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Draft (Editable)</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setSelectedWp(null)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body Tabs / Sections */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAF8F5]">
              {/* Checksum Proof Badge */}
              <div className="p-4 rounded-2xl bg-white border border-[#EBE6DD] flex items-center justify-between shadow-xs">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-xl bg-[#E1F3EE] text-[#113227] flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                      ISA 230 Cryptographic Working Paper Hash
                    </div>
                    <div className="font-mono text-xs text-[#113227] font-semibold break-all">
                      {selectedWp.fileHash}
                    </div>
                  </div>
                </div>
                <div className="text-right text-[11px] text-stone-500 shrink-0">
                  Prepared by <strong>{selectedWp.preparedBy}</strong> on{" "}
                  {selectedWp.preparedDate}
                </div>
              </div>

              {/* 1. Audit Objective & Scope */}
              <div className="bg-white p-5 rounded-2xl border border-[#EBE6DD] shadow-xs space-y-3">
                <div className="flex items-center space-x-2 border-b border-[#F0EBE1] pb-2.5">
                  <Tag className="w-4 h-4 text-[#8A5A18]" />
                  <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-[#1C1F1E]">
                    1. Audit Objective &amp; Scope
                  </h4>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-bold text-stone-700">
                      Audit Objective &amp; Assertions:
                    </span>
                    <p className="text-stone-600 mt-0.5 leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-[#ECE5D9]">
                      {selectedWp.objective ||
                        "To obtain reasonable assurance that balances presented in the financial statements comply with ISA/IFRS standards and assert existence, valuation, rights, and completeness."}
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-stone-700">
                      Testing Scope &amp; Sample Bounds:
                    </span>
                    <p className="text-stone-600 mt-0.5 leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-[#ECE5D9]">
                      {selectedWp.scope ||
                        "Covers 100% of material items above tolerable threshold, with sampling applied to secondary ledger items."}
                    </p>
                  </div>
                </div>
              </div>

              {/* 2. Audit Procedures Performed List */}
              <div className="bg-white p-5 rounded-2xl border border-[#EBE6DD] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-2.5">
                  <div className="flex items-center space-x-2">
                    <CheckSquare className="w-4 h-4 text-[#113227]" />
                    <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-[#1C1F1E]">
                      2. Audit Procedures Performed
                    </h4>
                  </div>
                  <button
                    onClick={() => setIsAddingProcedure(!isAddingProcedure)}
                    className="text-[11px] font-bold text-[#8A5A18] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Step</span>
                  </button>
                </div>

                {/* Add procedure inline form */}
                {isAddingProcedure && (
                  <form
                    onSubmit={handleAddProcedureSubmit}
                    className="p-3.5 bg-[#FAF0DE] rounded-xl border border-[#EADBBF] space-y-2.5 animate-fadeIn"
                  >
                    <div className="text-xs font-bold text-[#8A5A18]">
                      Add New Audit Procedure Step
                    </div>
                    <input
                      type="text"
                      required
                      value={newProcedureDesc}
                      onChange={(e) => setNewProcedureDesc(e.target.value)}
                      placeholder="e.g. Inspect subsequent payments for unpresented cheques"
                      className="w-full px-3 py-1.5 bg-white border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                    />
                    <div className="flex items-center justify-between">
                      <select
                        value={newProcedureIsa}
                        onChange={(e) => setNewProcedureIsa(e.target.value)}
                        className="px-2.5 py-1 bg-white border border-[#E5DDD0] rounded-xl text-[11px] font-medium"
                      >
                        <option value="ISA 500 (Audit Evidence)">
                          ISA 500 (Audit Evidence)
                        </option>
                        <option value="ISA 505 (External Confirmations)">
                          ISA 505 (External Confirmations)
                        </option>
                        <option value="ISA 520 (Analytical Procedures)">
                          ISA 520 (Analytical Procedures)
                        </option>
                        <option value="ISA 530 (Audit Sampling)">
                          ISA 530 (Audit Sampling)
                        </option>
                        <option value="IAS 16 (PPE)">IAS 16 (PPE)</option>
                        <option value="IFRS 15 (Revenue)">
                          IFRS 15 (Revenue)
                        </option>
                      </select>
                      <div className="space-x-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingProcedure(false)}
                          className="px-2.5 py-1 text-xs text-stone-600 rounded-lg hover:bg-stone-200 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1 bg-[#113227] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                        >
                          Save Step
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Procedures Checklist */}
                <div className="space-y-2.5">
                  {(selectedWp.procedures || []).length === 0 ? (
                    <p className="text-xs text-stone-400 italic">
                      No procedures recorded yet.
                    </p>
                  ) : (
                    selectedWp.procedures?.map((proc) => (
                      <div
                        key={proc.id}
                        onClick={() =>
                          handleToggleProcedure(selectedWp.id, proc.id)
                        }
                        className={`p-3 rounded-xl border flex items-start space-x-3 transition-all cursor-pointer ${
                          proc.completed
                            ? "bg-[#E1F3EE]/50 border-[#BCE1D5]"
                            : "bg-[#FAF8F5] border-[#ECE5D9] hover:bg-[#F2ECE1]"
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {proc.completed ? (
                            <CheckSquare className="w-4 h-4 text-[#113227]" />
                          ) : (
                            <Square className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                        <div className="flex-1 text-xs">
                          <div
                            className={`font-semibold ${proc.completed ? "text-[#113227] line-through" : "text-[#1C1F1E]"}`}
                          >
                            Step {proc.stepNumber}: {proc.description}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-stone-400 mt-1">
                            {proc.isaReference && (
                              <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#E5DDD0] text-stone-600">
                                {proc.isaReference}
                              </span>
                            )}
                            <span>
                              Performed by:{" "}
                              <strong className="text-stone-700">
                                {proc.performer}
                              </strong>
                            </span>
                            {proc.performedDate && (
                              <span>on {proc.performedDate}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 3. Attached Evidence Files */}
              <div className="bg-white p-5 rounded-2xl border border-[#EBE6DD] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-2.5">
                  <div className="flex items-center space-x-2">
                    <Paperclip className="w-4 h-4 text-[#1D526D]" />
                    <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-[#1C1F1E]">
                      3. Attached Evidence Files (
                      {selectedWp.evidenceFiles?.length || 0})
                    </h4>
                  </div>
                  <button
                    onClick={() => setIsAttachingEvidence(!isAttachingEvidence)}
                    className="text-[11px] font-bold text-[#1D526D] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Attach Evidence</span>
                  </button>
                </div>

                {/* Attach Evidence inline form */}
                {isAttachingEvidence && (
                  <form
                    onSubmit={handleAttachEvidenceSubmit}
                    className="p-3.5 bg-[#E2F1F8] rounded-xl border border-[#BDE0EE] space-y-2.5 animate-fadeIn"
                  >
                    <div className="text-xs font-bold text-[#1D526D]">
                      Attach Verified Working Paper Artifact
                    </div>
                    <input
                      type="text"
                      required
                      value={newEvidenceFileName}
                      onChange={(e) => setNewEvidenceFileName(e.target.value)}
                      placeholder="e.g. Bank_Confirmation_Reply_Eastern_Bank_Signed.pdf"
                      className="w-full px-3 py-1.5 bg-white border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                    />
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsAttachingEvidence(false)}
                        className="px-2.5 py-1 text-xs text-stone-600 rounded-lg hover:bg-stone-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-[#1D526D] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        Attach &amp; Hash
                      </button>
                    </div>
                  </form>
                )}

                {/* Evidence List */}
                <div className="space-y-2">
                  {(selectedWp.evidenceFiles || []).length === 0 ? (
                    <p className="text-xs text-stone-400 italic">
                      No external evidence files attached.
                    </p>
                  ) : (
                    selectedWp.evidenceFiles?.map((ev) => (
                      <div
                        key={ev.id}
                        className="p-3 rounded-xl bg-[#FAF8F5] border border-[#ECE5D9] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2.5 truncate max-w-md">
                          <FileText className="w-4 h-4 text-[#113227] shrink-0" />
                          <div className="truncate">
                            <div className="font-semibold text-stone-900 truncate">
                              {ev.fileName}
                            </div>
                            <div className="text-[10px] text-stone-400 font-mono">
                              {ev.fileSize} • {ev.uploadedBy} • {ev.uploadedAt}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            onClick={() => setPreviewEvidence(ev)}
                            className="px-2.5 py-1 rounded-lg bg-white border border-[#E5DDD0] text-[11px] font-semibold text-[#113227] hover:bg-[#E1F3EE] flex items-center space-x-1 cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Preview</span>
                          </button>
                          <button
                            onClick={() =>
                              alert(
                                `Downloading verified copy of ${ev.fileName}`,
                              )
                            }
                            className="p-1 text-stone-400 hover:text-stone-800 cursor-pointer"
                            title="Download Evidence"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* 4. Immutable Revision History Tree */}
              <div className="bg-white p-5 rounded-2xl border border-[#EBE6DD] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-2.5">
                  <div className="flex items-center space-x-2">
                    <GitBranch className="w-4 h-4 text-[#8A5A18]" />
                    <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-[#1C1F1E]">
                      4. Immutable Revision Tree (
                      {selectedWp.revisions?.length || 1} Revisions)
                    </h4>
                  </div>
                  <button
                    onClick={() =>
                      setIsCommittingRevision(!isCommittingRevision)
                    }
                    className="text-[11px] font-bold text-[#8A5A18] hover:underline flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Commit Revision</span>
                  </button>
                </div>

                {/* Commit Revision inline form */}
                {isCommittingRevision && (
                  <form
                    onSubmit={handleCommitRevisionSubmit}
                    className="p-3.5 bg-[#FAF0DE] rounded-xl border border-[#EADBBF] space-y-2.5 animate-fadeIn"
                  >
                    <div className="text-xs font-bold text-[#8A5A18]">
                      Commit Immutable Revision Tag (ISA 220)
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <input
                          type="text"
                          value={revisionVersionTag}
                          onChange={(e) =>
                            setRevisionVersionTag(e.target.value)
                          }
                          placeholder="e.g. v1.3"
                          className="w-full px-3 py-1.5 bg-white border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="text"
                          required
                          value={revisionSummary}
                          onChange={(e) => setRevisionSummary(e.target.value)}
                          placeholder="Summary of modifications or sign-off notes..."
                          className="w-full px-3 py-1.5 bg-white border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsCommittingRevision(false)}
                        className="px-2.5 py-1 text-xs text-stone-600 rounded-lg hover:bg-stone-200 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-[#113227] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                      >
                        Commit &amp; Seal Hash
                      </button>
                    </div>
                  </form>
                )}

                {/* Revision Timeline Tree */}
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EBE6DD]">
                  {(selectedWp.revisions || []).map((rev, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-[#113227] border-2 border-white" />
                      <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#ECE5D9] space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-mono font-bold text-[#113227] bg-[#E1F3EE] px-2 py-0.5 rounded border border-[#BCE1D5]">
                            {rev.version}
                          </span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            {rev.timestamp}
                          </span>
                        </div>
                        <p className="text-xs text-stone-800 font-medium mt-1 leading-snug">
                          {rev.changeSummary}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-stone-400 pt-1 border-t border-[#F0EBE1]">
                          <span>
                            Author:{" "}
                            <strong className="text-stone-700">
                              {rev.author}
                            </strong>{" "}
                            ({rev.authorRole || "Audit Team"})
                          </span>
                          <span className="font-mono truncate max-w-[150px]">
                            {rev.hash}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="p-4 bg-[#FAF7F2] border-t border-[#EBE6DD] flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-stone-500">
                <CheckCircle2 className="w-4 h-4 text-[#113227]" />
                <span>ISA 230 &amp; ICAB Documentation Alignment</span>
              </div>
              <button
                onClick={() => setSelectedWp(null)}
                className="btn-forest px-5 py-2 rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* "+ Create Working Paper" Modal Dialog */}
      {isNewWpModalOpen && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#EBE6DD] max-w-lg w-full p-6 text-left shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-[#113227]" />
                <h3 className="text-base font-serif font-bold text-[#1C1F1E]">
                  Create Working Paper Schedule
                </h3>
              </div>
              <button
                onClick={() => setIsNewWpModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateWpSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    WP Reference Code
                  </label>
                  <input
                    type="text"
                    required
                    value={newWpData.wpRef}
                    onChange={(e) =>
                      setNewWpData({ ...newWpData, wpRef: e.target.value })
                    }
                    placeholder="e.g. D-401 Trade Receivables"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none focus:border-[#113227] font-mono font-bold text-[#113227]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Financial Year
                  </label>
                  <select
                    value={newWpData.financialYear}
                    onChange={(e) =>
                      setNewWpData({
                        ...newWpData,
                        financialYear: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                  >
                    <option value="FY 2025-26">FY 2025-26</option>
                    <option value="FY 2024-25">FY 2024-25</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Client Entity
                </label>
                <select
                  value={newWpData.clientName}
                  onChange={(e) =>
                    setNewWpData({ ...newWpData, clientName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none font-medium"
                >
                  {uniqueClients.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Working Paper Title &amp; Standard
                </label>
                <input
                  type="text"
                  required
                  value={newWpData.title}
                  onChange={(e) =>
                    setNewWpData({ ...newWpData, title: e.target.value })
                  }
                  placeholder="e.g. Accounts Receivable Circularization & Subsequent Recoveries (ISA 505)"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none focus:border-[#113227]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Audit Objective &amp; Assertions
                </label>
                <textarea
                  rows={2}
                  value={newWpData.objective}
                  onChange={(e) =>
                    setNewWpData({ ...newWpData, objective: e.target.value })
                  }
                  placeholder="State the core ISA objective and assertions tested..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-[#F0EBE1]">
                <button
                  type="button"
                  onClick={() => setIsNewWpModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5DDD0] text-xs font-semibold hover:bg-stone-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-forest px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Generate Working Paper
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
