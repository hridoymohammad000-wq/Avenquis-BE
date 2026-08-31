import React, { useState } from "react";
import { motion } from "motion/react";
import { AnimatedNumber, MotionProgressBar } from "../motion/MotionPrimitives";
import {
  Briefcase,
  Award,
  Clock,
  Calendar,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  FileCheck2,
  Users,
  ChevronRight,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  CircleDot,
  FileUp,
  Inbox,
  Layers,
  ArrowRight,
  Check,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Timer,
  Building,
  DollarSign,
  UserCheck,
  X,
  Lock,
} from "lucide-react";
import {
  EngagementRecord,
  TaskRecord,
  SignOffItem,
  WorkingPaper,
  TimesheetEntry,
  ClientRecord,
  AuditActivityEvent,
  WorkspaceTab,
} from "../../types";
import { INITIAL_AUDIT_ACTIVITIES } from "../../data/workspaceData";

interface DashboardViewProps {
  engagements: EngagementRecord[];
  tasks: TaskRecord[];
  signoffs: SignOffItem[];
  workingPapers: WorkingPaper[];
  timesheets?: TimesheetEntry[];
  clients?: ClientRecord[];
  onNavigateTab: (tab: WorkspaceTab) => void;
  onQuickSignOff: (signoffId: string) => void;
  onAddEngagement?: (eng: Partial<EngagementRecord>) => void;
  onAddTask?: (task: Partial<TaskRecord>) => void;
  onAddTimesheet?: (ts: Partial<TimesheetEntry>) => void;
  onAddWorkingPaper?: (wp: Partial<WorkingPaper>) => void;
  onUpdateTaskStatus?: (taskId: string, status: TaskRecord["status"]) => void;
  onUpdateEngagementStage?: (
    engagementId: string,
    stage: EngagementRecord["stage"],
  ) => void;
}

type PipelineFilter =
  "all" | "Statutory Audit" | "Tax Compliance" | "Special Advisory";

export const DashboardView: React.FC<DashboardViewProps> = ({
  engagements,
  tasks,
  signoffs,
  workingPapers,
  timesheets = [],
  clients = [],
  onNavigateTab,
  onQuickSignOff,
  onAddEngagement,
  onAddTask,
  onAddTimesheet,
  onAddWorkingPaper,
  onUpdateTaskStatus,
  onUpdateEngagementStage,
}) => {
  // Filters & State
  const [pipelineFilter, setPipelineFilter] = useState<PipelineFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [activityFeed, setActivityFeed] = useState<AuditActivityEvent[]>(
    INITIAL_AUDIT_ACTIVITIES,
  );

  // Modals
  const [isNewEngagementModalOpen, setIsNewEngagementModalOpen] =
    useState(false);
  const [isLogTimeModalOpen, setIsLogTimeModalOpen] = useState(false);
  const [isUploadWpModalOpen, setIsUploadWpModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedEngagementDetail, setSelectedEngagementDetail] =
    useState<EngagementRecord | null>(null);

  // New Engagement Form State
  const [newEngClient, setNewEngClient] = useState("");
  const [newEngService, setNewEngService] =
    useState<EngagementRecord["serviceType"]>("Statutory Audit");
  const [newEngManager, setNewEngManager] = useState("Zahirul Islam, FCA");
  const [newEngPartner, setNewEngPartner] = useState("Fouzia Haque, FCA");
  const [newEngDueDate, setNewEngDueDate] = useState("2026-10-31");
  const [newEngBudget, setNewEngBudget] = useState(180);

  // Log Time Form State
  const [logTimeClient, setLogTimeClient] = useState(
    engagements[0]?.clientName || "Apex Footwear & Polymer Ltd.",
  );
  const [logTimeCode, setLogTimeCode] = useState(
    engagements[0]?.engagementCode || "AUD-2026-081",
  );
  const [logTimeHours, setLogTimeHours] = useState("4.5");
  const [logTimeDesc, setLogTimeDesc] = useState("");
  const [logTimeBillable, setLogTimeBillable] = useState(true);

  // Upload WP Form State
  const [wpRefCode, setWpRefCode] = useState("B-250");
  const [wpTitle, setWpTitle] = useState("");
  const [wpClient, setWpClient] = useState(
    engagements[0]?.clientName || "Apex Footwear & Polymer Ltd.",
  );
  const [wpFileName, setWpFileName] = useState("");

  // New Quick Task Form State
  const [taskTitle, setTaskTitle] = useState("");
  const [taskClient, setTaskClient] = useState(
    engagements[0]?.clientName || "Apex Footwear & Polymer Ltd.",
  );
  const [taskPriority, setTaskPriority] =
    useState<TaskRecord["priority"]>("High");
  const [taskDueDate, setTaskDueDate] = useState("2026-09-08");

  // Computed Metrics
  const pendingSignOffs = signoffs.filter((s) => s.status === "Pending");
  const urgentTasks = tasks.filter((t) => t.status !== "Completed");

  // Breakdown of active engagements by service category
  const auditCount = engagements.filter(
    (e) =>
      e.serviceType === "Statutory Audit" || e.serviceType === "Internal Audit",
  ).length;
  const taxCount = engagements.filter(
    (e) =>
      e.serviceType === "Tax Compliance" || e.serviceType === "VAT Assessment",
  ).length;
  const advisoryCount = engagements.filter(
    (e) =>
      e.serviceType === "Special Advisory" ||
      e.serviceType === "Transfer Pricing" ||
      e.serviceType === "Due Diligence",
  ).length;

  // Unbilled / Logged Hours & Billing Value
  const totalLoggedHours = engagements.reduce(
    (sum, e) => sum + e.loggedHours,
    0,
  );
  const totalBudgetHours = engagements.reduce(
    (sum, e) => sum + e.budgetHours,
    0,
  );
  // Average standard billing rate = BDT 10,000 / USD $100 per hour
  const estBillingValue = (totalLoggedHours * 10500).toLocaleString("en-US");

  // Compliance Deadlines countdown (filings within 7 days from Aug 31, 2026 -> Sep 7, 2026)
  const filingsWithin7Days = [
    {
      client: "Orbit Textiles Group",
      type: "VAT Return (Mushak 9.1)",
      due: "2026-09-04",
      daysLeft: 4,
      critical: true,
    },
    {
      client: "Apex Footwear Ltd.",
      type: "AIT Challan Reconciliation",
      due: "2026-09-06",
      daysLeft: 6,
      critical: true,
    },
    {
      client: "Novartis Healthcare",
      type: "Deferred Tax Schedule",
      due: "2026-09-07",
      daysLeft: 7,
      critical: false,
    },
  ];

  // Pipeline Filtered List
  const filteredEngagements = engagements.filter((eng) => {
    const matchesFilter =
      pipelineFilter === "all"
        ? true
        : pipelineFilter === "Tax Compliance"
          ? eng.serviceType === "Tax Compliance" ||
            eng.serviceType === "VAT Assessment"
          : eng.serviceType === pipelineFilter;

    const matchesSearch =
      eng.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eng.engagementCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eng.leadManager.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eng.serviceType.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  // Action Handlers
  const handleCreateEngagementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEngClient.trim()) return;

    if (onAddEngagement) {
      onAddEngagement({
        clientName: newEngClient,
        serviceType: newEngService,
        leadManager: newEngManager,
        leadPartner: newEngPartner,
        dueDate: newEngDueDate,
        budgetHours: Number(newEngBudget) || 150,
        stage: "Planning",
        health: "On Track",
        progressPercent: 5,
        loggedHours: 0,
      });
    }

    // Add activity
    const newAct: AuditActivityEvent = {
      id: `act-${Date.now()}`,
      type: "stage_change",
      title: `New Engagement Created (${newEngService})`,
      description: `Initiated engagement for ${newEngClient}. Assigned to ${newEngManager}.`,
      actor: "Zahirul Islam, FCA",
      actorRole: "Manager - Audit & Tax",
      timestamp: "Just now",
      ref: newEngService.slice(0, 3).toUpperCase(),
    };
    setActivityFeed((prev) => [newAct, ...prev]);

    setIsNewEngagementModalOpen(false);
    setNewEngClient("");
  };

  const handleLogTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hoursNum = parseFloat(logTimeHours) || 1;

    if (onAddTimesheet) {
      onAddTimesheet({
        clientName: logTimeClient,
        engagementCode: logTimeCode,
        hours: hoursNum,
        taskDescription:
          logTimeDesc ||
          "Audit & compliance procedures conducted according to ISA.",
        billable: logTimeBillable,
        date: "2026-08-31",
        staffName: "Zahirul Islam, FCA",
      });
    }

    // Add activity
    const newAct: AuditActivityEvent = {
      id: `act-${Date.now()}`,
      type: "timesheet",
      title: `Logged ${hoursNum} Billable Hours`,
      description: `${logTimeClient} • ${logTimeDesc || "Substantive testing procedures"}`,
      actor: "Zahirul Islam, FCA",
      actorRole: "Manager",
      timestamp: "Just now",
      ref: logTimeCode,
    };
    setActivityFeed((prev) => [newAct, ...prev]);

    setIsLogTimeModalOpen(false);
    setLogTimeDesc("");
  };

  const handleUploadWpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanRef = wpRefCode.trim() || "WP-999";
    const cleanTitle = wpTitle.trim() || "Substantive Audit Working Paper";
    const generatedHash = `0x${Math.random().toString(16).substring(2, 14)}`;

    if (onAddWorkingPaper) {
      onAddWorkingPaper({
        wpRef: cleanRef,
        title: cleanTitle,
        clientName: wpClient,
        preparedBy: "Zahirul Islam, FCA",
        preparedDate: "2026-08-31",
        status: "Ready for Review",
        fileHash: generatedHash,
        findingsCount: 0,
        checklistComplete: true,
      });
    }

    // Add activity
    const newAct: AuditActivityEvent = {
      id: `act-${Date.now()}`,
      type: "upload",
      title: `Working Paper ${cleanRef} Uploaded`,
      description: `${cleanTitle} for ${wpClient}. Tamper-evident hash: ${generatedHash}`,
      actor: "Zahirul Islam, FCA",
      actorRole: "Manager",
      timestamp: "Just now",
      ref: cleanRef,
    };
    setActivityFeed((prev) => [newAct, ...prev]);

    setIsUploadWpModalOpen(false);
    setWpTitle("");
    setWpFileName("");
  };

  const handleQuickTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    if (onAddTask) {
      onAddTask({
        title: taskTitle.trim(),
        clientName: taskClient,
        priority: taskPriority,
        dueDate: taskDueDate,
        assignedTo: "Zahirul Islam, FCA",
        status: "Todo",
        estimatedHours: 4,
        category: "Audit Workpaper",
      });
    }

    setIsTaskModalOpen(false);
    setTaskTitle("");
  };

  const handleToggleTask = (
    taskId: string,
    currentStatus: TaskRecord["status"],
  ) => {
    if (onUpdateTaskStatus) {
      const nextStatus = currentStatus === "Done" ? "In Progress" : "Done";
      onUpdateTaskStatus(taskId, nextStatus);
    }
  };

  return (
    <div className="space-y-7 animate-fadeIn text-left pb-12">
      {/* 1. TOP WELCOME & COCKPIT HEADER WITH QUICK ACTION BUTTONS */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-[#EBE6DD] shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative overflow-hidden">
        {/* Subtle decorative gold sheen accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#F7EBD3]/40 via-transparent to-transparent pointer-events-none rounded-tr-3xl" />

        <div className="relative z-10 space-y-1.5">
          <div className="inline-flex items-center space-x-2 bg-[#FAF0DE] border border-[#EADBBF] px-3 py-1 rounded-full text-[10.5px] font-bold tracking-wider text-[#8A5A18]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C58A3E] animate-ping" />
            <span className="uppercase">AVENQUIS EXECUTIVE COCKPIT</span>
            <span className="text-[#C58A3E] font-serif">✦</span>
            <span>ISA 220 REVIEW WORKFLOW</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1F1E] tracking-tight">
            Firm Executive Overview &amp; Compliance Hub
          </h1>
          <p className="text-xs sm:text-sm text-[#66706B] max-w-2xl leading-relaxed">
            Real-time multi-engagement monitoring, audit quality review &amp;
            sign-off controls, timesheet velocity, and statutory filing
            deadlines.
          </p>
        </div>

        {/* 3 Quick Action Buttons: "New Engagement", "Log Time", "Upload Working Paper" */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            id="dashboard-btn-new-engagement"
            onClick={() => setIsNewEngagementModalOpen(true)}
            className="btn-forest px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 shadow-2xs hover:shadow-sm cursor-pointer transition-all active:scale-98"
          >
            <Plus className="w-3.5 h-3.5 text-[#C58A3E]" />
            <span>New Engagement</span>
          </button>

          <button
            id="dashboard-btn-log-time"
            onClick={() => setIsLogTimeModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-[#F5EFE6] hover:bg-[#EBE3D5] border border-[#DDD4C5] text-[#113227] text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer active:scale-98"
          >
            <Clock className="w-3.5 h-3.5 text-[#8A5A18]" />
            <span>Log Time</span>
          </button>

          <button
            id="dashboard-btn-upload-wp"
            onClick={() => setIsUploadWpModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-[#FAF8F5] border border-[#DDD4C5] text-[#333E38] text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer shadow-2xs active:scale-98"
          >
            <FileUp className="w-3.5 h-3.5 text-[#1F5946]" />
            <span>Upload Working Paper</span>
          </button>
        </div>
      </div>

      {/* 2. KPI SUMMARY CARDS (4 CARDS GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Active Engagements */}
        <motion.div
          id="kpi-active-engagements"
          onClick={() => onNavigateTab("engagements")}
          className="motion-card p-5 rounded-2xl bg-white border border-[#EBE6DD] hover:border-[#D6CCC0] hover:shadow-sm transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.02, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#E1F3EE] flex items-center justify-center transition-transform group-hover:scale-105">
                <Briefcase className="w-5 h-5 text-[#1F5946]" />
              </div>
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#E1F3EE] text-[#1F5946] text-[10.5px] font-bold">
                <TrendingUp className="w-3 h-3" />
                <span>+14% MoM</span>
              </div>
            </div>

            <p className="text-xs font-semibold text-[#7C8782] tracking-wide">
              Active Engagements
            </p>
            <div className="flex items-baseline space-x-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1F1E]">
                <AnimatedNumber value={engagements.length} />
              </h3>
              <span className="text-xs text-[#8A9691] font-medium">
                Jobs in Progress
              </span>
            </div>
          </div>

          {/* Breakdown Badge */}
          <div className="mt-4 pt-3 border-t border-[#F0EBE1]">
            <div className="flex flex-wrap items-center gap-1.5 text-[10.5px] font-medium text-[#55605B]">
              <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#EBE5DA]">
                Audit: <strong>{auditCount}</strong>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#EBE5DA]">
                Tax: <strong>{taxCount}</strong>
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#EBE5DA]">
                Advisory: <strong>{advisoryCount}</strong>
              </span>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Pending Sign-offs & Reviews */}
        <motion.div
          id="kpi-pending-reviews"
          onClick={() => onNavigateTab("reviews")}
          className="motion-card p-5 rounded-2xl bg-white border border-[#EBE6DD] hover:border-[#D6CCC0] hover:shadow-sm transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#FCEFD9] flex items-center justify-center transition-transform group-hover:scale-105">
                <Award className="w-5 h-5 text-[#8A5A18]" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#FDE6E2] text-[#8E362C] text-[10px] font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span>1 pending &gt;48h</span>
              </span>
            </div>

            <p className="text-xs font-semibold text-[#7C8782] tracking-wide">
              Pending Sign-offs &amp; Reviews
            </p>
            <div className="flex items-baseline space-x-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1F1E]">
                <AnimatedNumber value={pendingSignOffs.length} />
              </h3>
              <span className="text-xs text-[#8A5A18] font-semibold">
                ISA 220 Action Items
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-[11px]">
            <span className="text-[#7A8782]">Manager &amp; Partner queue</span>
            <span className="text-[#113227] font-bold group-hover:underline flex items-center">
              Review <ChevronRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </motion.div>

        {/* Card 3: Unbilled Timesheet Hours */}
        <motion.div
          id="kpi-unbilled-hours"
          onClick={() => onNavigateTab("timesheets")}
          className="motion-card p-5 rounded-2xl bg-white border border-[#EBE6DD] hover:border-[#D6CCC0] hover:shadow-sm transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#E2F1F8] flex items-center justify-center transition-transform group-hover:scale-105">
                <Clock className="w-5 h-5 text-[#1D526D]" />
              </div>
              <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-[#EBF7F2] text-[#1F5946] text-[10px] font-bold">
                <span>92% Billable</span>
              </div>
            </div>

            <p className="text-xs font-semibold text-[#7C8782] tracking-wide">
              Unbilled Timesheet Hours
            </p>
            <div className="flex items-baseline space-x-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1F1E]">
                <AnimatedNumber value={totalLoggedHours} /> hrs
              </h3>
              <span className="text-xs text-[#66706B]">
                / {totalBudgetHours}h cap
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F0EBE1]">
            <p className="text-[11px] text-[#55605B] font-medium">
              Est. billing value:{" "}
              <strong className="text-[#113227] font-mono">
                ৳{estBillingValue}
              </strong>
            </p>
          </div>
        </motion.div>

        {/* Card 4: Compliance Deadlines (Countdown within 7 days) */}
        <motion.div
          id="kpi-compliance-deadlines"
          onClick={() => onNavigateTab("tasks")}
          className="motion-card p-5 rounded-2xl bg-white border border-[#EBE6DD] hover:border-[#D6CCC0] hover:shadow-sm transition-all duration-200 cursor-pointer group flex flex-col justify-between"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDE6E2] flex items-center justify-center transition-transform group-hover:scale-105">
                <Calendar className="w-5 h-5 text-[#8E362C]" />
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#FAF0DE] border border-[#E8DFC0] text-[#8A5A18] text-[10px] font-bold">
                7 Days Window
              </span>
            </div>

            <p className="text-xs font-semibold text-[#7C8782] tracking-wide">
              Compliance Deadlines
            </p>
            <div className="flex items-baseline space-x-2 mt-1">
              <h3 className="text-2xl sm:text-3xl font-serif font-bold text-[#8E362C]">
                <AnimatedNumber value={filingsWithin7Days.length} /> Filings
              </h3>
              <span className="text-xs text-[#8E362C] font-semibold">
                Urgent Target
              </span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-[11px]">
            <span className="text-[#7A8782] truncate">
              Next: <strong>Orbit VAT (Sep 04)</strong>
            </span>
            <span className="text-[#8E362C] font-bold shrink-0">4d left</span>
          </div>
        </motion.div>
      </div>

      {/* 3. ENGAGEMENT PIPELINE & STATUS TRACKER (FULL DATA TABLE WITH QUICK FILTER PILLS) */}
      <div className="bg-white rounded-3xl border border-[#EBE6DD] p-5 sm:p-6 shadow-2xs space-y-5">
        {/* Header with Title & Filter Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#F0EBE1]">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-serif font-bold text-[#1C1F1E]">
                Engagement Pipeline &amp; Status Tracker
              </h2>
              <span className="px-2 py-0.5 text-[11px] font-bold bg-[#FAF0DE] text-[#8A5A18] rounded-full">
                {filteredEngagements.length} Active Jobs
              </span>
            </div>
            <p className="text-xs text-[#7A8782] mt-0.5">
              Live progress, health telemetry, ISA stage milestones, and
              staffing accountability.
            </p>
          </div>

          {/* Search and Filter Pills */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A9691]" />
              <input
                type="text"
                placeholder="Search jobs, clients, partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 pr-3 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227] w-full sm:w-56"
              />
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center space-x-1.5 p-1 bg-[#FAF7F2] border border-[#E5DDD0] rounded-xl overflow-x-auto">
              <button
                onClick={() => setPipelineFilter("all")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  pipelineFilter === "all"
                    ? "bg-[#113227] text-white shadow-2xs"
                    : "text-[#66706B] hover:text-[#1C1F1E]"
                }`}
              >
                All ({engagements.length})
              </button>
              <button
                onClick={() => setPipelineFilter("Statutory Audit")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  pipelineFilter === "Statutory Audit"
                    ? "bg-[#113227] text-white shadow-2xs"
                    : "text-[#66706B] hover:text-[#1C1F1E]"
                }`}
              >
                Statutory Audit ({auditCount})
              </button>
              <button
                onClick={() => setPipelineFilter("Tax Compliance")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  pipelineFilter === "Tax Compliance"
                    ? "bg-[#113227] text-white shadow-2xs"
                    : "text-[#66706B] hover:text-[#1C1F1E]"
                }`}
              >
                Corporate Tax ({taxCount})
              </button>
              <button
                onClick={() => setPipelineFilter("Special Advisory")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  pipelineFilter === "Special Advisory"
                    ? "bg-[#113227] text-white shadow-2xs"
                    : "text-[#66706B] hover:text-[#1C1F1E]"
                }`}
              >
                Special Advisory ({advisoryCount})
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Data Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="border-b border-[#EBE5DA] text-[11px] font-bold text-[#8A9691] uppercase tracking-wider">
                <th className="pb-3 pl-1">Client Name &amp; Code</th>
                <th className="pb-3 px-3">Engagement Type</th>
                <th className="pb-3 px-3">Lead Partner / Manager</th>
                <th className="pb-3 px-3">Stage &amp; Progress</th>
                <th className="pb-3 px-3">Health</th>
                <th className="pb-3 px-3">Due Date</th>
                <th className="pb-3 pr-1 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE1] text-xs">
              {filteredEngagements.map((eng) => {
                const health = eng.health || "On Track";
                return (
                  <tr
                    key={eng.id}
                    className="hover:bg-[#FAF8F5] transition-colors group cursor-pointer"
                    onClick={() => setSelectedEngagementDetail(eng)}
                  >
                    {/* Client Name & Engagement Code */}
                    <td className="py-3.5 pl-1">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#FAF0DE] border border-[#EADBBF] text-[#8A5A18] font-bold text-xs flex items-center justify-center shrink-0">
                          {eng.clientName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#1C1F1E] group-hover:text-[#113227] truncate max-w-[200px]">
                            {eng.clientName}
                          </div>
                          <div className="flex items-center space-x-1.5 text-[10.5px] font-mono text-[#7A8782]">
                            <span className="text-[#C58A3E] font-semibold">
                              {eng.engagementCode}
                            </span>
                            <span>•</span>
                            <span>{eng.budgetHours}h budget</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Engagement Type */}
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#FAF7F2] border border-[#E5DDD0] text-[#3D4742]">
                        {eng.serviceType}
                      </span>
                    </td>

                    {/* Lead Partner / Manager */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-0.5">
                        <div className="font-semibold text-[#1C1F1E] text-xs">
                          {eng.leadManager}
                        </div>
                        <div className="text-[10.5px] text-[#7A8782] flex items-center gap-1">
                          <UserCheck className="w-3 h-3 text-[#C58A3E]" />
                          <span>Partner: {eng.leadPartner}</span>
                        </div>
                      </div>
                    </td>

                    {/* Stage & Progress Bar */}
                    <td className="py-3.5 px-3">
                      <div className="w-36 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span
                            className="font-bold text-[10px] px-1.5 py-0.2 rounded"
                            style={{
                              backgroundColor:
                                eng.stage === "Fieldwork"
                                  ? "#FCEFD9"
                                  : eng.stage === "Review" ||
                                      eng.stage === "Sign-off"
                                    ? "#E1F3EE"
                                    : "#E2F1F8",
                              color:
                                eng.stage === "Fieldwork"
                                  ? "#8A5A18"
                                  : eng.stage === "Review" ||
                                      eng.stage === "Sign-off"
                                    ? "#1F5946"
                                    : "#1D526D",
                            }}
                          >
                            {eng.stage}
                          </span>
                          <span className="font-mono text-[10px] text-[#66706B]">
                            {eng.progressPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-[#ECE5D9] h-1.5 rounded-full overflow-hidden">
                          <MotionProgressBar
                            value={eng.progressPercent}
                            className="bg-[#113227] h-full rounded-full"
                          />
                        </div>
                      </div>
                    </td>

                    {/* Health Status (On Track, At Risk, Delayed) */}
                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center space-x-1.5 px-2 py-0.8 rounded-full text-[10.5px] font-bold ${
                          health === "On Track"
                            ? "bg-[#E1F3EE] text-[#1F5946] border border-[#C5E8DC]"
                            : health === "At Risk"
                              ? "bg-[#FCEFD9] text-[#8A5A18] border border-[#ECD9B8]"
                              : "bg-[#FDE6E2] text-[#8E362C] border border-[#F4CCC6]"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            health === "On Track"
                              ? "bg-emerald-600"
                              : health === "At Risk"
                                ? "bg-amber-600 animate-pulse"
                                : "bg-rose-600 animate-pulse"
                          }`}
                        />
                        <span>{health}</span>
                      </span>
                    </td>

                    {/* Due Date with Countdown Badge */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-0.5">
                        <div className="font-mono text-xs font-semibold text-[#1C1F1E]">
                          {eng.dueDate}
                        </div>
                        <div className="text-[10px] text-[#8A9691]">
                          {new Date(eng.dueDate) < new Date("2026-09-10") ? (
                            <span className="text-[#8E362C] font-semibold">
                              Priority filing
                            </span>
                          ) : (
                            <span>Standard schedule</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Actions Button */}
                    <td
                      className="py-3.5 pr-1 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedEngagementDetail(eng)}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE3D5] border border-[#E0D7C8] text-[#113227] text-xs font-bold transition-colors cursor-pointer"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => onNavigateTab("engagements")}
                          className="p-1.5 rounded-lg text-[#8A9691] hover:text-[#113227] hover:bg-[#FAF7F2] transition-colors"
                          title="Open in Engagements module"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="pt-3 border-t border-[#F0EBE1] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A8782] gap-2">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-[#1F5946]" />
            <span>
              ISA 300 / ISA 220 Practice Standard • All jobs tracked under FAMES
              &amp; R Quality Controls
            </span>
          </div>
          <button
            onClick={() => onNavigateTab("engagements")}
            className="font-bold text-[#113227] hover:underline flex items-center space-x-1 cursor-pointer"
          >
            <span>Open Comprehensive Engagements Module</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. QUICK ACTION WIDGETS & TIMELINE: "My Urgent Tasks" and "Recent Audit Activity" */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Widget: "My Urgent Tasks" (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-[#EBE6DD] p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EBE1] mb-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-serif font-bold text-[#1C1F1E]">
                  My Urgent Tasks &amp; Milestones
                </h3>
                <span className="px-2 py-0.5 text-[10.5px] font-bold bg-[#FDE6E2] text-[#8E362C] rounded-full">
                  {urgentTasks.length} Active
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  id="btn-add-urgent-task"
                  onClick={() => setIsTaskModalOpen(true)}
                  className="text-xs font-bold text-[#113227] bg-[#FAF7F2] hover:bg-[#F2ECE1] border border-[#E0D7C8] px-2.5 py-1 rounded-lg flex items-center space-x-1 cursor-pointer transition-colors"
                >
                  <Plus className="w-3 h-3 text-[#C58A3E]" />
                  <span>Add Task</span>
                </button>
                <button
                  onClick={() => onNavigateTab("tasks")}
                  className="text-xs font-bold text-[#113227] hover:underline cursor-pointer"
                >
                  View All →
                </button>
              </div>
            </div>

            {/* Task Item List with Interactive Checkbox Status */}
            <div className="space-y-2.5">
              {tasks.slice(0, 5).map((task) => {
                const isDone = task.status === "Completed";
                return (
                  <div
                    key={task.id}
                    className={`p-3 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                      isDone
                        ? "bg-[#F9F7F5] border-[#E8E1D5] opacity-60"
                        : "bg-[#FAF8F5] border-[#ECE5D9] hover:bg-white hover:border-[#D5CBBC]"
                    }`}
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      {/* Checkbox Trigger */}
                      <button
                        onClick={() => handleToggleTask(task.id, task.status)}
                        className={`w-5 h-5 mt-0.5 rounded-lg border flex items-center justify-center shrink-0 transition-colors cursor-pointer ${
                          isDone
                            ? "bg-[#113227] border-[#113227] text-white"
                            : "bg-white border-[#C8BFB0] hover:border-[#113227]"
                        }`}
                        title={
                          isDone ? "Mark as incomplete" : "Mark as completed"
                        }
                      >
                        {isDone && <Check className="w-3.5 h-3.5" />}
                      </button>

                      <div className="space-y-0.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {/* Priority Badge */}
                          <span
                            className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded uppercase ${
                              task.priority === "Urgent"
                                ? "bg-[#FDE6E2] text-[#8E362C]"
                                : task.priority === "High"
                                  ? "bg-[#FCEFD9] text-[#8A5A18]"
                                  : "bg-[#E2F1F8] text-[#1D526D]"
                            }`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`text-xs font-bold text-[#1C1F1E] truncate ${
                              isDone ? "line-through text-[#7A8782]" : ""
                            }`}
                          >
                            {task.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#66706B] truncate">
                          {task.clientName} • Assigned:{" "}
                          <strong className="text-[#333]">
                            {task.assignedTo}
                          </strong>
                        </p>
                      </div>
                    </div>

                    {/* Due Date & Hours */}
                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono font-bold text-[#8E362C] block">
                        Due {task.dueDate}
                      </span>
                      <span className="text-[10px] text-[#88948F]">
                        {task.estimatedHours}h est.
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-xs text-[#7A8782]">
            <span>Assigned lead tasks automatically sync with timesheets</span>
            <button
              onClick={() => onNavigateTab("tasks")}
              className="text-xs font-bold text-[#113227] hover:underline"
            >
              Open Operational Task Board →
            </button>
          </div>
        </div>

        {/* Right Widget: "Recent Audit Activity" (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-[#EBE6DD] p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-3.5 border-b border-[#F0EBE1] mb-3">
              <div>
                <h3 className="text-base font-serif font-bold text-[#1C1F1E]">
                  Recent Audit Activity
                </h3>
                <p className="text-[11px] text-[#7A8782]">
                  Append-only regulatory event trail
                </p>
              </div>
              <span className="text-[10.5px] font-mono text-[#1F5946] bg-[#E1F3EE] px-2 py-0.5 rounded-full font-bold">
                Live Feed
              </span>
            </div>

            {/* Event Timeline List */}
            <div className="space-y-3 max-h-[340px] overflow-y-auto custom-scrollbar pr-1">
              {activityFeed.map((event) => {
                const getEventIcon = (type: AuditActivityEvent["type"]) => {
                  switch (type) {
                    case "upload":
                      return <FileUp className="w-3.5 h-3.5 text-[#1F5946]" />;
                    case "signoff":
                      return (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#8A5A18]" />
                      );
                    case "pbc":
                      return <Inbox className="w-3.5 h-3.5 text-[#1D526D]" />;
                    case "timesheet":
                      return <Clock className="w-3.5 h-3.5 text-[#C58A3E]" />;
                    case "stage_change":
                      return <Layers className="w-3.5 h-3.5 text-[#113227]" />;
                    default:
                      return (
                        <CircleDot className="w-3.5 h-3.5 text-[#7A8782]" />
                      );
                  }
                };

                return (
                  <div
                    key={event.id}
                    className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D9] text-left hover:bg-white hover:border-[#D5CBBC] transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center space-x-1.5 font-bold text-[#1C1F1E]">
                        {getEventIcon(event.type)}
                        <span>{event.title}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8A9691] shrink-0">
                        {event.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-[#525E58] leading-relaxed">
                      {event.description}
                    </p>

                    <div className="pt-1 flex items-center justify-between text-[10px] text-[#7A8782]">
                      <span>
                        By:{" "}
                        <strong className="text-[#333]">{event.actor}</strong>{" "}
                        {event.actorRole && `(${event.actorRole})`}
                      </span>
                      {event.ref && (
                        <span className="font-mono font-bold text-[#C58A3E] bg-white px-1.5 py-0.2 rounded border border-[#E5DDD0]">
                          {event.ref}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-xs text-[#7A8782]">
            <span>Audit trail locked with immutable logs</span>
            <button
              onClick={() => onNavigateTab("reviews")}
              className="text-xs font-bold text-[#113227] hover:underline"
            >
              Review Board →
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: NEW ENGAGEMENT CREATION MODAL */}
      {/* ========================================================================= */}
      {isNewEngagementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5DDD0] shadow-2xl p-6 sm:p-7 max-w-lg w-full text-left space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1C1F1E]">
                  Create New Client Engagement
                </h3>
                <p className="text-xs text-[#7A8782]">
                  Set up audit, tax, or advisory engagement under ISA 300
                  planning.
                </p>
              </div>
              <button
                onClick={() => setIsNewEngagementModalOpen(false)}
                className="p-2 rounded-xl text-[#7A8782] hover:bg-[#FAF7F2] hover:text-[#1C1F1E] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateEngagementSubmit}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#1C1F1E] mb-1">
                  Client Organization *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Apex Footwear & Polymer Ltd."
                  value={newEngClient}
                  onChange={(e) => setNewEngClient(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Service Type
                  </label>
                  <select
                    value={newEngService}
                    onChange={(e) =>
                      setNewEngService(
                        e.target.value as EngagementRecord["serviceType"],
                      )
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="Statutory Audit">
                      Statutory Audit (ISA)
                    </option>
                    <option value="Tax Compliance">
                      Corporate Tax Compliance
                    </option>
                    <option value="VAT Assessment">
                      VAT Assessment &amp; Mushak
                    </option>
                    <option value="Special Advisory">Special Advisory</option>
                    <option value="Transfer Pricing">
                      Transfer Pricing Study
                    </option>
                    <option value="Due Diligence">Due Diligence Review</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Budget Hours
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={newEngBudget}
                    onChange={(e) => setNewEngBudget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Lead Manager
                  </label>
                  <select
                    value={newEngManager}
                    onChange={(e) => setNewEngManager(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="Zahirul Islam, FCA">
                      Zahirul Islam, FCA
                    </option>
                    <option value="Mahmudur Rahman, ACA">
                      Mahmudur Rahman, ACA
                    </option>
                    <option value="Nadia Sharmin, ACCA">
                      Nadia Sharmin, ACCA
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Engagement Partner
                  </label>
                  <select
                    value={newEngPartner}
                    onChange={(e) => setNewEngPartner(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="Fouzia Haque, FCA">Fouzia Haque, FCA</option>
                    <option value="Zahirul Islam, FCA">
                      Zahirul Islam, FCA
                    </option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1C1F1E] mb-1">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={newEngDueDate}
                  onChange={(e) => setNewEngDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewEngagementModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5CBBC] text-[#66706B] hover:bg-[#FAF7F2] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-forest px-5 py-2 rounded-xl font-bold flex items-center space-x-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C58A3E]" />
                  <span>Create Engagement</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: LOG TIME QUICK MODAL */}
      {/* ========================================================================= */}
      {isLogTimeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5DDD0] shadow-2xl p-6 sm:p-7 max-w-lg w-full text-left space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1C1F1E]">
                  Log Billable Working Hours
                </h3>
                <p className="text-xs text-[#7A8782]">
                  Record audit procedures and partner review hours for billing
                  reconciliation.
                </p>
              </div>
              <button
                onClick={() => setIsLogTimeModalOpen(false)}
                className="p-2 rounded-xl text-[#7A8782] hover:bg-[#FAF7F2] hover:text-[#1C1F1E] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLogTimeSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-[#1C1F1E] mb-1">
                  Engagement Job *
                </label>
                <select
                  value={logTimeCode}
                  onChange={(e) => {
                    const selected = engagements.find(
                      (eng) => eng.engagementCode === e.target.value,
                    );
                    setLogTimeCode(e.target.value);
                    if (selected) setLogTimeClient(selected.clientName);
                  }}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                >
                  {engagements.map((eng) => (
                    <option key={eng.id} value={eng.engagementCode}>
                      {eng.engagementCode} - {eng.clientName} ({eng.serviceType}
                      )
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Hours Spent *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="24"
                    required
                    value={logTimeHours}
                    onChange={(e) => setLogTimeHours(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>

                <div className="flex flex-col justify-center pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={logTimeBillable}
                      onChange={(e) => setLogTimeBillable(e.target.checked)}
                      className="w-4 h-4 rounded border-[#D5CBBC] text-[#113227] focus:ring-[#113227]"
                    />
                    <span className="font-bold text-[#1C1F1E]">
                      Billable to Client
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1C1F1E] mb-1">
                  Procedure &amp; Work Description *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Substantive verification of plant additions, vouching customs declarations and bank payment advices."
                  value={logTimeDesc}
                  onChange={(e) => setLogTimeDesc(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsLogTimeModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5CBBC] text-[#66706B] hover:bg-[#FAF7F2] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-forest px-5 py-2 rounded-xl font-bold flex items-center space-x-1.5 shadow-2xs"
                >
                  <Clock className="w-3.5 h-3.5 text-[#C58A3E]" />
                  <span>Log Time Entry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: UPLOAD WORKING PAPER MODAL */}
      {/* ========================================================================= */}
      {isUploadWpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5DDD0] shadow-2xl p-6 sm:p-7 max-w-lg w-full text-left space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1C1F1E]">
                  Upload &amp; Hash Working Paper
                </h3>
                <p className="text-xs text-[#7A8782]">
                  Registers tamper-evident digital hashes in vault according to
                  ISA 230.
                </p>
              </div>
              <button
                onClick={() => setIsUploadWpModalOpen(false)}
                className="p-2 rounded-xl text-[#7A8782] hover:bg-[#FAF7F2] hover:text-[#1C1F1E] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadWpSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    WP Ref (Index) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B-250"
                    value={wpRefCode}
                    onChange={(e) => setWpRefCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs font-mono text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Client Name *
                  </label>
                  <select
                    value={wpClient}
                    onChange={(e) => setWpClient(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    {engagements.map((eng) => (
                      <option key={eng.id} value={eng.clientName}>
                        {eng.clientName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1C1F1E] mb-1">
                  Working Paper Title &amp; ISA Standard *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fixed Assets Roll-forward & Physical Verification (ISA 500)"
                  value={wpTitle}
                  onChange={(e) => setWpTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              {/* Drag & Drop File Upload Area */}
              <div>
                <label className="block font-bold text-[#1C1F1E] mb-1">
                  Attach Excel / PDF Working Paper
                </label>
                <label className="flex flex-col items-center justify-center p-5 rounded-2xl border-2 border-dashed border-[#D5CBBC] bg-[#FAF8F5] hover:bg-[#F2ECE1] transition-colors cursor-pointer text-center">
                  <FileUp className="w-7 h-7 text-[#113227] mb-1.5" />
                  <span className="font-bold text-[#1C1F1E] text-xs">
                    {wpFileName
                      ? wpFileName
                      : "Click to select or drag working paper here"}
                  </span>
                  <span className="text-[10px] text-[#7A8782] mt-0.5">
                    Supports .xlsx, .pdf, .docx (Max 25MB, auto-hashed with
                    SHA-256)
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setWpFileName(e.target.files[0].name);
                      }
                    }}
                  />
                </label>
              </div>

              <div className="p-3 rounded-xl bg-[#E1F3EE] border border-[#C5E8DC] flex items-center space-x-2 text-[11px] text-[#1F5946]">
                <ShieldCheck className="w-4 h-4 shrink-0 text-[#C58A3E]" />
                <span>
                  Working paper will be digitally stamped and indexed for
                  manager sign-off.
                </span>
              </div>

              <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsUploadWpModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5CBBC] text-[#66706B] hover:bg-[#FAF7F2] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-forest px-5 py-2 rounded-xl font-bold flex items-center space-x-1.5 shadow-2xs"
                >
                  <FileUp className="w-3.5 h-3.5 text-[#C58A3E]" />
                  <span>Register &amp; Upload WP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: ADD URGENT TASK QUICK MODAL */}
      {/* ========================================================================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5DDD0] shadow-2xl p-6 sm:p-7 max-w-lg w-full text-left space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1C1F1E]">
                  Create Urgent Action Item
                </h3>
                <p className="text-xs text-[#7A8782]">
                  Add priority audit deadline or client deliverable.
                </p>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(false)}
                className="p-2 rounded-xl text-[#7A8782] hover:bg-[#FAF7F2] hover:text-[#1C1F1E] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleQuickTaskSubmit}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#1C1F1E] mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Verify Fixed Asset Physical Counts with Plant Manager"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Client Organization
                  </label>
                  <select
                    value={taskClient}
                    onChange={(e) => setTaskClient(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    {engagements.map((eng) => (
                      <option key={eng.id} value={eng.clientName}>
                        {eng.clientName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Priority Level
                  </label>
                  <select
                    value={taskPriority}
                    onChange={(e) =>
                      setTaskPriority(e.target.value as TaskRecord["priority"])
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="Urgent">Urgent (Red)</option>
                    <option value="High">High Priority (Amber)</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Normal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1C1F1E] mb-1">
                  Target Due Date
                </label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#D5CBBC] text-[#66706B] hover:bg-[#FAF7F2] font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-forest px-5 py-2 rounded-xl font-bold flex items-center space-x-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#C58A3E]" />
                  <span>Add Action Item</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: ENGAGEMENT DETAILS QUICK DRAWER / MODAL */}
      {/* ========================================================================= */}
      {selectedEngagementDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5DDD0] shadow-2xl p-6 sm:p-7 max-w-xl w-full text-left space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-mono font-bold text-[#113227] bg-[#E1F3EE] px-2 py-0.8 rounded-lg">
                  {selectedEngagementDetail.engagementCode}
                </span>
                <div>
                  <h3 className="text-lg font-serif font-bold text-[#1C1F1E]">
                    {selectedEngagementDetail.clientName}
                  </h3>
                  <p className="text-xs text-[#7A8782]">
                    {selectedEngagementDetail.serviceType} • Due{" "}
                    {selectedEngagementDetail.dueDate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEngagementDetail(null)}
                className="p-2 rounded-xl text-[#7A8782] hover:bg-[#FAF7F2] hover:text-[#1C1F1E] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Metrics row */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D9]">
                <div>
                  <span className="text-[10px] text-[#7A8782] block">
                    Current Stage
                  </span>
                  <span className="font-bold text-[#113227] text-sm">
                    {selectedEngagementDetail.stage}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A8782] block">
                    Health Status
                  </span>
                  <span className="font-bold text-[#8A5A18] text-sm">
                    {selectedEngagementDetail.health || "On Track"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#7A8782] block">
                    Hours Logged
                  </span>
                  <span className="font-bold text-[#1C1F1E] text-sm">
                    {selectedEngagementDetail.loggedHours} /{" "}
                    {selectedEngagementDetail.budgetHours}h
                  </span>
                </div>
              </div>

              {/* Team staffing */}
              <div>
                <h4 className="font-bold text-[#1C1F1E] mb-1.5">
                  Engagement Leadership &amp; Team
                </h4>
                <div className="space-y-1.5 text-[11px] text-[#55605B] bg-[#FAF7F2] p-3 rounded-xl border border-[#EBE5DA]">
                  <p>
                    <strong>Lead Partner:</strong>{" "}
                    {selectedEngagementDetail.leadPartner}
                  </p>
                  <p>
                    <strong>Lead Manager:</strong>{" "}
                    {selectedEngagementDetail.leadManager}
                  </p>
                  <p>
                    <strong>Assigned Team:</strong>{" "}
                    {selectedEngagementDetail.teamMembers?.join(", ") ||
                      "Nadia Sharmin, Sabbir Ahmed"}
                  </p>
                </div>
              </div>

              {/* Progress Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-[#1C1F1E] mb-1">
                  <span>Overall Milestone Completion</span>
                  <span>{selectedEngagementDetail.progressPercent}%</span>
                </div>
                <div className="w-full bg-[#EAE3D5] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#113227] h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${selectedEngagementDetail.progressPercent}%`,
                    }}
                  />
                </div>
              </div>

              {/* Actions in details */}
              <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedEngagementDetail(null);
                    onNavigateTab("engagements");
                  }}
                  className="text-xs font-bold text-[#113227] hover:underline flex items-center space-x-1"
                >
                  <span>Open in Full Engagements Workspace</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedEngagementDetail(null)}
                  className="btn-forest px-4 py-2 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
