import React, { useRef } from "react";
import {
  X,
  Printer,
  Download,
  Building,
  CheckCircle2,
  FileText,
  ShieldCheck,
  CreditCard,
  Landmark,
} from "lucide-react";
import { InvoiceRecord, FirmProfile } from "../../../types";

interface InvoicePreviewModalProps {
  invoice: InvoiceRecord | null;
  firmProfile: FirmProfile;
  onClose: () => void;
  onDownloadPdfMockup: (invoice: InvoiceRecord) => void;
}

export const InvoicePreviewModal: React.FC<InvoicePreviewModalProps> = ({
  invoice,
  firmProfile,
  onClose,
  onDownloadPdfMockup,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 text-left animate-fadeIn">
      <div className="bg-[#FAF7F2] w-full max-w-3xl rounded-3xl border border-[#EBE6DD] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Action Header */}
        <div className="p-4 sm:p-5 bg-white border-b border-[#EBE6DD] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-[#113227] text-[#C58A3E] flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-bold text-[#1C1F1E]">
                  Tax Invoice Preview
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    invoice.status === "Paid"
                      ? "bg-[#E1F3EE] text-[#1F5946]"
                      : invoice.status === "Overdue"
                        ? "bg-[#FDE6E2] text-[#8E362C]"
                        : invoice.status === "Draft"
                          ? "bg-stone-100 text-stone-600"
                          : "bg-[#FAF0DE] text-[#8A5A18]"
                  }`}
                >
                  {invoice.status}
                </span>
              </div>
              <p className="text-xs text-[#7A8782] font-mono">
                {invoice.invoiceNo}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => onDownloadPdfMockup(invoice)}
              className="px-3 py-1.5 rounded-xl bg-[#113227] text-white hover:bg-[#1A4536] text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#C58A3E]" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={handlePrint}
              className="hidden sm:flex px-3 py-1.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#E5DDD0] text-stone-700 text-xs font-semibold items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-stone-500" />
              <span>Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Invoice Paper Document Body */}
        <div
          className="p-6 sm:p-10 overflow-y-auto space-y-8 bg-white m-3 sm:m-6 rounded-2xl border border-[#E8E1D5] shadow-xs print:m-0 print:border-0 print:shadow-none"
          ref={printRef}
        >
          {/* Header & Firm Letterhead */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b-2 border-[#113227]">
            <div>
              <div className="inline-flex items-center space-x-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#8A5A18] mb-1">
                <span>CHARTERED ACCOUNTANTS</span>
                <span className="text-[#C58A3E]">✦</span>
                <span>AUDIT &amp; TAX PRACTICE</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#113227] tracking-tight">
                {firmProfile.firmName}
              </h2>
              <p className="text-xs text-stone-600 mt-1 max-w-sm">
                {firmProfile.principalAddress}
              </p>
              <div className="text-[11px] text-stone-500 mt-2 space-y-0.5 font-mono">
                <div>
                  Registration:{" "}
                  <span className="font-semibold text-stone-700">
                    {firmProfile.firmRegistrationNo}
                  </span>
                </div>
                <div>
                  {firmProfile.taxIdentificationNo} • {firmProfile.binNumber}
                </div>
                <div>
                  Email: {firmProfile.contactEmail} • Tel:{" "}
                  {firmProfile.contactPhone}
                </div>
              </div>
            </div>

            <div className="sm:text-right bg-[#FAF7F2] sm:bg-transparent p-4 sm:p-0 rounded-2xl">
              <div className="text-xs font-extrabold uppercase tracking-wider text-[#8A5A18]">
                STATUTORY TAX INVOICE
              </div>
              <div className="text-2xl font-serif font-bold text-[#1C1F1E] mt-1 font-mono">
                {invoice.invoiceNo}
              </div>
              <div className="mt-3 text-xs space-y-1 text-stone-600 font-mono">
                <div>
                  <span className="text-stone-400">Issue Date:</span>{" "}
                  <span className="font-bold text-stone-800">
                    {invoice.issueDate}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400">Payment Due:</span>{" "}
                  <span className="font-bold text-[#8E362C]">
                    {invoice.dueDate}
                  </span>
                </div>
                <div>
                  <span className="text-stone-400">Basis:</span>{" "}
                  <span className="font-semibold text-stone-700">
                    {invoice.billingBasis || "Fixed Milestone"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Billed To Client Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE6DD]">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A9691] block mb-1">
                BILLED TO (CLIENT ENTITY)
              </span>
              <h4 className="text-base font-bold text-[#1C1F1E]">
                {invoice.clientName}
              </h4>
              {invoice.engagementRef && (
                <p className="text-xs text-[#1F5946] font-medium mt-1">
                  Ref: {invoice.engagementRef}
                </p>
              )}
              <p className="text-xs text-stone-500 mt-1">
                Attn: Accounts Payable / Chief Financial Officer
              </p>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8A9691] block mb-1">
                SCOPE / ENGAGEMENT SUMMARY
              </span>
              <p className="text-xs font-semibold text-stone-800">
                {invoice.service}
              </p>
              <p className="text-[11px] text-stone-500 mt-1">
                Structured in alignment with ICAB professional guidelines,
                Bangladesh VAT Act 2012 &amp; Income Tax Act 2023.
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="border border-[#EBE6DD] rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#EBE6DD] text-[#7A8782] font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">
                    Description of Professional Services
                  </th>
                  <th className="px-4 py-3 text-right">Hours / Rate</th>
                  <th className="px-4 py-3 text-right">Amount (BDT)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1] text-[#1C1F1E]">
                {invoice.lineItems && invoice.lineItems.length > 0 ? (
                  invoice.lineItems.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="px-4 py-3.5 text-stone-400 font-mono">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-stone-800">
                        {item.description}
                      </td>
                      <td className="px-4 py-3.5 text-right text-stone-600 font-mono">
                        {item.hours
                          ? `${item.hours} hrs @ ৳${(item.rate || 0).toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono font-bold text-stone-900">
                        BDT {item.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-3.5 text-stone-400 font-mono">1</td>
                    <td className="px-4 py-3.5 font-medium text-stone-800">
                      {invoice.service}
                    </td>
                    <td className="px-4 py-3.5 text-right text-stone-600 font-mono">
                      —
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono font-bold text-stone-900">
                      BDT {invoice.amount.toLocaleString()}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Calculations Breakdown */}
            <div className="p-4 bg-[#FAF8F5] border-t border-[#EBE6DD] flex flex-col items-end space-y-1.5 text-xs font-mono">
              <div className="flex justify-between w-64 text-stone-600">
                <span>Subtotal (Professional Fee):</span>
                <span className="font-semibold">
                  BDT {invoice.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between w-64 text-stone-600">
                <span>
                  VAT ({invoice.vatRate !== undefined ? invoice.vatRate : 15}%
                  Standard):
                </span>
                <span className="font-semibold">
                  BDT {invoice.vatAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between w-64 pt-2 border-t border-[#E5DDD0] text-sm font-bold text-[#113227]">
                <span>Total Payable:</span>
                <span>BDT {invoice.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions & Bank Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-[#F0EBE1] text-xs">
            <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#EBE6DD] space-y-1.5">
              <div className="flex items-center space-x-2 text-[#113227] font-bold">
                <Landmark className="w-4 h-4 text-[#C58A3E]" />
                <span>Bank Remittance Instructions</span>
              </div>
              <p className="text-[11px] text-stone-600">
                Please remit payments via BEFTN, RTGS, or Account Payee Cheque
                in favor of:
              </p>
              <div className="text-[11px] font-mono text-stone-800 font-medium space-y-0.5">
                <div>
                  Beneficiary:{" "}
                  <span className="font-bold">{firmProfile.firmName}</span>
                </div>
                <div>
                  Bank:{" "}
                  <span className="font-bold">
                    Eastern Bank Ltd (Gulshan Branch)
                  </span>
                </div>
                <div>
                  Account No:{" "}
                  <span className="font-bold text-[#113227]">
                    1041029482019
                  </span>
                </div>
                <div>
                  Routing No: <span className="font-bold">090271829</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-end items-end text-right space-y-3">
              <div className="w-48 text-center space-y-1">
                <div className="h-12 flex items-center justify-center border-b border-dashed border-stone-400">
                  <span className="font-serif italic text-sm text-[#113227] font-bold">
                    {firmProfile.managingPartner}
                  </span>
                </div>
                <p className="text-[11px] font-bold text-stone-800">
                  Authorized Partner Signatory
                </p>
                <p className="text-[10px] text-stone-500 font-mono">
                  For {firmProfile.firmName}
                </p>
              </div>
            </div>
          </div>

          {/* Notes & Regulatory Disclaimers */}
          {invoice.notes && (
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-[11px] text-stone-600">
              <span className="font-bold text-stone-700">
                Notes / Remarks:{" "}
              </span>
              {invoice.notes}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-white border-t border-[#EBE6DD] flex items-center justify-between">
          <span className="text-xs text-stone-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1F5946]" />
            ICAB Practice Quality Workflow Aligned
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#E5DDD0] text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
