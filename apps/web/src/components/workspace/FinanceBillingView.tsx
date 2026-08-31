import React, { useState } from "react";
import {
  CreditCard,
  Plus,
  Search,
  CheckCircle2,
  DollarSign,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  FileText,
  Clock,
  Landmark,
  ExternalLink,
  Filter,
  Check,
  ShieldCheck,
} from "lucide-react";
import {
  InvoiceRecord,
  ExpenseRecord,
  CollectionRecord,
  FirmProfile,
  ClientRecord,
  EngagementRecord,
  UserSession,
} from "../../types";
import { InvoicePreviewModal } from "./finance/InvoicePreviewModal";
import { NewInvoiceModal } from "./finance/NewInvoiceModal";
import { RecordPaymentModal } from "./finance/RecordPaymentModal";

interface FinanceBillingViewProps {
  invoices: InvoiceRecord[];
  expenses: ExpenseRecord[];
  collections: CollectionRecord[];
  firmProfile: FirmProfile;
  clients: ClientRecord[];
  engagements: EngagementRecord[];
  currentUser: UserSession;
  onAddInvoice: (inv: Partial<InvoiceRecord>) => void;
  onAddExpense: (exp: Partial<ExpenseRecord>) => void;
  onRecordPayment: (pay: Partial<CollectionRecord>) => void;
  onUpdateInvoiceStatus: (
    invId: string,
    status: InvoiceRecord["status"],
  ) => void;
}

export const FinanceBillingView: React.FC<FinanceBillingViewProps> = ({
  invoices,
  expenses,
  collections,
  firmProfile,
  clients,
  engagements,
  currentUser,
  onAddInvoice,
  onAddExpense,
  onRecordPayment,
  onUpdateInvoiceStatus,
}) => {
  const [subTab, setSubTab] = useState<"invoices" | "collections" | "expenses">(
    "invoices",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

  // Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [previewingInvoice, setPreviewingInvoice] =
    useState<InvoiceRecord | null>(null);

  // New Expense State
  const [newExpense, setNewExpense] = useState({
    category: "Audit Travel & Conveyance" as ExpenseRecord["category"],
    amount: 3500,
    claimant: currentUser.name,
    engagementRef: "Apex Footwear (Factory Inspection)",
  });

  // Financial Metrics
  const totalBilled = invoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalCollected = collections.reduce(
    (acc, curr) => acc + curr.amount,
    0,
  );
  const totalPending = invoices
    .filter((i) => i.status !== "Paid")
    .reduce((acc, curr) => acc + curr.totalAmount, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Dynamic Aging Bucket Calculations based on unpaid invoices
  const now = new Date("2026-08-31"); // Current app context time
  const agingBuckets = {
    current: 0, // 0-30 days
    days31to60: 0, // 31-60 days
    days61to90: 0, // 61-90 days
    over90: 0, // 90+ days
  };

  invoices
    .filter((i) => i.status !== "Paid")
    .forEach((inv) => {
      const issueD = new Date(inv.issueDate);
      const diffDays = Math.floor(
        (now.getTime() - issueD.getTime()) / (1000 * 3600 * 24),
      );
      if (diffDays <= 30) {
        agingBuckets.current += inv.totalAmount;
      } else if (diffDays <= 60) {
        agingBuckets.days31to60 += inv.totalAmount;
      } else if (diffDays <= 90) {
        agingBuckets.days61to90 += inv.totalAmount;
      } else {
        agingBuckets.over90 += inv.totalAmount;
      }
    });

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (inv.engagementRef &&
        inv.engagementRef.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "All" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredCollections = collections.filter((col) => {
    return (
      col.receiptNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      col.bankRef.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const filteredExpenses = expenses.filter((exp) => {
    return (
      exp.claimant.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.engagementRef &&
        exp.engagementRef.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount) return;
    onAddExpense({
      ...newExpense,
      date: new Date().toISOString().split("T")[0],
      status: "Approved",
    });
    setIsExpenseModalOpen(false);
  };

  const handleDownloadPdfMockup = (inv: InvoiceRecord) => {
    // Generate text receipt blob / simulated download
    const content = `AVENQUIS & CO. CHARTERED ACCOUNTANTS
TAX INVOICE: ${inv.invoiceNo}
Client: ${inv.clientName}
Service: ${inv.service}
Subtotal: BDT ${inv.amount}
VAT: BDT ${inv.vatAmount}
Total Payable: BDT ${inv.totalAmount}
Issue Date: ${inv.issueDate}
Due Date: ${inv.dueDate}
Status: ${inv.status}
Signed: Fouzia Haque, FCA (Authorized Partner)`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inv.invoiceNo}-${inv.clientName.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs">
        <div>
          <div className="inline-flex items-center space-x-2 bg-[#FAF0DE] px-3 py-1 rounded-full text-[10px] font-bold tracking-widest text-[#8A5A18] mb-2">
            <span>OPERATING LEDGER &amp; BILLING ENGINE</span>
            <span className="text-[#C58A3E] font-serif">✦</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1F1E] tracking-tight">
            Office Finance &amp; Collections Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#66706B] mt-1">
            Revenue invoicing, 15% VAT breakdown, operating bank collections,
            aging analysis, and audit travel reimbursements.
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center space-x-1.5 bg-[#FAF7F2] p-1.5 rounded-2xl border border-[#E8E1D5] shrink-0 overflow-x-auto">
          <button
            onClick={() => setSubTab("invoices")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              subTab === "invoices"
                ? "bg-[#113227] text-white shadow-xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Revenue &amp; Invoicing ({invoices.length})</span>
          </button>
          <button
            onClick={() => setSubTab("collections")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              subTab === "collections"
                ? "bg-[#113227] text-white shadow-xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <Landmark className="w-4 h-4" />
            <span>Collections Ledger ({collections.length})</span>
          </button>
          <button
            onClick={() => setSubTab("expenses")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 whitespace-nowrap ${
              subTab === "expenses"
                ? "bg-[#113227] text-white shadow-xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Office Expenses ({expenses.length})</span>
          </button>
        </div>
      </div>

      {/* Financial KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#7C8782]">
              Total Invoiced (YTD)
            </p>
            <CreditCard className="w-4 h-4 text-[#8A5A18]" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#1C1F1E] mt-1.5">
            BDT {(totalBilled / 100000).toFixed(2)} Lac
          </h3>
          <span className="text-[11px] text-[#1F5946] font-medium mt-1 block">
            {invoices.length} statutory fee invoices issued
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#7C8782]">
              Bank Collections Received
            </p>
            <Landmark className="w-4 h-4 text-[#1F5946]" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#1F5946] mt-1.5">
            BDT {(totalCollected / 100000).toFixed(2)} Lac
          </h3>
          <span className="text-[11px] text-[#7A8782] font-medium mt-1 block">
            {Math.round((totalCollected / (totalBilled || 1)) * 100)}%
            realization rate
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#7C8782]">
              Outstanding Receivables
            </p>
            <AlertTriangle className="w-4 h-4 text-[#8E362C]" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#8E362C] mt-1.5">
            BDT {(totalPending / 100000).toFixed(2)} Lac
          </h3>
          <span className="text-[11px] text-[#8E362C] font-medium mt-1 block">
            {invoices.filter((i) => i.status === "Overdue").length} overdue
            account
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#7C8782]">
              Audit Field Expenses
            </p>
            <Receipt className="w-4 h-4 text-[#113227]" />
          </div>
          <h3 className="text-2xl font-serif font-bold text-[#113227] mt-1.5">
            BDT {totalExpenses.toLocaleString()}
          </h3>
          <span className="text-[11px] text-[#7A8782] font-medium mt-1 block">
            Reimbursed travel &amp; software tools
          </span>
        </div>
      </div>

      {/* Outstanding Aging Summary Strip (Always Visible for Practice Health) */}
      <div className="p-5 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-[#8A5A18]" />
            <h3 className="text-xs font-bold text-[#1C1F1E] uppercase tracking-wider">
              Accounts Receivable Aging Analysis (Real-time)
            </h3>
          </div>
          <span className="text-[11px] text-stone-500 font-mono">
            Total Outstanding:{" "}
            <span className="font-bold text-[#8E362C]">
              BDT {totalPending.toLocaleString()}
            </span>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D9]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#1F5946]">
                Current (0-30 Days)
              </span>
              <span className="w-2 h-2 rounded-full bg-[#1F5946]" />
            </div>
            <div className="text-base font-serif font-bold text-[#1C1F1E] mt-1 font-mono">
              BDT {agingBuckets.current.toLocaleString()}
            </div>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              Healthy credit period
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D9]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#8A5A18]">31-60 Days</span>
              <span className="w-2 h-2 rounded-full bg-[#C58A3E]" />
            </div>
            <div className="text-base font-serif font-bold text-[#8A5A18] mt-1 font-mono">
              BDT {agingBuckets.days31to60.toLocaleString()}
            </div>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              Standard follow-up
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D9]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#8E362C]">61-90 Days</span>
              <span className="w-2 h-2 rounded-full bg-[#8E362C]" />
            </div>
            <div className="text-base font-serif font-bold text-[#8E362C] mt-1 font-mono">
              BDT {agingBuckets.days61to90.toLocaleString()}
            </div>
            <span className="text-[10px] text-stone-500 block mt-0.5">
              Partner reminder due
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-[#FDE6E2]/50 border border-[#F5C7C1]">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-bold text-[#8E362C]">90+ Days Overdue</span>
              <span className="w-2 h-2 rounded-full bg-[#8E362C] animate-pulse" />
            </div>
            <div className="text-base font-serif font-bold text-[#8E362C] mt-1 font-mono">
              BDT {agingBuckets.over90.toLocaleString()}
            </div>
            <span className="text-[10px] text-[#8E362C] font-semibold block mt-0.5">
              Escalation required
            </span>
          </div>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-[#EBE6DD] shadow-xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search invoices, clients, bank ref, or vouchers..."
              className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:border-[#113227]"
            />
          </div>

          {subTab === "invoices" && (
            <div className="flex items-center space-x-1.5">
              <Filter className="w-3.5 h-3.5 text-stone-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2.5 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs font-semibold text-[#1C1F1E] focus:outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Pending">Pending Collection</option>
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
          {subTab === "invoices" && (
            <button
              onClick={() => setIsInvoiceModalOpen(true)}
              className="btn-forest px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C58A3E]" />
              <span>+ Generate Invoice</span>
            </button>
          )}

          {subTab === "collections" && (
            <button
              onClick={() => setIsRecordPaymentOpen(true)}
              className="btn-forest px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C58A3E]" />
              <span>+ Record Client Payment</span>
            </button>
          )}

          {subTab === "expenses" && (
            <button
              onClick={() => setIsExpenseModalOpen(true)}
              className="btn-forest px-4 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-[#C58A3E]" />
              <span>Claim Audit Expense</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Tab View */}
      {subTab === "invoices" && (
        <div className="bg-white rounded-3xl border border-[#EBE6DD] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#EBE6DD] text-[#7A8782] font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Invoice # &amp; Client</th>
                  <th className="px-4 py-3.5">Engagement Ref &amp; Basis</th>
                  <th className="px-4 py-3.5">Amount &amp; VAT</th>
                  <th className="px-4 py-3.5">Total Billed</th>
                  <th className="px-4 py-3.5">Issue / Due Date</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1] text-[#1C1F1E]">
                {filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    className="hover:bg-[#FAF8F5] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold text-[#113227] bg-[#E1F3EE] px-2 py-0.5 rounded-lg border border-[#BDE5D9]">
                        {inv.invoiceNo}
                      </span>
                      <div className="font-bold text-sm text-[#1C1F1E] mt-1.5">
                        {inv.clientName}
                      </div>
                      <div className="text-[11px] text-[#66706B] font-medium line-clamp-1">
                        {inv.service}
                      </div>
                    </td>

                    <td className="px-4 py-4 max-w-xs">
                      <div className="text-xs font-semibold text-stone-800">
                        {inv.engagementRef || "Statutory Practice Retainer"}
                      </div>
                      <span className="text-[10px] font-medium text-[#8A5A18] bg-[#FAF0DE] px-1.5 py-0.2 rounded mt-1 inline-block">
                        {inv.billingBasis || "Fixed Milestone"}
                      </span>
                    </td>

                    <td className="px-4 py-4 font-mono text-[11px] text-stone-700">
                      <div>Fee: BDT {inv.amount.toLocaleString()}</div>
                      <div className="text-[10px] text-stone-400">
                        VAT ({inv.vatRate !== undefined ? inv.vatRate : 15}%):
                        BDT {inv.vatAmount.toLocaleString()}
                      </div>
                    </td>

                    <td className="px-4 py-4 font-mono font-bold text-sm text-[#113227]">
                      BDT {inv.totalAmount.toLocaleString()}
                    </td>

                    <td className="px-4 py-4 font-mono text-[11px]">
                      <div>
                        Issued:{" "}
                        <span className="text-stone-800">{inv.issueDate}</span>
                      </div>
                      <div className="text-[10px] text-[#8E362C]">
                        Due: {inv.dueDate}
                      </div>
                    </td>

                    <td className="px-4 py-4 text-center">
                      <select
                        value={inv.status}
                        onChange={(e) =>
                          onUpdateInvoiceStatus(inv.id, e.target.value as any)
                        }
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                          inv.status === "Paid"
                            ? "bg-[#E1F3EE] text-[#1F5946] border-[#BDE5D9]"
                            : inv.status === "Pending"
                              ? "bg-[#FAF0DE] text-[#8A5A18] border-[#EADBBF]"
                              : inv.status === "Sent"
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : inv.status === "Draft"
                                  ? "bg-stone-100 text-stone-700 border-stone-200"
                                  : "bg-[#FDE6E2] text-[#8E362C] border-[#F5C7C1]"
                        }`}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Sent">Sent</option>
                        <option value="Pending">Pending Collection</option>
                        <option value="Paid">Paid (Reconciled)</option>
                        <option value="Overdue">Overdue</option>
                      </select>
                    </td>

                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setPreviewingInvoice(inv)}
                          title="Preview & Print Official Tax Invoice"
                          className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#FAF0DE] border border-[#E5DDD0] text-stone-700 hover:text-[#8A5A18] transition-colors cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDownloadPdfMockup(inv)}
                          title="Download Invoice PDF Mockup"
                          className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#E1F3EE] border border-[#E5DDD0] text-stone-700 hover:text-[#113227] transition-colors cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Operating Collections Ledger */}
      {subTab === "collections" && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-[#EBE6DD] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] border-b border-[#EBE6DD] text-[#7A8782] font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Receipt # &amp; Date</th>
                    <th className="px-4 py-3.5">
                      Client &amp; Invoice Reference
                    </th>
                    <th className="px-4 py-3.5">Amount (BDT)</th>
                    <th className="px-4 py-3.5">
                      Payment Method &amp; Bank Ref
                    </th>
                    <th className="px-4 py-3.5">Deposited Firm Account</th>
                    <th className="px-4 py-3.5 text-right">
                      Status &amp; Verification
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0EBE1] text-[#1C1F1E]">
                  {filteredCollections.map((col) => (
                    <tr
                      key={col.id}
                      className="hover:bg-[#FAF8F5] transition-colors"
                    >
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-[#113227] bg-[#E1F3EE] px-2 py-0.5 rounded-lg border border-[#BDE5D9]">
                          {col.receiptNo}
                        </span>
                        <div className="text-[11px] text-stone-500 mt-1 font-mono">
                          {col.paymentDate}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-bold text-stone-900">
                          {col.clientName}
                        </div>
                        <span className="text-[10px] font-mono text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                          Invoice: {col.invoiceNo}
                        </span>
                        {col.remarks && (
                          <p className="text-[10.5px] text-stone-500 mt-1">
                            {col.remarks}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-4 font-mono font-bold text-sm text-[#1F5946]">
                        BDT {col.amount.toLocaleString()}
                      </td>

                      <td className="px-4 py-4 text-xs font-mono">
                        <span className="font-bold text-stone-800 bg-[#FAF7F2] px-2 py-0.5 rounded border border-[#EBE6DD]">
                          {col.paymentMethod}
                        </span>
                        <div className="text-[10px] text-stone-500 mt-1">
                          {col.bankRef}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-stone-700 text-xs max-w-xs">
                        <div className="line-clamp-1 font-medium">
                          {col.depositedAccount}
                        </div>
                        <div className="text-[10px] text-stone-400">
                          Verified by: {col.receivedBy}
                        </div>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E1F3EE] text-[#1F5946] border border-[#BDE5D9]">
                          <CheckCircle2 className="w-3 h-3 text-[#1F5946]" />
                          <span>{col.status}</span>
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

      {/* Expenses Table */}
      {subTab === "expenses" && (
        <div className="bg-white rounded-3xl border border-[#EBE6DD] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F2] border-b border-[#EBE6DD] text-[#7A8782] font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date &amp; Category</th>
                  <th className="px-4 py-3.5">Claimant Personnel</th>
                  <th className="px-4 py-3.5">Engagement Reference</th>
                  <th className="px-4 py-3.5">Amount (BDT)</th>
                  <th className="px-4 py-3.5 text-right">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1] text-[#1C1F1E]">
                {filteredExpenses.map((exp) => (
                  <tr
                    key={exp.id}
                    className="hover:bg-[#FAF8F5] transition-colors"
                  >
                    <td className="px-5 py-4">
                      <div className="font-bold text-stone-800">
                        {exp.category}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">
                        {exp.date}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-stone-700">
                      {exp.claimant}
                    </td>
                    <td className="px-4 py-4 text-stone-600">
                      {exp.engagementRef || "General Office Admin"}
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-sm text-[#113227]">
                      BDT {exp.amount.toLocaleString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-[#E1F3EE] text-[#1F5946] border border-[#BDE5D9]">
                        {exp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <NewInvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        onGenerateInvoice={onAddInvoice}
        clients={clients}
        engagements={engagements}
      />

      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        invoices={invoices}
        onRecordPayment={onRecordPayment}
        currentUser={currentUser}
      />

      <InvoicePreviewModal
        invoice={previewingInvoice}
        firmProfile={firmProfile}
        onClose={() => setPreviewingInvoice(null)}
        onDownloadPdfMockup={handleDownloadPdfMockup}
      />

      {/* Claim Expense Modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 text-left animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl border border-[#EBE6DD] shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-[#1C1F1E]">
              Claim Audit Field Expense
            </h3>
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Expense Category
                </label>
                <select
                  value={newExpense.category}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      category: e.target.value as any,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs"
                >
                  <option value="Audit Travel & Conveyance">
                    Audit Travel &amp; Conveyance
                  </option>
                  <option value="Client Meeting">
                    Client Meeting &amp; Refreshments
                  </option>
                  <option value="Stationery & Printing">
                    Stationery, Printing &amp; Binding
                  </option>
                  <option value="Software Subscriptions">
                    Software Subscriptions
                  </option>
                  <option value="Meal Allowance">
                    Field Audit Meal Allowance
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Amount (BDT)
                </label>
                <input
                  type="number"
                  value={newExpense.amount}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      amount: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs font-mono font-bold text-[#113227]"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Engagement Reference
                </label>
                <input
                  type="text"
                  value={newExpense.engagementRef}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      engagementRef: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 bg-[#FAF7F2] text-stone-700 text-xs font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#113227] text-white text-xs font-bold rounded-xl"
                >
                  Submit Claim
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
