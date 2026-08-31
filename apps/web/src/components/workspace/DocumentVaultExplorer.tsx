import React, { useState, useMemo } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  FileCode,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  UploadCloud,
  Search,
  Filter,
  Eye,
  Download,
  ChevronRight,
  ChevronDown,
  Plus,
  HardDrive,
  Calendar,
  Layers,
  CheckCircle2,
  Tag,
  AlertCircle,
  FileBox,
} from "lucide-react";
import { DocumentVaultItem } from "../../types";
import { EvidencePreviewModal } from "./EvidencePreviewModal";

interface DocumentVaultExplorerProps {
  documents: DocumentVaultItem[];
  onAddDocument: (doc: Partial<DocumentVaultItem>) => void;
  onToast?: (message: string, type: "success" | "info" | "error") => void;
}

type SectionType =
  | "Current Audit File"
  | "Permanent Audit File"
  | "Tax Filings"
  | "Legal Records";

export const DocumentVaultExplorer: React.FC<DocumentVaultExplorerProps> = ({
  documents,
  onAddDocument,
  onToast,
}) => {
  // Navigation / Directory Tree State
  // Hierarchy: Client Name -> Financial Year -> Engagement Type -> Working Paper Sections
  const [selectedClient, setSelectedClient] = useState<string>("All");
  const [selectedYear, setSelectedYear] = useState<string>("All");
  const [selectedEngagementType, setSelectedEngagementType] =
    useState<string>("All");
  const [selectedSection, setSelectedSection] = useState<string>("All");

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [confidentialityFilter, setConfidentialityFilter] =
    useState<string>("All");

  // Preview Modal
  const [previewDoc, setPreviewDoc] = useState<DocumentVaultItem | null>(null);

  // Upload Zone State
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadClient, setUploadClient] = useState(
    "Apex Footwear & Polymer Ltd.",
  );
  const [uploadYear, setUploadYear] = useState("FY 2025-26");
  const [uploadEngagementType, setUploadEngagementType] =
    useState("Statutory Audit");
  const [uploadSection, setUploadSection] =
    useState<SectionType>("Current Audit File");
  const [uploadCategory, setUploadCategory] =
    useState<DocumentVaultItem["category"]>("Trial Balance");
  const [uploadConfidentiality, setUploadConfidentiality] = useState<
    "Public" | "Internal" | "Highly Confidential"
  >("Highly Confidential");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Unique clients, years, engagement types from data
  const clientsList = useMemo(() => {
    const set = new Set<string>();
    documents.forEach((d) => {
      if (d.clientName) set.add(d.clientName);
    });
    return Array.from(set);
  }, [documents]);

  const yearsList = useMemo(() => {
    return ["FY 2025-26", "FY 2024-25", "FY 2023-24"];
  }, []);

  const engagementTypesList = useMemo(() => {
    return [
      "Statutory Audit",
      "Tax Advisory",
      "VAT Compliance",
      "Corporate Advisory",
    ];
  }, []);

  const sectionsList: SectionType[] = [
    "Current Audit File",
    "Permanent Audit File",
    "Tax Filings",
    "Legal Records",
  ];

  // Filtered Documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // Directory filtering
      if (selectedClient !== "All" && doc.clientName !== selectedClient)
        return false;
      if (
        selectedYear !== "All" &&
        (doc.financialYear || "FY 2025-26") !== selectedYear
      )
        return false;
      if (
        selectedEngagementType !== "All" &&
        (doc.engagementType || "Statutory Audit") !== selectedEngagementType
      )
        return false;
      if (
        selectedSection !== "All" &&
        (doc.section || "Current Audit File") !== selectedSection
      )
        return false;

      // Category & Confidentiality
      if (categoryFilter !== "All" && doc.category !== categoryFilter)
        return false;
      if (
        confidentialityFilter !== "All" &&
        (doc.confidentiality || "Internal") !== confidentialityFilter
      )
        return false;

      // Search Query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = doc.fileName.toLowerCase().includes(q);
        const matchesClient = doc.clientName.toLowerCase().includes(q);
        const matchesHash = doc.hash.toLowerCase().includes(q);
        const matchesCat = doc.category.toLowerCase().includes(q);
        if (!matchesName && !matchesClient && !matchesHash && !matchesCat)
          return false;
      }

      return true;
    });
  }, [
    documents,
    selectedClient,
    selectedYear,
    selectedEngagementType,
    selectedSection,
    categoryFilter,
    confidentialityFilter,
    searchQuery,
  ]);

  // Handle Drag & Drop / File Select
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      setUploadFileName(file.name);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleManualFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadFileName(e.target.files[0].name);
    }
  };

  // Perform secure upload with simulated cryptographic hashing & progress
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName =
      uploadFileName.trim() || `Audit_Working_Doc_${Date.now()}.pdf`;

    setUploadProgress(15);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 100;
        if (prev >= 90) {
          clearInterval(interval);
          // Complete upload
          const generatedHash = `sha256:${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`;
          onAddDocument({
            id: `doc-${Date.now()}`,
            fileName: finalName,
            clientName: uploadClient,
            financialYear: uploadYear,
            engagementType: uploadEngagementType,
            section: uploadSection,
            category: uploadCategory,
            confidentiality: uploadConfidentiality,
            fileSize: `${(Math.random() * 6 + 1.2).toFixed(1)} MB`,
            uploadedBy: "Zahirul Islam, FCA",
            uploadedAt: new Date().toISOString().split("T")[0],
            hash: generatedHash,
            version: "v1.0 (Locked)",
            isLocked: true,
          });

          setTimeout(() => {
            setUploadProgress(null);
            setUploadFileName("");
            if (onToast) {
              onToast(
                `Document "${finalName}" encrypted and stored into ${uploadSection}.`,
                "success",
              );
            }
          }, 300);
          return 100;
        }
        return prev + 25;
      });
    }, 120);
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* Evidence Preview Modal */}
      <EvidencePreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        docItem={previewDoc}
      />

      {/* Directory Hierarchy Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white border border-[#EBE6DD] flex items-center space-x-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#E1F3EE] text-[#113227] flex items-center justify-center font-bold shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Total Vault Storage
            </div>
            <div className="text-lg font-bold font-serif text-[#1C1F1E]">
              {documents.length} Encrypted Files
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EBE6DD] flex items-center space-x-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#FAF0DE] text-[#8A5A18] flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              High Confidentiality
            </div>
            <div className="text-lg font-bold font-serif text-[#8A5A18]">
              {
                documents.filter(
                  (d) => d.confidentiality === "Highly Confidential",
                ).length
              }{" "}
              Restrictive Docs
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EBE6DD] flex items-center space-x-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-[#E2F1F8] text-[#1D526D] flex items-center justify-center font-bold shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Active Working Sections
            </div>
            <div className="text-lg font-bold font-serif text-[#1D526D]">
              4 Standard ISA Tiers
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#EBE6DD] flex items-center space-x-3 shadow-xs">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#1F5946] flex items-center justify-center font-bold shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Tamper-Proof Lock Rate
            </div>
            <div className="text-lg font-bold font-serif text-[#1F5946]">
              100% SHA-256 Hashed
            </div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Layout: Folder Directory Tree (Left) + Document Explorer & Upload (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 4-Level Directory Hierarchy Browser */}
        <div className="lg:col-span-4 bg-white p-5 rounded-3xl border border-[#EBE6DD] shadow-xs space-y-4 flex flex-col">
          <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
            <div className="flex items-center space-x-2">
              <FolderOpen className="w-4 h-4 text-[#113227]" />
              <h3 className="text-sm font-bold font-serif text-[#1C1F1E]">
                Directory Hierarchy
              </h3>
            </div>
            <button
              onClick={() => {
                setSelectedClient("All");
                setSelectedYear("All");
                setSelectedEngagementType("All");
                setSelectedSection("All");
              }}
              className="text-[11px] font-bold text-[#8A5A18] hover:underline cursor-pointer"
            >
              Reset to Root
            </button>
          </div>

          <div className="text-xs text-stone-500 font-medium leading-tight">
            Structure:{" "}
            <span className="text-[#113227] font-semibold">
              Client Name → Financial Year → Engagement Type → Working Paper
              Section
            </span>
          </div>

          {/* Level 1: Client Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
              <span>1. Client Portfolio</span>
              <span className="font-mono text-stone-500">
                {selectedClient === "All" ? "All Clients" : selectedClient}
              </span>
            </label>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              <button
                onClick={() => setSelectedClient("All")}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                  selectedClient === "All"
                    ? "bg-[#113227] text-white"
                    : "bg-[#FAF8F5] text-stone-700 hover:bg-[#F2ECE1]"
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <Folder className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Root / All Clients</span>
                </div>
                <span className="text-[10px] font-mono opacity-80">
                  {documents.length}
                </span>
              </button>

              {clientsList.map((client) => {
                const count = documents.filter(
                  (d) => d.clientName === client,
                ).length;
                return (
                  <button
                    key={client}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      selectedClient === client
                        ? "bg-[#113227] text-white"
                        : "bg-[#FAF8F5] text-stone-700 hover:bg-[#F2ECE1]"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Folder className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{client}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-80">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Level 2: Financial Year */}
          <div className="space-y-1.5 pt-2 border-t border-[#F0EBE1]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
              <span>2. Financial Year</span>
              <span className="font-mono text-stone-500">{selectedYear}</span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setSelectedYear("All")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedYear === "All"
                    ? "bg-[#FAF0DE] text-[#8A5A18] border border-[#EADBBF]"
                    : "bg-[#FAF8F5] text-stone-600 hover:bg-[#F2ECE1]"
                }`}
              >
                All FYs
              </button>
              {yearsList.map((yr) => (
                <button
                  key={yr}
                  onClick={() => setSelectedYear(yr)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    selectedYear === yr
                      ? "bg-[#FAF0DE] text-[#8A5A18] border border-[#EADBBF]"
                      : "bg-[#FAF8F5] text-stone-600 hover:bg-[#F2ECE1]"
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Level 3: Engagement Type */}
          <div className="space-y-1.5 pt-2 border-t border-[#F0EBE1]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
              <span>3. Engagement Service Type</span>
              <span className="font-mono text-stone-500">
                {selectedEngagementType}
              </span>
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setSelectedEngagementType("All")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  selectedEngagementType === "All"
                    ? "bg-[#E1F3EE] text-[#113227] border border-[#BCE1D5]"
                    : "bg-[#FAF8F5] text-stone-600 hover:bg-[#F2ECE1]"
                }`}
              >
                All Services
              </button>
              {engagementTypesList.map((eng) => (
                <button
                  key={eng}
                  onClick={() => setSelectedEngagementType(eng)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer truncate ${
                    selectedEngagementType === eng
                      ? "bg-[#E1F3EE] text-[#113227] border border-[#BCE1D5]"
                      : "bg-[#FAF8F5] text-stone-600 hover:bg-[#F2ECE1]"
                  }`}
                >
                  {eng}
                </button>
              ))}
            </div>
          </div>

          {/* Level 4: Working Paper Sections */}
          <div className="space-y-1.5 pt-2 border-t border-[#F0EBE1]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
              <span>4. Working Paper Sections</span>
              <span className="font-mono text-stone-500">
                {selectedSection}
              </span>
            </label>
            <div className="space-y-1">
              <button
                onClick={() => setSelectedSection("All")}
                className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-2 transition-all cursor-pointer ${
                  selectedSection === "All"
                    ? "bg-[#113227] text-white"
                    : "bg-[#FAF8F5] text-stone-700 hover:bg-[#F2ECE1]"
                }`}
              >
                <Folder className="w-3.5 h-3.5 shrink-0" />
                <span>All 4 Working Paper Sections</span>
              </button>

              {sectionsList.map((sec) => {
                const count = documents.filter(
                  (d) => (d.section || "Current Audit File") === sec,
                ).length;
                return (
                  <button
                    key={sec}
                    onClick={() => setSelectedSection(sec)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      selectedSection === sec
                        ? "bg-[#113227] text-white"
                        : "bg-[#FAF8F5] text-stone-700 hover:bg-[#F2ECE1]"
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <Folder className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{sec}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-80">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Secure File Upload Zone + Vault Explorer Grid */}
        <div className="lg:col-span-8 space-y-6">
          {/* Breadcrumb Path Display */}
          <div className="bg-white p-3.5 rounded-2xl border border-[#EBE6DD] flex items-center space-x-2 text-xs text-stone-600 font-medium overflow-x-auto shadow-xs">
            <span className="text-stone-400 font-mono">PATH:</span>
            <span className="font-bold text-[#113227]">Vault</span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span
              className={
                selectedClient !== "All"
                  ? "font-bold text-[#113227]"
                  : "text-stone-500"
              }
            >
              {selectedClient === "All" ? "All Clients" : selectedClient}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span
              className={
                selectedYear !== "All"
                  ? "font-bold text-[#113227]"
                  : "text-stone-500"
              }
            >
              {selectedYear === "All" ? "All FY" : selectedYear}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span
              className={
                selectedEngagementType !== "All"
                  ? "font-bold text-[#113227]"
                  : "text-stone-500"
              }
            >
              {selectedEngagementType === "All"
                ? "All Services"
                : selectedEngagementType}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span
              className={
                selectedSection !== "All"
                  ? "font-bold text-[#8A5A18] bg-[#FAF0DE] px-2 py-0.5 rounded"
                  : "text-stone-500"
              }
            >
              {selectedSection === "All" ? "All Sections" : selectedSection}
            </span>
          </div>

          {/* Secure File Upload Zone */}
          <div className="bg-white p-5 rounded-3xl border border-[#EBE6DD] shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0EBE1] pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#FAF0DE] text-[#8A5A18] flex items-center justify-center">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold font-serif text-[#1C1F1E]">
                    Secure File Upload Zone
                  </h4>
                  <p className="text-[11px] text-stone-500">
                    Drag &amp; drop with confidentiality tagging &amp; SHA-256
                    integrity sealing.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#113227] bg-[#E1F3EE] px-2.5 py-1 rounded-full border border-[#BCE1D5]">
                ISA 230 Sealing Active
              </span>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Drag & Drop Box */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                  isDragOver
                    ? "border-[#113227] bg-[#E1F3EE]/40"
                    : "border-[#D9D1C3] bg-[#FAF8F5] hover:bg-[#F5EFE6]"
                }`}
                onClick={() =>
                  document.getElementById("vault-file-input")?.click()
                }
              >
                <input
                  id="vault-file-input"
                  type="file"
                  onChange={handleManualFileSelect}
                  className="hidden"
                />
                <UploadCloud className="w-8 h-8 mx-auto text-[#8A5A18] mb-2" />
                <div className="text-xs font-bold text-[#1C1F1E]">
                  {uploadFileName ? (
                    <span className="text-[#113227] font-mono text-sm bg-white px-3 py-1 rounded-xl border border-[#BCE1D5]">
                      Selected: {uploadFileName}
                    </span>
                  ) : (
                    <span>
                      Drag and drop audit file here, or{" "}
                      <strong className="text-[#8A5A18] underline">
                        browse documents
                      </strong>
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-stone-400 mt-1">
                  Supported formats: PDF, XLSX, DOCX, ZIP, CSV, XML (Max 50MB
                  per file)
                </div>
              </div>

              {/* Tagging Controls Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Target Client
                  </label>
                  <select
                    value={uploadClient}
                    onChange={(e) => setUploadClient(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none focus:border-[#113227] font-medium"
                  >
                    {clientsList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Working Paper Section
                  </label>
                  <select
                    value={uploadSection}
                    onChange={(e) =>
                      setUploadSection(e.target.value as SectionType)
                    }
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none focus:border-[#113227] font-medium"
                  >
                    {sectionsList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Category Tag
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none focus:border-[#113227] font-medium"
                  >
                    <option value="Trial Balance">
                      Trial Balance / Lead Schedule
                    </option>
                    <option value="Bank Confirmation">
                      Bank Confirmation (ISA 505)
                    </option>
                    <option value="Engagement Letter">
                      Engagement Letter &amp; Independence
                    </option>
                    <option value="Board Minutes">
                      Board Minutes &amp; Resolutions
                    </option>
                    <option value="Tax Return">Tax Return / Challan</option>
                    <option value="Legal Certificate">
                      Legal Certificate / RJSC
                    </option>
                    <option value="Voucher Evidence">Voucher Evidence</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Confidentiality Label
                  </label>
                  <select
                    value={uploadConfidentiality}
                    onChange={(e) =>
                      setUploadConfidentiality(e.target.value as any)
                    }
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none focus:border-[#113227] font-semibold text-[#8A5A18]"
                  >
                    <option value="Highly Confidential">
                      Highly Confidential (Restricted)
                    </option>
                    <option value="Internal">
                      Internal (Engagement Team Only)
                    </option>
                    <option value="Public">Public (Published Record)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Financial Year
                  </label>
                  <select
                    value={uploadYear}
                    onChange={(e) => setUploadYear(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none focus:border-[#113227] font-medium"
                  >
                    {yearsList.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Engagement Service
                  </label>
                  <select
                    value={uploadEngagementType}
                    onChange={(e) => setUploadEngagementType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none focus:border-[#113227] font-medium"
                  >
                    {engagementTypesList.map((eng) => (
                      <option key={eng} value={eng}>
                        {eng}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Upload Progress Bar */}
              {uploadProgress !== null && (
                <div className="space-y-1.5 p-3 rounded-2xl bg-[#FAF0DE] border border-[#EADBBF] animate-fadeIn">
                  <div className="flex justify-between text-xs font-bold text-[#8A5A18]">
                    <span>Encrypting &amp; Generating SHA-256 Checksum...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#113227] transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={uploadProgress !== null}
                  className="btn-forest px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <Lock className="w-3.5 h-3.5 text-[#C58A3E]" />
                  <span>Secure &amp; Seal Document into Vault</span>
                </button>
              </div>
            </form>
          </div>

          {/* Search, Filter and Document Grid */}
          <div className="space-y-4">
            {/* Search & Category Filter Bar */}
            <div className="bg-white p-4 rounded-2xl border border-[#EBE6DD] flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search file name, client, hash..."
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:border-[#113227]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-stone-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Categories</option>
                  <option value="Trial Balance">Trial Balance</option>
                  <option value="Bank Confirmation">Bank Confirmation</option>
                  <option value="Engagement Letter">Engagement Letter</option>
                  <option value="Board Minutes">Board Minutes</option>
                  <option value="Tax Return">Tax Return</option>
                  <option value="Legal Certificate">Legal Certificate</option>
                </select>

                <select
                  value={confidentialityFilter}
                  onChange={(e) => setConfidentialityFilter(e.target.value)}
                  className="px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-stone-700 focus:outline-none cursor-pointer"
                >
                  <option value="All">All Confidentiality</option>
                  <option value="Highly Confidential">
                    Highly Confidential
                  </option>
                  <option value="Internal">Internal</option>
                  <option value="Public">Public</option>
                </select>
              </div>
            </div>

            {/* Document Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDocs.length === 0 ? (
                <div className="col-span-2 p-12 text-center bg-white rounded-3xl border border-[#EBE6DD] space-y-3">
                  <FileBox className="w-10 h-10 mx-auto text-stone-300" />
                  <div className="text-sm font-bold text-stone-700">
                    No documents found matching this directory path or filter
                  </div>
                  <p className="text-xs text-stone-400">
                    Try changing the directory folder on the left or clearing
                    filters.
                  </p>
                </div>
              ) : (
                filteredDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-5 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs hover:border-[#BCE1D5] transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E2F1F8] text-[#1D526D]">
                          {doc.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            doc.confidentiality === "Highly Confidential"
                              ? "bg-rose-50 text-rose-700 border border-rose-200"
                              : doc.confidentiality === "Internal"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {doc.confidentiality || "Internal"}
                        </span>
                      </div>

                      {/* File Name */}
                      <h4
                        className="text-xs font-bold text-[#1C1F1E] break-all leading-snug hover:text-[#113227] cursor-pointer"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        {doc.fileName}
                      </h4>

                      <div className="text-[11px] text-stone-500 mt-1 font-medium">
                        {doc.clientName}
                      </div>

                      {/* Folder Tag */}
                      <div className="my-2.5 inline-flex items-center space-x-1.5 bg-[#FAF8F5] px-2.5 py-1 rounded-xl text-[10px] font-mono text-stone-600 border border-[#ECE5D9]">
                        <Folder className="w-3 h-3 text-[#8A5A18]" />
                        <span>{doc.section || "Current Audit File"}</span>
                      </div>

                      {/* Hash Checksum */}
                      <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#ECE5D9] font-mono text-[9.5px] text-stone-500 break-all flex items-center space-x-1">
                        <Lock className="w-3 h-3 text-[#113227] shrink-0" />
                        <span className="truncate">{doc.hash}</span>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="pt-3 mt-3 border-t border-[#F0EBE1] flex items-center justify-between text-xs text-[#66706B]">
                      <span className="text-[11px] font-mono">
                        {doc.fileSize} • {doc.uploadedAt}
                      </span>
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="px-2.5 py-1 bg-[#FAF8F5] hover:bg-[#E1F3EE] rounded-lg text-[#113227] font-semibold text-[11px] flex items-center space-x-1 cursor-pointer transition-colors border border-[#E5DDD0]"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Preview</span>
                        </button>
                        <button
                          onClick={() =>
                            alert(
                              `Downloading verified artifact: ${doc.fileName}`,
                            )
                          }
                          className="p-1.5 hover:bg-stone-100 rounded-lg text-[#113227] cursor-pointer"
                          title="Download File"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
