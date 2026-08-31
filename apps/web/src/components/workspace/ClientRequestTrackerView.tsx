import React, { useState, useMemo } from "react";
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  Bell,
  Mail,
  User,
  Building,
  CheckSquare,
  Square,
  Eye,
  Send,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { ClientRequestItem, PBCFileRequirement } from "../../types";
import { NewClientRequestModal } from "./NewClientRequestModal";
import { ClientRequestDetailModal } from "./ClientRequestDetailModal";

interface ClientRequestTrackerViewProps {
  requests: ClientRequestItem[];
  onCreateRequest: (
    request: Omit<ClientRequestItem, "id" | "ticketNo" | "requestedDate">,
  ) => void;
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

export const ClientRequestTrackerView: React.FC<
  ClientRequestTrackerViewProps
> = ({
  requests,
  onCreateRequest,
  onUpdateStatus,
  onToggleFileReceived,
  onSendInstantReminder,
  onToast,
}) => {
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [priorityFilter, setPriorityFilter] = useState<string>("All");
  const [clientFilter, setClientFilter] = useState<string>("All");

  // Modals State
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedForDetail, setSelectedForDetail] =
    useState<ClientRequestItem | null>(null);

  // Statistics
  const totalCount = requests.length;
  const pendingCount = requests.filter(
    (r) =>
      r.status === "Requested" ||
      r.status === "Pending Client Upload" ||
      r.status === "Partially Received",
  ).length;
  const verifyingCount = requests.filter(
    (r) =>
      r.status === "Under Verification" || r.status === "Received & Verifying",
  ).length;
  const acceptedCount = requests.filter(
    (r) => r.status === "Accepted" || r.status === "Resolved",
  ).length;
  const overdueCount = requests.filter((r) => r.status === "Overdue").length;

  // Filtered list
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (statusFilter !== "All") {
        if (
          statusFilter === "Pending" &&
          !(
            req.status === "Requested" ||
            req.status === "Pending Client Upload" ||
            req.status === "Partially Received"
          )
        )
          return false;
        if (
          statusFilter === "Verifying" &&
          !(
            req.status === "Under Verification" ||
            req.status === "Received & Verifying"
          )
        )
          return false;
        if (
          statusFilter === "Accepted" &&
          !(req.status === "Accepted" || req.status === "Resolved")
        )
          return false;
        if (statusFilter === "Overdue" && req.status !== "Overdue")
          return false;
      }

      if (priorityFilter !== "All" && req.priority !== priorityFilter)
        return false;
      if (clientFilter !== "All" && req.clientName !== clientFilter)
        return false;

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesTicket = req.ticketNo.toLowerCase().includes(q);
        const matchesSubject = req.subject.toLowerCase().includes(q);
        const matchesClient = req.clientName.toLowerCase().includes(q);
        const matchesStaff = req.assignedStaff.toLowerCase().includes(q);
        if (
          !matchesTicket &&
          !matchesSubject &&
          !matchesClient &&
          !matchesStaff
        ) {
          return false;
        }
      }

      return true;
    });
  }, [requests, statusFilter, priorityFilter, clientFilter, searchQuery]);

  // Unique clients
  const uniqueClients = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => set.add(r.clientName));
    return Array.from(set);
  }, [requests]);

  const handleBroadcastReminders = () => {
    const overdueList = requests.filter(
      (r) => r.status === "Overdue" || r.status === "Requested",
    );
    overdueList.forEach((r) => onSendInstantReminder(r.id));
    if (onToast) {
      onToast(
        `Automated reminder notifications triggered for ${overdueList.length} pending client requisitions.`,
        "info",
      );
    }
  };

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      {/* New PBC Request Modal */}
      <NewClientRequestModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onCreateRequest={onCreateRequest}
        onToast={onToast}
      />

      {/* Detail / Verification Modal */}
      <ClientRequestDetailModal
        isOpen={Boolean(selectedForDetail)}
        onClose={() => setSelectedForDetail(null)}
        request={selectedForDetail}
        onUpdateStatus={onUpdateStatus}
        onToggleFileReceived={onToggleFileReceived}
        onSendInstantReminder={onSendInstantReminder}
        onToast={onToast}
      />

      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Pending Client Upload */}
        <div
          onClick={() => setStatusFilter("Pending")}
          className="p-5 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs cursor-pointer hover:border-[#113227] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Awaiting Client
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#1C1F1E] mt-2">
            {pendingCount}{" "}
            <span className="text-xs font-normal text-stone-400">
              requisitions
            </span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Documents pending upload from client accounts team
          </div>
        </div>

        {/* Card 2: Under Verification */}
        <div
          onClick={() => setStatusFilter("Verifying")}
          className="p-5 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs cursor-pointer hover:border-[#113227] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Under Verification
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-blue-900 mt-2">
            {verifyingCount}{" "}
            <span className="text-xs font-normal text-stone-400">
              in review
            </span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Uploaded files being checked by articled staff
          </div>
        </div>

        {/* Card 3: Accepted & Verified */}
        <div
          onClick={() => setStatusFilter("Accepted")}
          className="p-5 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs cursor-pointer hover:border-[#113227] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Accepted &amp; Closed
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#E1F3EE] text-[#113227] flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-[#113227] mt-2">
            {acceptedCount}{" "}
            <span className="text-xs font-normal text-stone-400">
              completed
            </span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Fully reconciled audit evidence attached to WP
          </div>
        </div>

        {/* Card 4: Overdue Requisitions */}
        <div
          onClick={() => setStatusFilter("Overdue")}
          className="p-5 rounded-3xl bg-white border border-[#EBE6DD] shadow-xs cursor-pointer hover:border-[#113227] transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Overdue Requisitions
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-bold">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-rose-900 mt-2">
            {overdueCount}{" "}
            <span className="text-xs font-normal text-stone-400">
              past deadline
            </span>
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            Requires automated escalation reminder
          </div>
        </div>
      </div>

      {/* Action and Filter Toolbar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-[#EBE6DD] shadow-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Ticket, Deliverable, Client, or Staff..."
            className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:border-[#113227]"
          />
        </div>

        {/* Filters and New Button */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs font-semibold text-stone-700 focus:outline-none cursor-pointer"
          >
            <option value="All">All Pipeline Stages</option>
            <option value="Pending">Awaiting Client Upload</option>
            <option value="Verifying">Under Verification</option>
            <option value="Accepted">Accepted &amp; Reconciled</option>
            <option value="Overdue">Flagged Overdue</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 bg-[#FAF8F5] border border-[#E5DDD0] rounded-xl text-xs text-stone-700 focus:outline-none cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

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

          <button
            onClick={handleBroadcastReminders}
            className="px-3 py-2 bg-[#FAF0DE] text-[#8A5A18] border border-[#EADBBF] hover:bg-[#F3E7D0] rounded-xl text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
            title="Send automated reminders to all pending clients"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Remind Overdue</span>
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="btn-forest px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#C58A3E]" />
            <span>+ New Client Request (PBC)</span>
          </button>
        </div>
      </div>

      {/* PBC Requests List / Cards */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-[#EBE6DD] text-stone-400 text-xs">
            <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
            <p className="font-semibold text-stone-700">
              No PBC requisitions found.
            </p>
            <p className="text-stone-400 mt-1">
              Create a new client document request or reset the filters.
            </p>
          </div>
        ) : (
          filteredRequests.map((req) => {
            const files = req.fileRequirements || [];
            const receivedFiles = files.filter((f) => f.received).length;
            const progressPercent =
              files.length > 0
                ? Math.round((receivedFiles / files.length) * 100)
                : 0;
            const isOverdue = req.status === "Overdue";
            const isAccepted =
              req.status === "Accepted" || req.status === "Resolved";

            return (
              <div
                key={req.id}
                className={`p-6 rounded-3xl bg-white border transition-all shadow-xs space-y-4 text-left ${
                  isOverdue
                    ? "border-rose-300 bg-gradient-to-r from-white to-rose-50/20"
                    : isAccepted
                      ? "border-[#BCE1D5] bg-gradient-to-r from-white to-[#F6FBF9]"
                      : "border-[#EBE6DD] hover:border-[#113227]/40"
                }`}
              >
                {/* Header Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#113227] bg-[#FAF0DE] px-2.5 py-0.5 rounded-md border border-[#EADBBF]">
                        {req.ticketNo}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          req.priority === "High"
                            ? "bg-rose-100 text-rose-800"
                            : req.priority === "Medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-stone-100 text-stone-700"
                        }`}
                      >
                        {req.priority} Priority
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isAccepted
                            ? "bg-[#E1F3EE] text-[#1F5946] border border-[#BCE1D5]"
                            : isOverdue
                              ? "bg-rose-100 text-rose-800 border border-rose-200"
                              : req.status === "Under Verification" ||
                                  req.status === "Received & Verifying"
                                ? "bg-blue-100 text-blue-800 border border-blue-200"
                                : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {req.status}
                      </span>
                    </div>

                    <h3 className="text-base font-serif font-bold text-[#1C1F1E] mt-1">
                      {req.subject}
                    </h3>

                    <div className="text-xs text-stone-500 font-medium">
                      Client:{" "}
                      <strong className="text-stone-800">
                        {req.clientName}
                      </strong>{" "}
                      • {req.engagementCode || "Audit Requisition"}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSendInstantReminder(req.id)}
                      className="px-3 py-1.5 bg-[#FAF8F5] border border-[#E5DDD0] text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-xl flex items-center space-x-1.5 cursor-pointer"
                      title="Dispatch instant email reminder to client contact"
                    >
                      <Bell className="w-3.5 h-3.5 text-[#C58A3E]" />
                      <span>Send Reminder ({req.remindersCount || 0})</span>
                    </button>

                    <button
                      onClick={() => setSelectedForDetail(req)}
                      className="btn-forest px-4 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#C58A3E]" />
                      <span>Inspect Deliverables</span>
                    </button>
                  </div>
                </div>

                {/* Progress bar of files */}
                {files.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-stone-500">
                      <span>
                        Deliverables Uploaded:{" "}
                        <strong>
                          {receivedFiles} of {files.length}
                        </strong>{" "}
                        items
                      </span>
                      <span className="font-mono font-bold text-[#113227]">
                        {progressPercent}%
                      </span>
                    </div>
                    <div className="w-full bg-[#FAF0DE] h-2 rounded-full overflow-hidden border border-[#EADBBF]">
                      <div
                        className="bg-[#113227] h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Sub-files Pills Preview */}
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        onClick={() =>
                          onToggleFileReceived(req.id, file.id, !file.received)
                        }
                        className={`text-[11px] px-2.5 py-1 rounded-xl border flex items-center space-x-1.5 transition-all cursor-pointer ${
                          file.received
                            ? "bg-[#E1F3EE] text-[#1F5946] border-[#BCE1D5]"
                            : "bg-[#FAF8F5] text-stone-600 border-[#E5DDD0] hover:bg-[#F4ECE1]"
                        }`}
                      >
                        {file.received ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                        ) : (
                          <Square className="w-3 h-3 text-stone-400 shrink-0" />
                        )}
                        <span className="truncate max-w-[200px]">
                          {file.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Footer Metadata */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500 pt-2 border-t border-[#F0EBE1]">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      Target Contact:{" "}
                      <strong className="text-stone-800">
                        {req.targetContact?.name || "Client Accounts"}
                      </strong>{" "}
                      ({req.targetContact?.email || "N/A"})
                    </span>
                    <span>
                      Staff In-Charge:{" "}
                      <strong className="text-stone-800">
                        {req.assignedStaff}
                      </strong>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-stone-400" />
                    <span>
                      Due:{" "}
                      <strong
                        className={
                          isOverdue ? "text-rose-700" : "text-stone-800"
                        }
                      >
                        {req.dueDate}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
