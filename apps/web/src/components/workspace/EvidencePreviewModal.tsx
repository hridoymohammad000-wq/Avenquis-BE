import React from "react";
import {
  X,
  Download,
  ShieldCheck,
  FileText,
  Lock,
  CheckCircle2,
  Calendar,
  User,
  Hash,
} from "lucide-react";
import { WorkingPaperEvidence, DocumentVaultItem } from "../../types";

interface EvidencePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  evidence?: WorkingPaperEvidence | null;
  docItem?: DocumentVaultItem | null;
}

export const EvidencePreviewModal: React.FC<EvidencePreviewModalProps> = ({
  isOpen,
  onClose,
  evidence,
  docItem,
}) => {
  if (!isOpen || (!evidence && !docItem)) return null;

  const fileName =
    evidence?.fileName || docItem?.fileName || "Audit_Evidence.pdf";
  const fileSize = evidence?.fileSize || docItem?.fileSize || "2.4 MB";
  const uploadedBy =
    evidence?.uploadedBy || docItem?.uploadedBy || "Senior Audit Associate";
  const uploadedAt =
    evidence?.uploadedAt || docItem?.uploadedAt || "2026-08-30";
  const hash =
    evidence?.hash ||
    docItem?.hash ||
    "sha256:4f9a8820c19a9bb823fe4100c8712399aa821092";
  const confidentiality = docItem?.confidentiality || "Highly Confidential";
  const isLocked = docItem ? docItem.isLocked : true;

  const isExcel =
    fileName.endsWith(".xlsx") ||
    fileName.endsWith(".xls") ||
    fileName.endsWith(".csv");
  const isZip = fileName.endsWith(".zip") || fileName.endsWith(".tar");

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-[#EBE6DD] max-w-3xl w-full flex flex-col max-h-[90vh] text-left shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-[#FAF7F2] border-b border-[#EBE6DD] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E1F3EE] text-[#113227] flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-[#1C1F1E] font-serif break-all">
                  {fileName}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    confidentiality === "Highly Confidential"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : confidentiality === "Internal"
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {confidentiality}
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                Size: {fileSize} • Uploaded by {uploadedBy} on {uploadedAt}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() =>
                alert(`Downloading signed & verified copy of ${fileName}`)
              }
              className="px-3 py-1.5 rounded-xl border border-[#D9D1C3] bg-white text-xs font-semibold text-[#113227] hover:bg-[#FAF8F5] flex items-center space-x-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content - Simulated Document Preview */}
        <div className="p-6 overflow-y-auto space-y-5 bg-[#FCFAF6] flex-1">
          {/* Checksum & Cryptographic Proof */}
          <div className="p-4 rounded-2xl bg-white border border-[#EBE6DD] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-xl bg-[#FAF0DE] text-[#8A5A18] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  ISA 230 Tamper-Evident SHA-256 Checksum
                </div>
                <div className="font-mono text-xs text-[#113227] font-semibold break-all">
                  {hash}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              {isLocked ? (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Lock className="w-3 h-3" />
                  <span>Immutable Lock Active</span>
                </span>
              ) : (
                <span className="inline-flex items-center space-x-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                  <span>Editable Working Copy</span>
                </span>
              )}
            </div>
          </div>

          {/* Document Content Simulation */}
          <div className="p-6 rounded-2xl bg-white border border-[#E5DDD0] shadow-sm space-y-4">
            <div className="border-b border-stone-200 pb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#8A5A18] font-bold">
                  AVENQUIS AUDIT REPOSITORY • VERIFIED ARTIFACT
                </span>
                <h4 className="text-sm font-bold text-stone-900 mt-0.5">
                  {fileName}
                </h4>
              </div>
              <span className="text-[10px] text-stone-400 font-mono">
                Page 1 of 1 (Verified)
              </span>
            </div>

            {isExcel ? (
              <div className="space-y-3 font-sans text-xs">
                <div className="text-[11px] text-stone-500 font-medium">
                  Spreadsheet Data Preview (Extract from Primary Ledger
                  Reconciliation):
                </div>
                <div className="overflow-x-auto border border-stone-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F2] text-stone-600 font-bold border-b border-stone-200 text-[10px] uppercase">
                      <tr>
                        <th className="px-3 py-2">GL Account Code</th>
                        <th className="px-3 py-2">Description</th>
                        <th className="px-3 py-2 text-right">
                          Balance per Books (BDT)
                        </th>
                        <th className="px-3 py-2 text-right">
                          Confirmation / Tested (BDT)
                        </th>
                        <th className="px-3 py-2 text-right">Variance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100 text-stone-700">
                      <tr>
                        <td className="px-3 py-2 font-mono">GL-101-001</td>
                        <td className="px-3 py-2">
                          Sonali Bank Ltd. - CA A/C #0021
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">
                          24,580,210.00
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-700 font-semibold">
                          24,580,210.00
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-600 font-bold">
                          0.00 (Nil)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono">GL-101-004</td>
                        <td className="px-3 py-2">
                          Eastern Bank PLC - USD Margin A/C
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">
                          18,340,900.00
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-700 font-semibold">
                          18,340,900.00
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-600 font-bold">
                          0.00 (Nil)
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-mono">GL-101-009</td>
                        <td className="px-3 py-2">
                          City Bank PLC - Escrow Account
                        </td>
                        <td className="px-3 py-2 text-right font-mono font-semibold">
                          9,200,500.00
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-700 font-semibold">
                          9,200,500.00
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-emerald-600 font-bold">
                          0.00 (Nil)
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ) : isZip ? (
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-stone-200 text-xs text-stone-700 space-y-2">
                <div className="font-semibold text-stone-900">
                  Archive Manifest:
                </div>
                <ul className="list-disc list-inside space-y-1 text-stone-600 font-mono text-[11px]">
                  <li>Mushak_6_3_Challan_Sample_Batch_01.pdf (Verified)</li>
                  <li>Treasury_Challan_Bank_Deposit_Slips_Q1.pdf (Verified)</li>
                  <li>
                    Monthly_VAT_Return_Submissions_Mushak_9_1.pdf (Signed)
                  </li>
                </ul>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-stone-700 leading-relaxed font-serif">
                <p className="italic text-stone-500">
                  "This document serves as an immutable evidence record
                  collected under ISA 500 / ISA 505 procedures. Digital
                  signature and cryptographic verification have been validated
                  against firm root certificates."
                </p>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200 text-xs font-sans space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-stone-500">
                      Document Classification:
                    </span>
                    <span className="font-semibold text-stone-800">
                      {confidentiality}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">
                      Audit Assertion Addressed:
                    </span>
                    <span className="font-semibold text-[#113227]">
                      Existence, Rights &amp; Obligations, Accuracy
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">
                      Retention Requirement:
                    </span>
                    <span className="font-semibold text-stone-800">
                      7 Years (ICAB / FRC Mandate)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#EBE6DD] flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#113227]" />
            <span>Digital Cryptographic Audit Trail Verified</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#113227] text-white font-semibold hover:bg-[#1A4536] cursor-pointer shadow-xs"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
