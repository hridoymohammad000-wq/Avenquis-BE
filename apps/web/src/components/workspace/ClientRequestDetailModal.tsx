import React from "react";
import {
  X,
  Building,
  Calendar,
  User,
  Mail,
  Phone,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Download,
  Send,
  Bell,
  CheckSquare,
  Square,
  ShieldCheck,
  Tag,
  Hash,
} from "lucide-react";
import { ClientRequestItem, PBCFileRequirement } from "../../types";

interface ClientRequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: ClientRequestItem | null;
  onUpdateStatus: (
    requestId: string,
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

export const ClientRequestDetailModal: React.FC<
  ClientRequestDetailModalProps
> = ({
  isOpen,
  onClose,
  request,
  onUpdateStatus,
  onToggleFileReceived,
  onSendInstantReminder,
  onToast,
}) => {
  if (!isOpen || !request) return null;

  const files = request.fileRequirements || [];
  const receivedFilesCount = files.filter((f) => f.received).length;
  const progressPercent =
    files.length > 0
      ? Math.round((receivedFilesCount / files.length) * 100)
      : 0;

  const handleStatusChange = (newStatus: ClientRequestItem["status"]) => {
    onUpdateStatus(request.id, newStatus);
    if (onToast) {
      onToast(`Request status updated to "${newStatus}".`, "success");
    }
  };

  const handleReminderClick = () => {
    onSendInstantReminder(request.id);
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn text-left">
      <div className="bg-white rounded-3xl border border-[#EBE6DD] max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-6 bg-[#FAF7F2] border-b border-[#EBE6DD] flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#113227] bg-[#FAF0DE] px-2.5 py-0.5 rounded-md border border-[#EADBBF]">
                {request.ticketNo}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  request.priority === "High"
                    ? "bg-rose-100 text-rose-800"
                    : request.priority === "Medium"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-stone-100 text-stone-700"
                }`}
              >
                {request.priority} Priority
              </span>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  request.status === "Accepted" || request.status === "Resolved"
                    ? "bg-emerald-100 text-emerald-800"
                    : request.status === "Overdue"
                      ? "bg-rose-100 text-rose-800"
                      : request.status === "Under Verification" ||
                          request.status === "Received & Verifying"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                {request.status}
              </span>
            </div>

            <h2 className="text-lg font-serif font-bold text-[#1C1F1E] mt-1">
              {request.subject}
            </h2>

            <div className="text-xs text-stone-500 font-medium">
              Client:{" "}
              <strong className="text-stone-800">{request.clientName}</strong> •{" "}
              {request.engagementCode || "Audit Requisition"}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#FAF8F5]">
          {/* Progress Bar & Status Pipeline */}
          <div className="bg-white p-5 rounded-2xl border border-[#EBE6DD] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-serif uppercase tracking-wider text-[#1C1F1E]">
                Deliverables Received: {receivedFilesCount} of {files.length} (
                {progressPercent}%)
              </span>

              <div className="flex items-center space-x-2">
                <span className="text-xs text-stone-500 font-medium">
                  Pipeline Stage:
                </span>
                <select
                  value={request.status}
                  onChange={(e) => handleStatusChange(e.target.value as any)}
                  className="px-2.5 py-1 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs font-bold text-[#113227] focus:outline-none cursor-pointer"
                >
                  <option value="Requested">Requested (Awaiting Client)</option>
                  <option value="Partially Received">Partially Received</option>
                  <option value="Under Verification">Under Verification</option>
                  <option value="Accepted">Accepted &amp; Verified</option>
                  <option value="Overdue">Flagged as Overdue</option>
                </select>
              </div>
            </div>

            {/* Progress Track */}
            <div className="w-full bg-[#FAF0DE] h-2.5 rounded-full overflow-hidden border border-[#EADBBF]">
              <div
                className="bg-[#113227] h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Scope & Description */}
          {request.description && (
            <div className="bg-white p-5 rounded-2xl border border-[#EBE6DD] shadow-xs space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                Audit Scope &amp; Instructions Given to Client
              </div>
              <p className="text-xs text-stone-800 leading-relaxed">
                {request.description}
              </p>
            </div>
          )}

          {/* Target Client Contact Card & Reminder Trigger */}
          <div className="bg-white p-5 rounded-2xl border border-[#EBE6DD] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-[#1C1F1E] flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#113227]" />
                <span>Client Contact &amp; Dispatch Details</span>
              </h4>

              <button
                onClick={handleReminderClick}
                className="btn-forest px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5 text-[#C58A3E]" />
                <span>Send Instant Reminder</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-[#FAF8F5] p-3.5 rounded-xl border border-[#ECE5D9]">
              <div className="space-y-1">
                <div className="text-stone-500 text-[10px] font-bold uppercase">
                  Recipient
                </div>
                <div className="font-bold text-stone-900">
                  {request.targetContact?.name || "Client Management"}
                </div>
                <div className="text-[11px] text-stone-500">
                  {request.targetContact?.designation || "Finance Department"}
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-stone-500 text-[10px] font-bold uppercase">
                  Contact Channels
                </div>
                <div className="flex items-center space-x-1 text-stone-700">
                  <Mail className="w-3.5 h-3.5 text-[#113227]" />
                  <span>
                    {request.targetContact?.email || "finance@client.com"}
                  </span>
                </div>
                {request.targetContact?.phone && (
                  <div className="flex items-center space-x-1 text-stone-700">
                    <Phone className="w-3.5 h-3.5 text-[#113227]" />
                    <span>{request.targetContact.phone}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1 sm:col-span-2 pt-2 border-t border-[#E5DDD0] flex items-center justify-between text-[11px] text-stone-500">
                <span>
                  Requested: <strong>{request.requestedDate}</strong> • Due:{" "}
                  <strong className="text-[#8A5A18]">{request.dueDate}</strong>
                </span>
                <span>
                  Reminders Sent:{" "}
                  <strong className="text-stone-800">
                    {request.remindersCount || 0}
                  </strong>{" "}
                  {request.lastReminderSent
                    ? `(Last: ${request.lastReminderSent})`
                    : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Deliverables Checklist (Interactive Verification) */}
          <div className="bg-white p-5 rounded-2xl border border-[#EBE6DD] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-[#1C1F1E] flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#113227]" />
                <span>Required Deliverable Files ({files.length})</span>
              </h4>
              <span className="text-[10px] text-stone-400">
                Click check to toggle verification
              </span>
            </div>

            {files.length === 0 ? (
              <p className="text-xs text-stone-400 italic">
                No specific sub-files attached to this request.
              </p>
            ) : (
              <div className="space-y-2.5">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                      file.received
                        ? "bg-[#E1F3EE]/50 border-[#BCE1D5]"
                        : "bg-[#FAF8F5] border-[#ECE5D9]"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <button
                        onClick={() =>
                          onToggleFileReceived(
                            request.id,
                            file.id,
                            !file.received,
                          )
                        }
                        className="mt-0.5 cursor-pointer text-[#113227]"
                      >
                        {file.received ? (
                          <CheckSquare className="w-4 h-4 text-emerald-700" />
                        ) : (
                          <Square className="w-4 h-4 text-stone-400 hover:text-stone-700" />
                        )}
                      </button>

                      <div className="space-y-0.5">
                        <div className="font-semibold text-stone-900 flex items-center gap-2">
                          <span>{file.title}</span>
                          {file.mandatory && (
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              Mandatory
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          Format: {file.format}{" "}
                          {file.fileSize ? `• ${file.fileSize}` : ""}
                        </div>
                        {file.received && file.fileHash && (
                          <div className="text-[9px] font-mono text-emerald-800 flex items-center gap-1 mt-0.5">
                            <ShieldCheck className="w-3 h-3" />
                            <span>Hash Proof: {file.fileHash}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      {file.received ? (
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>
                            Received ({file.receivedDate || "Verified"})
                          </span>
                        </span>
                      ) : (
                        <button
                          onClick={() =>
                            onToggleFileReceived(request.id, file.id, true)
                          }
                          className="px-2.5 py-1 bg-white border border-[#E5DDD0] text-[11px] font-semibold text-stone-700 rounded-lg hover:bg-stone-50 cursor-pointer"
                        >
                          Mark as Received
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#EBE6DD] flex items-center justify-between text-xs text-stone-500">
          <div className="text-[11px]">
            Staff In-Charge:{" "}
            <strong className="text-stone-800">{request.assignedStaff}</strong>
          </div>

          <div className="flex items-center space-x-2">
            {request.status !== "Accepted" && (
              <button
                onClick={() => {
                  handleStatusChange("Accepted");
                  onClose();
                }}
                className="btn-forest px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C58A3E]" />
                <span>Mark Requisition Accepted</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-[#E5DDD0] text-xs font-semibold text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
