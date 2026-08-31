import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Clock,
  DollarSign,
  Building,
  CreditCard,
  Percent,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import {
  InvoiceRecord,
  InvoiceLineItem,
  ClientRecord,
  EngagementRecord,
} from "../../../types";

interface NewInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateInvoice: (invoice: Partial<InvoiceRecord>) => void;
  clients: ClientRecord[];
  engagements: EngagementRecord[];
}

export const NewInvoiceModal: React.FC<NewInvoiceModalProps> = ({
  isOpen,
  onClose,
  onGenerateInvoice,
  clients,
  engagements,
}) => {
  const [selectedClient, setSelectedClient] = useState(
    clients[0]?.name || "Apex Footwear & Polymer Ltd.",
  );
  const [selectedEngagement, setSelectedEngagement] = useState(
    engagements.find((e) => e.clientName === selectedClient)?.engagementCode ||
      "AUD-2026-081",
  );
  const [serviceTitle, setServiceTitle] = useState(
    "Statutory Audit FY25 - Milestone & Fieldwork",
  );
  const [billingBasis, setBillingBasis] =
    useState<InvoiceRecord["billingBasis"]>("Fixed Milestone");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [vatRate, setVatRate] = useState<number>(15);
  const [notes, setNotes] = useState(
    "Payment due within 30 days of invoice receipt via direct bank remittance.",
  );

  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    {
      id: "li-init-1",
      description:
        "Statutory Audit FY25 - Interim Substantive Testing & Inventory Verification",
      hours: 40,
      rate: 5000,
      amount: 200000,
    },
  ]);

  if (!isOpen) return null;

  // Handle Client Change
  const handleClientChange = (clientName: string) => {
    setSelectedClient(clientName);
    const relatedEng = engagements.find((e) => e.clientName === clientName);
    if (relatedEng) {
      setSelectedEngagement(relatedEng.engagementCode);
      setServiceTitle(
        `${relatedEng.serviceType} (${relatedEng.engagementCode})`,
      );
    } else {
      setSelectedEngagement("");
      setServiceTitle(`Professional Services - ${clientName}`);
    }
  };

  // Auto-fill from unbilled timesheet hours
  const handleAutofillTimesheets = () => {
    const activeEng =
      engagements.find((e) => e.engagementCode === selectedEngagement) ||
      engagements[0];
    const clientTimesheetRate = selectedClient.includes("Synapse")
      ? 10000
      : 5000;
    const estimatedUnbilledHours = Math.max(
      16,
      (activeEng?.loggedHours || 42) - 10,
    );

    const generatedItems: InvoiceLineItem[] = [
      {
        id: `li-ts-${Date.now()}-1`,
        description: `Partner & Manager Quality Review: ${activeEng?.serviceType || "Statutory Audit"} (${activeEng?.engagementCode || "AUD-2026"})`,
        hours: Math.round(estimatedUnbilledHours * 0.35),
        rate: clientTimesheetRate * 1.5,
        amount:
          Math.round(estimatedUnbilledHours * 0.35) *
          (clientTimesheetRate * 1.5),
      },
      {
        id: `li-ts-${Date.now()}-2`,
        description: `Substantive Fieldwork & Working Paper Procedures (ISA 500 / 520)`,
        hours: Math.round(estimatedUnbilledHours * 0.65),
        rate: clientTimesheetRate,
        amount: Math.round(estimatedUnbilledHours * 0.65) * clientTimesheetRate,
      },
    ];

    setBillingBasis("Time & Materials (Timesheet)");
    setLineItems(generatedItems);
  };

  // Line item manipulation
  const handleAddLineItem = () => {
    setLineItems((prev) => [
      ...prev,
      {
        id: `li-custom-${Date.now()}`,
        description: "Additional professional audit/tax consultation",
        hours: 10,
        rate: 4500,
        amount: 45000,
      },
    ]);
  };

  const handleUpdateLineItem = (
    id: string,
    updates: Partial<InvoiceLineItem>,
  ) => {
    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...updates };
        if (updates.hours !== undefined || updates.rate !== undefined) {
          const h =
            updates.hours !== undefined ? updates.hours : next.hours || 0;
          const r = updates.rate !== undefined ? updates.rate : next.rate || 0;
          if (h && r) next.amount = h * r;
        }
        return next;
      }),
    );
  };

  const handleRemoveLineItem = (id: string) => {
    if (lineItems.length === 1) return;
    setLineItems((prev) => prev.filter((i) => i.id !== id));
  };

  // Calculations
  const subtotalAmount = lineItems.reduce(
    (acc, curr) => acc + (Number(curr.amount) || 0),
    0,
  );
  const vatAmount = Math.round((subtotalAmount * (vatRate || 0)) / 100);
  const grandTotal = subtotalAmount + vatAmount;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient || subtotalAmount <= 0) return;

    onGenerateInvoice({
      clientName: selectedClient,
      engagementRef: selectedEngagement
        ? `${selectedEngagement} (${selectedClient})`
        : undefined,
      service: serviceTitle,
      billingBasis,
      lineItems,
      amount: subtotalAmount,
      vatRate,
      vatAmount,
      totalAmount: grandTotal,
      issueDate,
      dueDate,
      status: "Sent",
      notes,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 text-left animate-fadeIn">
      <div className="bg-white w-full max-w-2xl rounded-3xl border border-[#EBE6DD] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-[#FAF7F2] border-b border-[#EBE6DD] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#113227] text-[#C58A3E] flex items-center justify-center shadow-xs">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1C1F1E]">
                Generate Client Invoice
              </h3>
              <p className="text-xs text-[#7A8782]">
                Create statutory fee invoice with optional timesheet hours
                auto-population.
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Client & Engagement Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                Client Entity *
              </label>
              <select
                value={selectedClient}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] font-medium focus:outline-none focus:border-[#113227]"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.clientCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                Linked Engagement Ref
              </label>
              <select
                value={selectedEngagement}
                onChange={(e) => setSelectedEngagement(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] font-medium focus:outline-none focus:border-[#113227]"
              >
                <option value="">-- General Practice Retainer --</option>
                {engagements.map((eng) => (
                  <option key={eng.id} value={eng.engagementCode}>
                    {eng.engagementCode} - {eng.serviceType} ({eng.clientName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Service Title & Billing Basis */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                Invoice Subject / Service Title *
              </label>
              <input
                type="text"
                value={serviceTitle}
                onChange={(e) => setServiceTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:border-[#113227]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                Billing Model
              </label>
              <select
                value={billingBasis}
                onChange={(e) => setBillingBasis(e.target.value as any)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none"
              >
                <option value="Fixed Milestone">Fixed Milestone</option>
                <option value="Time & Materials (Timesheet)">
                  Time &amp; Materials
                </option>
                <option value="Monthly Retainer">Monthly Retainer</option>
                <option value="Special Assignment">Special Assignment</option>
              </select>
            </div>
          </div>

          {/* Timesheet Auto-Fill Banner */}
          <div className="p-3.5 rounded-2xl bg-[#E1F3EE]/60 border border-[#BDE5D9] flex items-center justify-between gap-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-[#113227] text-[#C58A3E] flex items-center justify-center shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-[#113227] block">
                  Auto-populate from Unbilled Timesheets
                </span>
                <span className="text-[11px] text-[#66706B]">
                  Extract unbilled staff hours logged on{" "}
                  {selectedClient.split(" ")[0]}.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleAutofillTimesheets}
              className="px-3 py-1.5 rounded-xl bg-[#113227] hover:bg-[#1A4536] text-white text-xs font-semibold shrink-0 flex items-center space-x-1 shadow-xs transition-colors cursor-pointer"
            >
              <Clock className="w-3 h-3 text-[#C58A3E]" />
              <span>Auto-Fill Hours</span>
            </button>
          </div>

          {/* Line Items Editor */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#1C1F1E] uppercase tracking-wider text-[10px]">
                Invoice Line Items ({lineItems.length})
              </label>
              <button
                type="button"
                onClick={handleAddLineItem}
                className="text-xs text-[#113227] hover:underline font-semibold flex items-center space-x-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 border border-[#EBE6DD] rounded-2xl p-3 bg-[#FAF8F5]">
              {lineItems.map((item, idx) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-[#EAE3D5]"
                >
                  <div className="col-span-6">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, {
                          description: e.target.value,
                        })
                      }
                      placeholder="Description of service rendered..."
                      className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E5DDD0] rounded-lg text-xs text-[#1C1F1E] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="number"
                      placeholder="Hours"
                      value={item.hours || ""}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, {
                          hours: Number(e.target.value),
                        })
                      }
                      className="w-full px-2 py-1.5 bg-[#FAF8F5] border border-[#E5DDD0] rounded-lg text-xs text-[#1C1F1E] text-center font-mono focus:outline-none"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      placeholder="Rate / Total"
                      value={item.amount || ""}
                      onChange={(e) =>
                        handleUpdateLineItem(item.id, {
                          amount: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-[#FAF8F5] border border-[#E5DDD0] rounded-lg text-xs text-[#113227] font-bold font-mono focus:outline-none"
                    />
                  </div>
                  <div className="col-span-1 text-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveLineItem(item.id)}
                      disabled={lineItems.length === 1}
                      className="p-1 rounded text-stone-400 hover:text-[#8E362C] disabled:opacity-30 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing & VAT Calculation Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-[#FAF7F2] border border-[#EBE6DD]">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                Subtotal Fee (BDT)
              </label>
              <div className="font-mono text-sm font-bold text-[#1C1F1E] py-1.5">
                BDT {subtotalAmount.toLocaleString()}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                Statutory VAT Rate
              </label>
              <select
                value={vatRate}
                onChange={(e) => setVatRate(Number(e.target.value))}
                className="w-full px-2.5 py-1.5 bg-white border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] font-semibold"
              >
                <option value={15}>15% (Standard Domestic VAT)</option>
                <option value={0}>0% (Export / IT Exemption)</option>
                <option value={5}>5% (Special Concession)</option>
                <option value={7.5}>7.5% (Reduced Tier)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                Total Payable (BDT)
              </label>
              <div className="font-mono text-base font-bold text-[#113227] py-1">
                BDT {grandTotal.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Dates & Payment Terms */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                Issue Date
              </label>
              <input
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-500 mb-1">
              Payment Terms &amp; Remittance Note
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none"
            />
          </div>

          {/* Modal Actions */}
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
              <CreditCard className="w-3.5 h-3.5 text-[#C58A3E]" />
              <span>Generate &amp; Dispatch Invoice</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
