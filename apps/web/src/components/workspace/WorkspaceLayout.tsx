import React, { useState } from "react";
import { ViewTransition } from "../motion/MotionPrimitives";
import { WorkspaceSidebar } from "./WorkspaceSidebar";
import { WorkspaceTopbar } from "./WorkspaceTopbar";
import { DashboardView } from "./DashboardView";
import { PeopleStudentsView } from "./PeopleStudentsView";
import { CrmEngagementsView } from "./CrmEngagementsView";
import { TasksTimesheetsView } from "./TasksTimesheetsView";
import { AuditReviewDocsView } from "./AuditReviewDocsView";
import { FinanceBillingView } from "./FinanceBillingView";
import { SettingsView } from "./SettingsView";
import { AiAssistantDrawer } from "./AiAssistantDrawer";
import { CommandPaletteModal } from "./CommandPaletteModal";

import {
  WorkspaceTab,
  UserSession,
  StaffMember,
  StudentArticle,
  ClientRecord,
  EngagementRecord,
  TaskRecord,
  TimesheetEntry,
  WeeklyTimesheetRow,
  StaffWorkloadCapacity,
  DocumentVaultItem,
  WorkingPaper,
  SignOffItem,
  ClientRequestItem,
  InvoiceRecord,
  ExpenseRecord,
  CollectionRecord,
  FirmProfile,
  UserSessionRecord,
  SecurityEventLog,
  SignOffChecklist,
  ReviewNote,
  DigitalSignatureSeal,
} from "../../types";

import {
  CURRENT_USER,
  AVAILABLE_TENANTS,
  INITIAL_STAFF,
  INITIAL_STUDENTS,
  INITIAL_CLIENTS,
  INITIAL_ENGAGEMENTS,
  INITIAL_TASKS,
  INITIAL_TIMESHEETS,
  INITIAL_WEEKLY_TIMESHEETS,
  INITIAL_RESOURCE_CAPACITY,
  INITIAL_DOCUMENTS,
  INITIAL_WORKING_PAPERS,
  INITIAL_SIGNOFFS,
  INITIAL_REQUESTS,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_COLLECTIONS,
  INITIAL_FIRM_PROFILE,
  INITIAL_USER_SESSIONS,
  INITIAL_SECURITY_LOGS,
} from "../../data/workspaceData";

interface WorkspaceLayoutProps {
  initialTab?: WorkspaceTab;
  onSignOut: () => void;
  showToast: (message: string, type?: "success" | "info") => void;
}

export const WorkspaceLayout: React.FC<WorkspaceLayoutProps> = ({
  initialTab = "dashboard",
  onSignOut,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>(initialTab);
  const [currentUser, setCurrentUser] = useState<UserSession>(CURRENT_USER);
  const [availableTenants, setAvailableTenants] = useState(AVAILABLE_TENANTS);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Core Data States
  const [staffList, setStaffList] = useState<StaffMember[]>(INITIAL_STAFF);
  const [studentList, setStudentList] =
    useState<StudentArticle[]>(INITIAL_STUDENTS);
  const [clients, setClients] = useState<ClientRecord[]>(INITIAL_CLIENTS);
  const [engagements, setEngagements] =
    useState<EngagementRecord[]>(INITIAL_ENGAGEMENTS);
  const [tasks, setTasks] = useState<TaskRecord[]>(INITIAL_TASKS);
  const [timesheets, setTimesheets] =
    useState<TimesheetEntry[]>(INITIAL_TIMESHEETS);
  const [weeklyTimesheets, setWeeklyTimesheets] = useState<
    WeeklyTimesheetRow[]
  >(INITIAL_WEEKLY_TIMESHEETS);
  const [resourceCapacities, setResourceCapacities] = useState<
    StaffWorkloadCapacity[]
  >(INITIAL_RESOURCE_CAPACITY);
  const [documents, setDocuments] =
    useState<DocumentVaultItem[]>(INITIAL_DOCUMENTS);
  const [workingPapers, setWorkingPapers] = useState<WorkingPaper[]>(
    INITIAL_WORKING_PAPERS,
  );
  const [signoffs, setSignoffs] = useState<SignOffItem[]>(INITIAL_SIGNOFFS);
  const [clientRequests, setClientRequests] =
    useState<ClientRequestItem[]>(INITIAL_REQUESTS);
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(INITIAL_EXPENSES);
  const [collections, setCollections] =
    useState<CollectionRecord[]>(INITIAL_COLLECTIONS);
  const [firmProfile, setFirmProfile] =
    useState<FirmProfile>(INITIAL_FIRM_PROFILE);
  const [userSessions, setUserSessions] = useState<UserSessionRecord[]>(
    INITIAL_USER_SESSIONS,
  );
  const [securityLogs, setSecurityLogs] = useState<SecurityEventLog[]>(
    INITIAL_SECURITY_LOGS,
  );

  // Handlers
  const handleSwitchTenant = (tenantName: string) => {
    setCurrentUser((prev) => ({ ...prev, tenant: tenantName }));
    setFirmProfile((prev) => ({ ...prev, firmName: tenantName }));
    showToast(`Switched active practice to "${tenantName}"`, "info");
  };

  const handleAddNewTenant = (newTenant: {
    id: string;
    name: string;
    location: string;
    activeEngagements: number;
  }) => {
    setAvailableTenants((prev) => [...prev, newTenant]);
    showToast(`Registered new practice entity "${newTenant.name}"`, "success");
  };

  const handleQuickSignOff = (signoffId: string) => {
    const defaultChecklist: SignOffChecklist = {
      standardsCompliance: true,
      sufficientEvidence: true,
      analyticalReviewCompleted: true,
      samplingReconciled: true,
      subsequentEventsEvaluated: true,
    };
    handleApproveAndSignOff(
      signoffId,
      defaultChecklist,
      "Partner",
      "Quick partner sign-off authorized under ISA 220.",
    );
  };

  const handleApproveAndSignOff = (
    signoffId: string,
    checklist: SignOffChecklist,
    roleLevel: "Manager" | "Partner" | "EQCR",
    signerComment: string,
  ) => {
    const timestamp =
      new Date().toLocaleString("en-US", {
        timeZone: "Asia/Dhaka",
        dateStyle: "medium",
        timeStyle: "short",
      }) + " BST";

    const sigRandom = Math.random().toString(16).substring(2, 7).toUpperCase();
    const signatureId = `AVQ-SIG-${sigRandom}-${roleLevel === "Partner" ? "PTR" : roleLevel === "EQCR" ? "EQCR" : "MGR"}-2026`;

    const newSeal: DigitalSignatureSeal = {
      signerName:
        roleLevel === "Partner" ? "Fouzia Haque, FCA" : "Zahirul Islam, FCA",
      signerDesignation:
        roleLevel === "Partner"
          ? "Senior Engagement Partner & EQCR Fellow"
          : "Engagement Audit Manager",
      icabRegNo: roleLevel === "Partner" ? "ICAB-FCA-1024" : "ICAB-ACA-1894",
      timestamp,
      signatureId,
      hashProof: `sha256:${Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      certificateRef: `ICAB-CERT-2026-AVQ-${roleLevel === "Partner" ? "PTR-0099" : "MGR-0012"}`,
      status:
        roleLevel === "Partner" || roleLevel === "EQCR"
          ? "Certified Signed-off"
          : "Manager Approved",
    };

    setSignoffs((prev) =>
      prev.map((s) => {
        if (s.id !== signoffId) return s;
        return {
          ...s,
          status:
            roleLevel === "Manager" && s.roleRequired === "Partner Sign-off"
              ? "Pending"
              : "Signed",
          checklist,
          notes: signerComment
            ? `${s.notes || ""} | Signer Note: ${signerComment}`
            : s.notes,
          managerSeal: roleLevel === "Manager" ? newSeal : s.managerSeal,
          partnerSeal:
            roleLevel === "Partner" || roleLevel === "EQCR"
              ? newSeal
              : s.partnerSeal,
        };
      }),
    );

    // Also lock corresponding working paper if exists
    const matchingSignoff = signoffs.find((s) => s.id === signoffId);
    if (matchingSignoff?.workingPaperId) {
      handleUpdateWorkingPaper(matchingSignoff.workingPaperId, {
        isLocked: true,
        status:
          roleLevel === "Partner" ? "Partner Signed-off" : "Manager Approved",
      });
    }

    showToast(
      `Cryptographic sign-off seal [${signatureId}] executed and locked.`,
      "success",
    );
  };

  const handleRejectWithReviewNote = (
    signoffId: string,
    reason: string,
    targetSection: string,
  ) => {
    const newNote: ReviewNote = {
      id: `rn-${Date.now()}`,
      sectionRef: targetSection,
      content: reason,
      severity: "High",
      author: "Zahirul Islam, FCA",
      authorRole: "Audit Manager",
      timestamp: "Just now",
      status: "Open",
      replies: [],
    };

    setSignoffs((prev) =>
      prev.map((s) => {
        if (s.id !== signoffId) return s;
        return {
          ...s,
          status: "Rejected",
          reviewNotes: [newNote, ...(s.reviewNotes || [])],
        };
      }),
    );

    showToast(
      `Working paper rejected with review note logged on "${targetSection}".`,
      "error",
    );
  };

  const handleRequestClarification = (signoffId: string, message: string) => {
    const newNote: ReviewNote = {
      id: `rn-${Date.now()}`,
      sectionRef: "General Review Observation",
      content: `Clarification Requested: ${message}`,
      severity: "Medium",
      author: "Zahirul Islam, FCA",
      authorRole: "Audit Manager",
      timestamp: "Just now",
      status: "Open",
      replies: [],
    };

    setSignoffs((prev) =>
      prev.map((s) => {
        if (s.id !== signoffId) return s;
        return {
          ...s,
          status: "Clarification Requested",
          reviewNotes: [newNote, ...(s.reviewNotes || [])],
        };
      }),
    );

    showToast("Clarification request dispatched to preparer.", "info");
  };

  const handleAddReviewNote = (
    signoffId: string,
    note: Omit<ReviewNote, "id" | "timestamp" | "status">,
  ) => {
    const created: ReviewNote = {
      ...note,
      id: `rn-${Date.now()}`,
      timestamp: "Just now",
      status: "Open",
      replies: [],
    };

    setSignoffs((prev) =>
      prev.map((s) => {
        if (s.id !== signoffId) return s;
        return {
          ...s,
          reviewNotes: [created, ...(s.reviewNotes || [])],
        };
      }),
    );

    showToast(`Review query posted on ${created.sectionRef}.`, "info");
  };

  const handleReplyReviewNote = (
    signoffId: string,
    noteId: string,
    replyContent: string,
  ) => {
    const reply = {
      id: `rnr-${Date.now()}`,
      author: "Sabbir Ahmed (Art)",
      role: "Articled Student",
      timestamp: "Just now",
      content: replyContent,
    };

    setSignoffs((prev) =>
      prev.map((s) => {
        if (s.id !== signoffId) return s;
        return {
          ...s,
          reviewNotes: (s.reviewNotes || []).map((rn) => {
            if (rn.id !== noteId) return rn;
            return {
              ...rn,
              status: rn.status === "Open" ? "Addressed" : rn.status,
              replies: [...(rn.replies || []), reply],
            };
          }),
        };
      }),
    );

    showToast("Response recorded in review note thread.", "success");
  };

  const handleUpdateNoteStatus = (
    signoffId: string,
    noteId: string,
    status: ReviewNote["status"],
  ) => {
    setSignoffs((prev) =>
      prev.map((s) => {
        if (s.id !== signoffId) return s;
        return {
          ...s,
          reviewNotes: (s.reviewNotes || []).map((rn) =>
            rn.id === noteId ? { ...rn, status } : rn,
          ),
        };
      }),
    );
    showToast(`Review note marked as "${status}".`, "info");
  };

  const handleCreateClientRequest = (
    request: Omit<ClientRequestItem, "id" | "ticketNo" | "requestedDate">,
  ) => {
    const randomTicket = Math.floor(100 + Math.random() * 900);
    const created: ClientRequestItem = {
      ...request,
      id: `req-${Date.now()}`,
      ticketNo: `PBC-2026-${randomTicket}`,
      requestedDate: new Date().toISOString().split("T")[0],
      status: request.status || "Requested",
    };

    setClientRequests((prev) => [created, ...prev]);
    showToast(
      `PBC Ticket ${created.ticketNo} created and dispatched to ${created.clientName}.`,
      "success",
    );
  };

  const handleToggleFileReceived = (
    requestId: string,
    fileId: string,
    received: boolean,
  ) => {
    setClientRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        const updatedFiles = (req.fileRequirements || []).map((fr) => {
          if (fr.id !== fileId) return fr;
          return {
            ...fr,
            received,
            receivedDate: received
              ? new Date().toISOString().split("T")[0]
              : undefined,
            fileHash: received
              ? `sha256:${Array.from({ length: 12 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
              : undefined,
          };
        });

        const allMandatoryReceived = updatedFiles
          .filter((f) => f.mandatory)
          .every((f) => f.received);
        const anyReceived = updatedFiles.some((f) => f.received);

        let newStatus = req.status;
        if (allMandatoryReceived) {
          newStatus = "Under Verification";
        } else if (anyReceived) {
          newStatus = "Partially Received";
        }

        return {
          ...req,
          fileRequirements: updatedFiles,
          status: newStatus,
        };
      }),
    );
    showToast(
      received
        ? "Deliverable marked as received & verified."
        : "Deliverable marked as pending.",
      "info",
    );
  };

  const handleSendInstantReminder = (requestId: string) => {
    setClientRequests((prev) =>
      prev.map((req) => {
        if (req.id !== requestId) return req;
        return {
          ...req,
          remindersCount: (req.remindersCount || 0) + 1,
          lastReminderSent: new Date().toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
        };
      }),
    );
    const target = clientRequests.find((r) => r.id === requestId);
    showToast(
      `Automated escalation reminder dispatched to ${target?.targetContact?.email || target?.clientName}.`,
      "success",
    );
  };

  const handleAddStaff = (member: Partial<StaffMember>) => {
    const created: StaffMember = {
      id: `staff-${Date.now()}`,
      name: member.name || "New Staff",
      email: member.email || "staff@famesandr.com",
      phone: member.phone || "+880 1700-000000",
      designation: member.designation || "Senior Associate",
      department: member.department || "Audit & Assurance",
      role: member.role || "Senior Associate",
      status: member.status || "Active",
      activeEngagementsCount: member.activeEngagementsCount || 1,
      billableUtilization: member.billableUtilization || 85,
      hourlyRate: member.hourlyRate || 4500,
      assignedTeams: member.assignedTeams || ["Core Audit Alpha"],
      permissions: member.permissions || ["Working Paper Drafting"],
      activityLogs: member.activityLogs || [
        {
          id: `log-${Date.now()}`,
          action: "Staff Onboarded",
          timestamp: "Just now",
          details: "Registered in firm practice directory.",
        },
      ],
    };
    setStaffList((prev) => [created, ...prev]);
    showToast(`Added ${created.name} to firm staff directory.`, "success");
  };

  const handleUpdateStaff = (
    staffId: string,
    updatedData: Partial<StaffMember>,
  ) => {
    setStaffList((prev) =>
      prev.map((s) => (s.id === staffId ? { ...s, ...updatedData } : s)),
    );
    showToast("Staff profile & permissions updated successfully.", "success");
  };

  const handleAddStudent = (student: Partial<StudentArticle>) => {
    const created: StudentArticle = {
      id: `art-${Date.now()}`,
      registrationNo:
        student.registrationNo || `REG-${Date.now().toString().slice(-4)}`,
      name: student.name || "New Trainee",
      email: student.email || "trainee@famesandr.com",
      phone: student.phone || "+880 1700-000000",
      batch: student.batch || "Batch 2026-A",
      icabRegNo: student.icabRegNo || "ICAB-ART-22000",
      joiningDate: student.joiningDate || "2026-08-01",
      completionDate: student.completionDate || "2029-07-31",
      principalMentor: student.principalMentor || "Zahirul Islam, FCA",
      examLevel: student.examLevel || "Knowledge Level",
      examLeaveStatus: student.examLeaveStatus || "None",
      stipendStatus: student.stipendStatus || "Paid",
      stipendAmount: student.stipendAmount || 10000,
      leaveBalanceDays: student.leaveBalanceDays || 20,
      workingDaysLogged: student.workingDaysLogged || 10,
      assignedEngagements: student.assignedEngagements || [
        "General Practice Support",
      ],
    };
    setStudentList((prev) => [created, ...prev]);
    showToast(`Registered CA Articleship trainee ${created.name}.`, "success");
  };

  const handleUpdateStudent = (
    studentId: string,
    updatedData: Partial<StudentArticle>,
  ) => {
    setStudentList((prev) =>
      prev.map((st) => (st.id === studentId ? { ...st, ...updatedData } : st)),
    );
    showToast("Articleship student record updated.", "success");
  };

  const handleAddClient = (cli: Partial<ClientRecord>) => {
    const created: ClientRecord = {
      id: `cli-${Date.now()}`,
      clientCode: cli.clientCode || `CLI-${Date.now().toString().slice(-3)}`,
      name: cli.name || "New Client",
      industry: cli.industry || "Commercial",
      contactPerson: cli.contactPerson || "Managing Director",
      email: cli.email || "info@client.com",
      phone: cli.phone || "+880 2 000000",
      taxId: cli.taxId || "TIN-0000000000",
      relationshipPartner: cli.relationshipPartner || "Fouzia Haque, FCA",
      annualFee: cli.annualFee || 500000,
      status: "Active",
      activeEngagements: 1,
      riskRating: cli.riskRating || "Low",
    };
    setClients((prev) => [created, ...prev]);
    showToast(`Client ${created.name} onboarded successfully.`, "success");
  };

  const handleAddEngagement = (eng: Partial<EngagementRecord>) => {
    const created: EngagementRecord = {
      id: `eng-${Date.now()}`,
      engagementCode:
        eng.engagementCode || `AUD-2026-${Date.now().toString().slice(-3)}`,
      clientName: eng.clientName || "Apex Footwear",
      serviceType: eng.serviceType || "Statutory Audit",
      stage: eng.stage || "Planning",
      leadManager: eng.leadManager || "Zahirul Islam, FCA",
      leadPartner: eng.leadPartner || "Fouzia Haque, FCA",
      teamMembers: eng.teamMembers || ["Nadia Sharmin, ACCA"],
      dueDate: eng.dueDate || "2026-10-31",
      progressPercent: eng.progressPercent || 10,
      budgetHours: eng.budgetHours || 150,
      loggedHours: eng.loggedHours || 0,
      statusColor: "#113227",
    };
    setEngagements((prev) => [created, ...prev]);
    showToast(`Engagement ${created.engagementCode} initiated.`, "success");
  };

  const handleUpdateEngagementStage = (
    engagementId: string,
    stage: EngagementRecord["stage"],
  ) => {
    setEngagements((prev) =>
      prev.map((e) => (e.id === engagementId ? { ...e, stage } : e)),
    );
    showToast("Engagement stage updated.", "info");
  };

  const handleAddTask = (t: Partial<TaskRecord>) => {
    const created: TaskRecord = {
      id: `tsk-${Date.now()}`,
      title: t.title || "New Task",
      clientName: t.clientName || "General",
      engagementCode: t.engagementCode || "AUD-2026-081",
      assignedTo: t.assignedTo || "Zahirul Islam, FCA",
      priority: t.priority || "Medium",
      status: t.status || "Todo",
      dueDate: t.dueDate || "2026-09-15",
      estimatedHours: t.estimatedHours || 4,
      category: t.category || "Field Audit",
      subtasks: t.subtasks || [],
    };
    setTasks((prev) => [created, ...prev]);
    showToast(`Operational task "${created.title}" dispatched.`, "success");
  };

  const handleAddTimesheet = (ts: Partial<TimesheetEntry>) => {
    const created: TimesheetEntry = {
      id: `ts-${Date.now()}`,
      date: ts.date || new Date().toISOString().split("T")[0],
      staffName: ts.staffName || "Zahirul Islam, FCA",
      clientName: ts.clientName || "Apex Footwear",
      engagementCode: ts.engagementCode || "AUD-2026-081",
      taskDescription: ts.taskDescription || "Audit work",
      hours: ts.hours || 1,
      billable: ts.billable !== undefined ? ts.billable : true,
      status: ts.status || "Submitted",
    };
    setTimesheets((prev) => [created, ...prev]);
    showToast(`Logged ${created.hours} billable hours.`, "success");
  };

  const handleUpdateTaskStatus = (
    taskId: string,
    status: TaskRecord["status"],
  ) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
    );
  };

  const handleAddDocument = (doc: Partial<DocumentVaultItem>) => {
    const created: DocumentVaultItem = {
      id: `doc-${Date.now()}`,
      fileName: doc.fileName || "Document.pdf",
      clientName: doc.clientName || "General",
      category: doc.category || "Trial Balance",
      fileSize: doc.fileSize || "1.5 MB",
      uploadedBy: doc.uploadedBy || "Zahirul Islam, FCA",
      uploadedAt: doc.uploadedAt || new Date().toISOString().split("T")[0],
      hash: doc.hash || "sha256:generated",
      version: "v1.0 (Encrypted)",
      isLocked: true,
    };
    setDocuments((prev) => [created, ...prev]);
    showToast(
      `File ${created.fileName} encrypted and stored in vault.`,
      "success",
    );
  };

  const handleAddWorkingPaper = (wp: Partial<WorkingPaper>) => {
    const created: WorkingPaper = {
      id: `wp-${Date.now()}`,
      wpRef: wp.wpRef || "WP-100",
      clientName: wp.clientName || "Apex Footwear & Polymer Ltd.",
      engagementCode: wp.engagementCode || "AUD-2026-081",
      financialYear: wp.financialYear || "FY 2025-26",
      title: wp.title || "Substantive Schedule",
      objective:
        wp.objective || "Audit substantive testing and assertion verification.",
      scope: wp.scope || "Standard audit scope.",
      preparedBy: wp.preparedBy || "Zahirul Islam, FCA",
      preparedDate: wp.preparedDate || new Date().toISOString().split("T")[0],
      status: wp.status || "Ready for Review",
      version: wp.version || "v1.0",
      fileHash:
        wp.fileHash ||
        `SHA-256: ${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      isLocked: wp.isLocked || false,
      findingsCount: wp.findingsCount || 0,
      checklistComplete: wp.checklistComplete || false,
      procedures: wp.procedures || [],
      evidenceFiles: wp.evidenceFiles || [],
      revisions: wp.revisions || [],
    };
    setWorkingPapers((prev) => [created, ...prev]);
    showToast(
      `Working paper ${created.wpRef} registered with digital hash.`,
      "success",
    );
  };

  const handleUpdateWorkingPaper = (
    wpId: string,
    updated: Partial<WorkingPaper>,
  ) => {
    setWorkingPapers((prev) =>
      prev.map((w) => (w.id === wpId ? { ...w, ...updated } : w)),
    );
  };

  const handleUpdateClientRequestStatus = (
    reqId: string,
    status: ClientRequestItem["status"],
  ) => {
    setClientRequests((prev) =>
      prev.map((r) => (r.id === reqId ? { ...r, status } : r)),
    );
    showToast("PBC request status synchronized.", "info");
  };

  const handleAddInvoice = (inv: Partial<InvoiceRecord>) => {
    const created: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoiceNo: inv.invoiceNo || `INV-2026-${Date.now().toString().slice(-3)}`,
      clientName: inv.clientName || "Client",
      engagementRef: inv.engagementRef,
      service: inv.service || "Statutory Audit FY25",
      billingBasis: inv.billingBasis || "Fixed Milestone",
      lineItems: inv.lineItems || [],
      amount: inv.amount || 200000,
      vatRate: inv.vatRate !== undefined ? inv.vatRate : 15,
      vatAmount: inv.vatAmount || 30000,
      totalAmount: inv.totalAmount || 230000,
      issueDate: inv.issueDate || new Date().toISOString().split("T")[0],
      dueDate: inv.dueDate || "2026-09-30",
      status: inv.status || "Sent",
      notes: inv.notes,
    };
    setInvoices((prev) => [created, ...prev]);

    // Log security audit event for invoice creation
    const newLog: SecurityEventLog = {
      id: `sec-${Date.now()}`,
      timestamp:
        new Date().toLocaleTimeString("en-US", { hour12: false }) + " BST",
      eventType: "EXPORT_LEDGER",
      severity: "Info",
      actor: currentUser.name,
      actorRole: currentUser.role,
      ipAddress: "103.205.71.42",
      resourceRef: created.invoiceNo,
      actionSummary: `Dispatched client fee tax invoice ${created.invoiceNo} for ${created.clientName} (BDT ${created.totalAmount.toLocaleString()})`,
      status: "Logged & Certified",
    };
    setSecurityLogs((prev) => [newLog, ...prev]);

    showToast(
      `Invoice ${created.invoiceNo} issued to ${created.clientName}.`,
      "success",
    );
  };

  const handleRecordPayment = (pay: Partial<CollectionRecord>) => {
    const created: CollectionRecord = {
      id: `col-${Date.now()}`,
      receiptNo:
        pay.receiptNo || `MR-2026-${Math.floor(100 + Math.random() * 900)}`,
      invoiceId: pay.invoiceId || "",
      invoiceNo: pay.invoiceNo || "",
      clientName: pay.clientName || "",
      paymentDate: pay.paymentDate || new Date().toISOString().split("T")[0],
      amount: pay.amount || 0,
      paymentMethod: pay.paymentMethod || "Bank BEFTN",
      bankRef: pay.bankRef || "EBL-REM-001",
      depositedAccount:
        pay.depositedAccount ||
        "Eastern Bank Ltd - Principal Practice Account #104102948",
      status: "Cleared & Credited",
      receivedBy: currentUser.name,
      remarks: pay.remarks,
    };

    setCollections((prev) => [created, ...prev]);

    // Automatically mark the matching invoice as Paid
    if (created.invoiceId) {
      setInvoices((prev) =>
        prev.map((inv) =>
          inv.id === created.invoiceId ? { ...inv, status: "Paid" } : inv,
        ),
      );
    }

    // Log security event for payment receipt
    const newLog: SecurityEventLog = {
      id: `sec-${Date.now()}`,
      timestamp:
        new Date().toLocaleTimeString("en-US", { hour12: false }) + " BST",
      eventType: "AUTH_LOGIN",
      severity: "Info",
      actor: currentUser.name,
      actorRole: currentUser.role,
      ipAddress: "103.205.71.42",
      resourceRef: created.receiptNo,
      actionSummary: `Bank receipt ${created.receiptNo} reconciled: BDT ${created.amount.toLocaleString()} credited from ${created.clientName}`,
      status: "Logged & Certified",
    };
    setSecurityLogs((prev) => [newLog, ...prev]);

    showToast(
      `Bank receipt ${created.receiptNo} recorded and invoice reconciled.`,
      "success",
    );
  };

  const handleAddExpense = (exp: Partial<ExpenseRecord>) => {
    const created: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      date: exp.date || new Date().toISOString().split("T")[0],
      category: exp.category || "Audit Travel & Conveyance",
      amount: exp.amount || 2500,
      claimant: exp.claimant || "Zahirul Islam, FCA",
      engagementRef: exp.engagementRef,
      status: "Approved",
    };
    setExpenses((prev) => [created, ...prev]);
    showToast("Expense claim recorded.", "success");
  };

  const handleUpdateInvoiceStatus = (
    invId: string,
    status: InvoiceRecord["status"],
  ) => {
    setInvoices((prev) =>
      prev.map((i) => (i.id === invId ? { ...i, status } : i)),
    );
    showToast("Invoice collection status updated.", "info");
  };

  const handleRevokeSession = (sessionId: string) => {
    setUserSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, status: "Revoked" } : s)),
    );

    const targetSession = userSessions.find((s) => s.id === sessionId);
    const newLog: SecurityEventLog = {
      id: `sec-${Date.now()}`,
      timestamp:
        new Date().toLocaleTimeString("en-US", { hour12: false }) + " BST",
      eventType: "SESSION_REVOKED",
      severity: "Warning",
      actor: currentUser.name,
      actorRole: currentUser.role,
      ipAddress: targetSession?.ipAddress || "103.205.71.42",
      resourceRef: sessionId,
      actionSummary: `Session revoked for device: ${targetSession?.device || "Remote terminal"} (${targetSession?.browser || "Browser"})`,
      status: "Terminated",
    };
    setSecurityLogs((prev) => [newLog, ...prev]);

    showToast("User session revoked immediately.", "info");
  };

  const handleRevokeAllOtherSessions = () => {
    setUserSessions((prev) =>
      prev.map((s) => (s.isCurrentSession ? s : { ...s, status: "Revoked" })),
    );

    const newLog: SecurityEventLog = {
      id: `sec-${Date.now()}`,
      timestamp:
        new Date().toLocaleTimeString("en-US", { hour12: false }) + " BST",
      eventType: "SESSION_REVOKED",
      severity: "Warning",
      actor: currentUser.name,
      actorRole: currentUser.role,
      ipAddress: "103.205.71.42",
      actionSummary:
        "Master session reset: all concurrent client sessions revoked across practice network.",
      status: "Terminated",
    };
    setSecurityLogs((prev) => [newLog, ...prev]);

    showToast("All other active sessions have been revoked.", "success");
  };

  const handleToggleMfa = (enabled: boolean) => {
    const newLog: SecurityEventLog = {
      id: `sec-${Date.now()}`,
      timestamp:
        new Date().toLocaleTimeString("en-US", { hour12: false }) + " BST",
      eventType: "MFA_VERIFY",
      severity: "Notice",
      actor: currentUser.name,
      actorRole: currentUser.role,
      ipAddress: "103.205.71.42",
      actionSummary: enabled
        ? "TOTP RFC 6238 Multi-Factor Authentication activated and verified."
        : "TOTP Multi-Factor Authentication was disabled by user.",
      status: "Verified & Active",
    };
    setSecurityLogs((prev) => [newLog, ...prev]);
    showToast(
      enabled ? "TOTP MFA activated successfully." : "TOTP MFA deactivated.",
      "info",
    );
  };

  const handleUpdateFirmProfile = (updated: Partial<FirmProfile>) => {
    setFirmProfile((prev) => ({ ...prev, ...updated }));
  };

  const handleTriggerAiAction = (actionType: string, payload?: any) => {
    if (actionType === "dispatch_reminder") {
      showToast(
        `Instant PBC reminder notification dispatched to ${payload?.clientName || "Client"}.`,
        "success",
      );
    }
  };

  const pendingReviewsCount = signoffs.filter(
    (s) => s.status === "Pending",
  ).length;
  const openRequestsCount = clientRequests.filter(
    (r) => r.status !== "Resolved",
  ).length;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1C1F1E] flex">
      {/* Sidebar Navigation (260px expanded / 72px collapsed) */}
      <WorkspaceSidebar
        activeTab={activeTab}
        onSelectTab={(t) => setActiveTab(t)}
        currentUser={currentUser}
        onSwitchTenant={handleSwitchTenant}
        onOpenAiAssistant={() => setIsAiOpen(true)}
        onSignOut={onSignOut}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        pendingReviewsCount={pendingReviewsCount}
        openRequestsCount={openRequestsCount}
        availableTenants={availableTenants}
        onAddNewTenant={handleAddNewTenant}
      />

      {/* Main Content Area Canvas with Smooth Width Transition */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          isSidebarCollapsed ? "lg:pl-[72px]" : "lg:pl-[260px]"
        }`}
      >
        {/* Global Topbar Header */}
        <WorkspaceTopbar
          currentUser={currentUser}
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onOpenAiAssistant={() => setIsAiOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          unreadNotificationsCount={pendingReviewsCount + openRequestsCount}
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebarCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <ViewTransition viewKey={activeTab}>
            {activeTab === "dashboard" && (
              <DashboardView
                engagements={engagements}
                tasks={tasks}
                signoffs={signoffs}
                workingPapers={workingPapers}
                timesheets={timesheets}
                clients={clients}
                onNavigateTab={(tab) => setActiveTab(tab)}
                onQuickSignOff={handleQuickSignOff}
                onAddEngagement={handleAddEngagement}
                onAddTask={handleAddTask}
                onAddTimesheet={handleAddTimesheet}
                onAddWorkingPaper={handleAddWorkingPaper}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onUpdateEngagementStage={handleUpdateEngagementStage}
              />
            )}

            {(activeTab === "people" || activeTab === "students") && (
              <PeopleStudentsView
                initialTab={activeTab === "students" ? "students" : "staff"}
                staffList={staffList}
                studentList={studentList}
                onAddStaff={handleAddStaff}
                onAddStudent={handleAddStudent}
                onUpdateStaff={handleUpdateStaff}
                onUpdateStudent={handleUpdateStudent}
              />
            )}

            {(activeTab === "crm" || activeTab === "engagements") && (
              <CrmEngagementsView
                initialTab={activeTab === "engagements" ? "engagements" : "crm"}
                clients={clients}
                engagements={engagements}
                staffList={staffList}
                studentList={studentList}
                onAddClient={handleAddClient}
                onAddEngagement={handleAddEngagement}
                onUpdateEngagementStage={handleUpdateEngagementStage}
              />
            )}

            {(activeTab === "tasks" || activeTab === "timesheets") && (
              <TasksTimesheetsView
                initialTab={activeTab === "timesheets" ? "timesheets" : "tasks"}
                tasks={tasks}
                timesheets={timesheets}
                weeklyTimesheets={weeklyTimesheets}
                resourceCapacities={resourceCapacities}
                clients={clients}
                engagements={engagements}
                onAddTask={handleAddTask}
                onAddTimesheet={handleAddTimesheet}
                onUpdateTaskStatus={handleUpdateTaskStatus}
                onSaveWeeklyTimesheet={(rows) => {
                  setWeeklyTimesheets(rows);
                  showToast(
                    "Weekly timesheet logged and synchronized successfully.",
                    "success",
                  );
                }}
              />
            )}

            {(activeTab === "documents" ||
              activeTab === "audit-files" ||
              activeTab === "reviews" ||
              activeTab === "client-requests") && (
              <AuditReviewDocsView
                initialTab={
                  activeTab === "documents"
                    ? "documents"
                    : activeTab === "reviews"
                      ? "reviews"
                      : activeTab === "client-requests"
                        ? "client-requests"
                        : "audit-files"
                }
                documents={documents}
                workingPapers={workingPapers}
                signoffs={signoffs}
                clientRequests={clientRequests}
                onQuickSignOff={handleQuickSignOff}
                onApproveAndSignOff={handleApproveAndSignOff}
                onRejectWithReviewNote={handleRejectWithReviewNote}
                onRequestClarification={handleRequestClarification}
                onAddReviewNote={handleAddReviewNote}
                onReplyReviewNote={handleReplyReviewNote}
                onUpdateNoteStatus={handleUpdateNoteStatus}
                onAddDocument={handleAddDocument}
                onAddWorkingPaper={handleAddWorkingPaper}
                onUpdateWorkingPaper={handleUpdateWorkingPaper}
                onCreateClientRequest={handleCreateClientRequest}
                onUpdateClientRequestStatus={handleUpdateClientRequestStatus}
                onToggleFileReceived={handleToggleFileReceived}
                onSendInstantReminder={handleSendInstantReminder}
                onToast={showToast}
              />
            )}

            {activeTab === "finance" && (
              <FinanceBillingView
                invoices={invoices}
                expenses={expenses}
                collections={collections}
                firmProfile={firmProfile}
                clients={clients}
                engagements={engagements}
                currentUser={currentUser}
                onAddInvoice={handleAddInvoice}
                onAddExpense={handleAddExpense}
                onRecordPayment={handleRecordPayment}
                onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
              />
            )}

            {activeTab === "settings" && (
              <SettingsView
                currentUser={currentUser}
                firmProfile={firmProfile}
                userSessions={userSessions}
                securityLogs={securityLogs}
                onUpdateTenantName={(name) =>
                  setCurrentUser((prev) => ({ ...prev, tenant: name }))
                }
                onUpdateFirmProfile={handleUpdateFirmProfile}
                onRevokeSession={handleRevokeSession}
                onRevokeAllOtherSessions={handleRevokeAllOtherSessions}
                onToggleMfa={handleToggleMfa}
              />
            )}
          </ViewTransition>
        </main>
      </div>

      {/* Slide-over AI Assistant Copilot */}
      <AiAssistantDrawer
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        currentUser={currentUser}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onTriggerAction={handleTriggerAiAction}
      />

      {/* Cmd + K Command Palette */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={(t) => setActiveTab(t)}
        onOpenAi={() => setIsAiOpen(true)}
      />
    </div>
  );
};
