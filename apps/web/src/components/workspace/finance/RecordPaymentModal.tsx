import React, { useState } from "react";
import {
  X,
  CreditCard,
  Landmark,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileCheck,
  Receipt,
} from "lucide-react";
import { InvoiceRecord, CollectionRecord, UserSession } from "../../../types";

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: InvoiceRecord[];
  onRecordPayment: (payment: Partial<CollectionRecord>) => void;
  currentUser: UserSession;
}

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  isOpen,
  onClose,
  invoices,
  onRecordPayment,
  currentUser,
}) => {
  const pendingInvoices = invoices.filter((i) => i.status !== "Paid");
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(
    pendingInvoices[0]?.id || invoices[0]?.id || "",
  );

  const selectedInvoice =
    invoices.find((i) => i.id === selectedInvoiceId) || invoices[0];

  const [receiptNo, setReceiptNo] = useState(
    `MR-2026-0${Math.floor(80 + Math.random() * 20)}`,
  );
  const [paymentDate, setPaymentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [amount, setAmount] = useState<number>(
    selectedInvoice?.totalAmount || 300000,
  );
  const [paymentMethod, setPaymentMethod] =
    useState<CollectionRecord["paymentMethod"]>("Bank BEFTN");
  const [bankRef, setBankRef] = useState("EBL-BEFTN-994102");
  const [depositedAccount, setDepositedAccount] = useState(
    "Eastern Bank Ltd - Principal Practice Account #104102948",
  );
  const [remarks, setRemarks] = useState(
    "Full settlement received towards professional fee invoice.",
  );

  if (!isOpen) return null;

  const handleInvoiceChange = (invId: string) => {
    setSelectedInvoiceId(invId);
    const target = invoices.find((i) => i.id === invId);
    if (target) {
      setAmount(target.totalAmount);
      setRemarks(`Settlement for ${target.invoiceNo} (${target.service})`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount <= 0 || !selectedInvoice) return;

    onRecordPayment({
      receiptNo,
      invoiceId: selectedInvoice.id,
      invoiceNo: selectedInvoice.invoiceNo,
      clientName: selectedInvoice.clientName,
      paymentDate,
      amount: Number(amount),
      paymentMethod,
      bankRef,
      depositedAccount,
      status: "Cleared & Credited",
      receivedBy: currentUser.name,
      remarks,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 text-left animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-[#EBE6DD] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-[#FAF7F2] border-b border-[#EBE6DD] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#113227] text-[#C58A3E] flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C1F1E]">
                Record Client Payment
              </h3>
              <p className="text-xs text-[#7A8782]">
                Log client bank receipt &amp; update invoice collection status.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-[#1C1F1E] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
              Select Invoice to Settle *
            </label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] font-medium focus:outline-none focus:border-[#113227]"
            >
              {invoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoiceNo} - {inv.clientName} (BDT{" "}
                  {inv.totalAmount.toLocaleString()} • {inv.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                Money Receipt #
              </label>
              <input
                type="text"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs font-mono font-bold text-[#113227] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                Amount Received (BDT) *
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                required
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs font-mono font-bold text-[#113227] focus:outline-none focus:border-[#113227]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                Payment Channel
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none"
              >
                <option value="Bank BEFTN">Bank BEFTN</option>
                <option value="RTGS">RTGS Real-time Settlement</option>
                <option value="Cheque Deposit">Account Payee Cheque</option>
                <option value="Direct Transfer">Direct Fund Transfer</option>
                <option value="Pay Order">Banker's Pay Order</option>
                <option value="NPSB Electronic">NPSB Electronic</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                Bank Instrument / Ref ID *
              </label>
              <input
                type="text"
                value={bankRef}
                onChange={(e) => setBankRef(e.target.value)}
                placeholder="e.g. EBL-BEFTN-998412"
                required
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs font-mono text-[#1C1F1E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
              Deposited Firm Account
            </label>
            <select
              value={depositedAccount}
              onChange={(e) => setDepositedAccount(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none"
            >
              <option value="Eastern Bank Ltd - Principal Practice Account #104102948">
                Eastern Bank Ltd - Principal Practice Account #104102948
              </option>
              <option value="City Bank Ltd - Operations Account #210994821">
                City Bank Ltd - Operations Account #210994821
              </option>
              <option value="Standard Chartered Bank - Foreign Remittance A/C #01928491">
                Standard Chartered Bank - Foreign Remittance A/C #01928491
              </option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
              Remarks &amp; Audit Trail Note
            </label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-[#F0EBE1] flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#E5DDD0] text-stone-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-[#113227] hover:bg-[#1A4536] text-white text-xs font-bold flex items-center space-x-1.5 shadow-xs transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#C58A3E]" />
              <span>Record &amp; Issue Receipt</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
