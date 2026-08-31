import React, { useState } from "react";
import {
  X,
  Plus,
  Trash2,
  Send,
  Calendar,
  User,
  Building,
  FileText,
  Clock,
  Bell,
  CheckSquare,
  Shield,
} from "lucide-react";
import { ClientRequestItem, PBCFileRequirement } from "../../types";

interface NewClientRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRequest: (
    request: Omit<ClientRequestItem, "id" | "ticketNo" | "requestedDate">,
  ) => void;
  onToast?: (message: string, type: "success" | "info" | "error") => void;
}

const CLIENT_OPTIONS = [
  {
    name: "Apex Footwear & Polymer Ltd.",
    engagementCode: "AUD-2026-081",
    contactName: "Advocate Shamsul Alam",
    email: "legal.apex@apexfootwear.com.bd",
    designation: "Head of Legal Affairs",
  },
  {
    name: "Orbit Textiles & Apparels Group",
    engagementCode: "VAT-2026-019",
    contactName: "Mohammad Rafiqul Islam",
    email: "rafiqul.islam@orbittextiles-bd.com",
    designation: "Chief Financial Officer",
  },
  {
    name: "Novartis Healthcare Bangladesh",
    engagementCode: "TAX-2026-044",
    contactName: "Tanima Chowdhury, CMA",
    email: "tanima.chowdhury@novartis.com.bd",
    designation: "Head of Taxation & Treasury",
  },
  {
    name: "Synapse Tech Solutions Pte.",
    engagementCode: "ADV-2026-008",
    contactName: "Adnan Samiul",
    email: "adnan.samiul@synapsetech.sg",
    designation: "VP Finance & Operations",
  },
  {
    name: "Green Delta Insurance PLC",
    engagementCode: "AUD-2026-092",
    contactName: "Kazi Farhan Ahmed",
    email: "farhan.kazi@greendelta.com.bd",
    designation: "General Manager - Accounts",
  },
];

const STAFF_OPTIONS = [
  "Zahirul Islam, FCA",
  "Mahmudur Rahman, ACA",
  "Tanvir Hossain",
  "Farhan Kabir (Art)",
  "Sabbir Ahmed (Art)",
  "Anika Tabassum (Art)",
  "Mehvish Sultana (Art)",
];

export const NewClientRequestModal: React.FC<NewClientRequestModalProps> = ({
  isOpen,
  onClose,
  onCreateRequest,
  onToast,
}) => {
  const [selectedClientIndex, setSelectedClientIndex] = useState(0);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("2026-09-15");
  const [priority, setPriority] = useState<"High" | "Medium" | "Low">("High");
  const [assignedStaff, setAssignedStaff] = useState(STAFF_OPTIONS[0]);

  // Target Contact Details (prefilled but editable)
  const [contactName, setContactName] = useState(CLIENT_OPTIONS[0].contactName);
  const [contactDesignation, setContactDesignation] = useState(
    CLIENT_OPTIONS[0].designation,
  );
  const [contactEmail, setContactEmail] = useState(CLIENT_OPTIONS[0].email);
  const [contactPhone, setContactPhone] = useState("+880 1711-000000");

  // Automated Reminders
  const [automatedReminder, setAutomatedReminder] = useState(true);
  const [reminderFrequency, setReminderFrequency] = useState<
    "Daily" | "Every 3 Days" | "Weekly"
  >("Every 3 Days");

  // Dynamic File Requirement Checklist
  const [fileRequirements, setFileRequirements] = useState<
    Omit<PBCFileRequirement, "id">[]
  >([
    {
      title: "Signed External Confirmation / Requisition Schedule",
      format: "Signed PDF Scan",
      mandatory: true,
      received: false,
    },
    {
      title: "Sub-ledger Trial Balance & Reconciliations",
      format: "Excel Spreadsheet (.xlsx)",
      mandatory: true,
      received: false,
    },
  ]);

  const [newFileTitle, setNewFileTitle] = useState("");
  const [newFileFormat, setNewFileFormat] = useState("PDF Document (.pdf)");
  const [newFileMandatory, setNewFileMandatory] = useState(true);

  if (!isOpen) return null;

  const handleClientChange = (index: number) => {
    setSelectedClientIndex(index);
    const client = CLIENT_OPTIONS[index];
    if (client) {
      setContactName(client.contactName);
      setContactDesignation(client.designation);
      setContactEmail(client.email);
    }
  };

  const handleAddFileRequirement = () => {
    if (!newFileTitle.trim()) return;
    setFileRequirements((prev) => [
      ...prev,
      {
        title: newFileTitle.trim(),
        format: newFileFormat,
        mandatory: newFileMandatory,
        received: false,
      },
    ]);
    setNewFileTitle("");
  };

  const handleRemoveFileRequirement = (index: number) => {
    setFileRequirements((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;

    const chosenClient = CLIENT_OPTIONS[selectedClientIndex];

    const formattedFiles: PBCFileRequirement[] = fileRequirements.map(
      (fr, idx) => ({
        ...fr,
        id: `fr-new-${Date.now()}-${idx}`,
      }),
    );

    onCreateRequest({
      clientName: chosenClient.name,
      engagementCode: chosenClient.engagementCode,
      subject: subject.trim(),
      description: description.trim(),
      targetContact: {
        name: contactName,
        designation: contactDesignation,
        email: contactEmail,
        phone: contactPhone,
      },
      dueDate,
      priority,
      status: "Requested",
      assignedStaff,
      fileRequirements: formattedFiles,
      automatedReminder,
      reminderFrequency,
      remindersCount: 0,
    });

    if (onToast) {
      onToast(
        `PBC Request created & dispatch logged for ${chosenClient.name}.`,
        "success",
      );
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
      <div className="bg-white rounded-3xl border border-[#EBE6DD] max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-6 bg-[#FAF7F2] border-b border-[#EBE6DD] flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-bold uppercase tracking-wider text-[#8A5A18]">
              <span>Client Information &amp; Audit Requisition Portal</span>
            </div>
            <h2 className="text-lg font-serif font-bold text-[#1C1F1E] mt-1">
              Create New PBC Request Ticket (Provided by Client)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Issue formal document and audit evidence requisitions directly to
              client management with automated reminder triggers.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAF8F5]"
        >
          {/* Section 1: Client & Engagement Linkage */}
          <div className="bg-white p-5 rounded-2xl border border-[#EBE6DD] shadow-xs space-y-4">
            <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-[#1C1F1E] flex items-center gap-1.5">
              <Building className="w-4 h-4 text-[#113227]" />
              <span>Client &amp; Engagement Assignment</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Target Client Entity
                </label>
                <select
                  value={selectedClientIndex}
                  onChange={(e) => handleClientChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] font-semibold focus:outline-none"
                >
                  {CLIENT_OPTIONS.map((c, idx) => (
                    <option key={c.name} value={idx}>
                      {c.name} ({c.engagementCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Assigned Audit Staff In-Charge
                </label>
                <select
                  value={assignedStaff}
                  onChange={(e) => setAssignedStaff(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none"
                >
                  {STAFF_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Request Subject & Details */}
          <div className="bg-white p-5 rounded-2xl border border-[#EBE6DD] shadow-xs space-y-4">
            <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-[#1C1F1E] flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#113227]" />
              <span>Requisition Details &amp; Deadlines</span>
            </h4>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Requisition Title / Subject
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Certified Fixed Asset sub-ledger register with physical count tags (IAS 16)"
                className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:border-[#113227]"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                Detailed Scope / Client Instructions
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Specify sampling period, required authorizations, department contacts, or specific spreadsheet tabs needed..."
                className="w-full p-2.5 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:border-[#113227]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Submission Due Date
                </label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Audit Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] font-semibold focus:outline-none"
                >
                  <option value="High">High (Fieldwork Blocker)</option>
                  <option value="Medium">Medium (Standard PBC)</option>
                  <option value="Low">Low (Informational)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Target Client Contact */}
          <div className="bg-white p-5 rounded-2xl border border-[#EBE6DD] shadow-xs space-y-4">
            <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-[#1C1F1E] flex items-center gap-1.5">
              <User className="w-4 h-4 text-[#113227]" />
              <span>Target Client Contact Person</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Recipient Full Name
                </label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Designation / Role
                </label>
                <input
                  type="text"
                  value={contactDesignation}
                  onChange={(e) => setContactDesignation(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Direct Email Address
                </label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                  Contact Phone / WhatsApp
                </label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 4: File Requirement Checklist Builder */}
          <div className="bg-white p-5 rounded-2xl border border-[#EBE6DD] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-[#1C1F1E] flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-[#113227]" />
                <span>
                  Deliverable Files Checklist ({fileRequirements.length})
                </span>
              </h4>
              <span className="text-[10px] text-stone-400 font-semibold">
                Client Upload Requirements
              </span>
            </div>

            {/* Existing file requirements */}
            <div className="space-y-2">
              {fileRequirements.map((fr, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EBE6DD] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-stone-900 flex items-center gap-2">
                      <span>{fr.title}</span>
                      {fr.mandatory ? (
                        <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                          Mandatory
                        </span>
                      ) : (
                        <span className="text-[9px] text-stone-500 bg-stone-100 px-1.5 py-0.2 rounded">
                          Optional
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono text-stone-500">
                      {fr.format}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveFileRequirement(idx)}
                    className="p-1 text-stone-400 hover:text-rose-700 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new file requirement inline */}
            <div className="p-3 rounded-xl bg-[#FAF0DE]/50 border border-[#EADBBF] space-y-2.5">
              <div className="text-[11px] font-bold text-[#8A5A18]">
                Add File Requirement
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newFileTitle}
                    onChange={(e) => setNewFileTitle(e.target.value)}
                    placeholder="e.g. Bank Statement for September 2026"
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <select
                    value={newFileFormat}
                    onChange={(e) => setNewFileFormat(e.target.value)}
                    className="w-full px-2 py-1.5 bg-white border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                  >
                    <option value="PDF Document (.pdf)">
                      PDF Document (.pdf)
                    </option>
                    <option value="Excel Spreadsheet (.xlsx)">
                      Excel Spreadsheet (.xlsx)
                    </option>
                    <option value="Signed PDF Scan">Signed PDF Scan</option>
                    <option value="Bank Certificate (.pdf)">
                      Bank Certificate (.pdf)
                    </option>
                    <option value="Archive (.zip / .rar)">
                      Archive (.zip / .rar)
                    </option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newFileMandatory}
                    onChange={(e) => setNewFileMandatory(e.target.checked)}
                    className="rounded text-[#113227] focus:ring-0"
                  />
                  <span>Mark deliverable as mandatory for completion</span>
                </label>

                <button
                  type="button"
                  onClick={handleAddFileRequirement}
                  className="px-3 py-1 bg-[#113227] text-white rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-[#C58A3E]" />
                  <span>Add Deliverable</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 5: Automated Email / Portal Reminders */}
          <div className="bg-white p-5 rounded-2xl border border-[#EBE6DD] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-[#C58A3E]" />
                <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-[#1C1F1E]">
                  Automated Reminder Schedules
                </h4>
              </div>
              <label className="flex items-center space-x-2 text-xs font-semibold text-[#113227] cursor-pointer">
                <input
                  type="checkbox"
                  checked={automatedReminder}
                  onChange={(e) => setAutomatedReminder(e.target.checked)}
                  className="rounded text-[#113227]"
                />
                <span>Enable Automated Reminders</span>
              </label>
            </div>

            {automatedReminder && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-500 mb-1">
                    Frequency
                  </label>
                  <select
                    value={reminderFrequency}
                    onChange={(e) =>
                      setReminderFrequency(e.target.value as any)
                    }
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                  >
                    <option value="Daily">Daily until uploaded</option>
                    <option value="Every 3 Days">
                      Every 3 Days (Recommended)
                    </option>
                    <option value="Weekly">Weekly Digest</option>
                  </select>
                </div>

                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EBE6DD] text-[11px] text-stone-600 flex items-center">
                  Client contact ({contactEmail}) will receive professional
                  automated dispatch emails referencing ticket #
                  {`PBC-2026-${Math.floor(100 + Math.random() * 900)}`}.
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-600 rounded-xl hover:bg-stone-100 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-forest px-6 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4 text-[#C58A3E]" />
              <span>Issue &amp; Dispatch PBC Requisition</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
