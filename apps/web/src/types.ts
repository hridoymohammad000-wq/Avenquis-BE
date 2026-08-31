export interface FeatureItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: "users" | "calendar" | "pie-chart" | "file-text";
  badge: {
    label: string;
    bg: string;
    text: string;
    border?: string;
  };
  metrics?: string;
  description: string;
}

export interface NavLinkItem {
  label: string;
  href: string;
  id: string;
}

export type AuthMode = "signin" | "signup" | "forgot";

export interface AuthFormData {
  name?: string;
  email: string;
  password: string;
  confirmPassword?: string;
  rememberMe: boolean;
  role?: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "info" | "error";
  title: string;
  message: string;
}

export interface UserSession {
  name: string;
  email: string;
  role: string;
  tenant: string;
  initials: string;
  avatarColor: string;
}

export type WorkspaceTab =
  | "dashboard"
  | "people"
  | "students"
  | "crm"
  | "engagements"
  | "tasks"
  | "timesheets"
  | "documents"
  | "audit-files"
  | "reviews"
  | "client-requests"
  | "finance"
  | "settings";

export interface StaffActivityLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string;
  designation: string;
  department:
    | "Audit & Assurance"
    | "Taxation & Regulatory"
    | "Advisory"
    | "Finance & Admin";
  role:
    "Partner" | "Senior Manager" | "Manager" | "Senior Associate" | "Associate";
  status: "Active" | "On Leave" | "In Field";
  activeEngagementsCount: number;
  billableUtilization: number; // percentage
  avatarUrl?: string;
  hourlyRate?: number;
  assignedTeams?: string[];
  permissions?: string[];
  activityLogs?: StaffActivityLog[];
}

export interface StudentArticle {
  id: string;
  registrationNo: string;
  name: string;
  email: string;
  phone?: string;
  batch: string; // e.g. "Batch 2024-B"
  icabRegNo: string;
  joiningDate: string;
  completionDate: string;
  principalMentor: string;
  examLevel:
    "Knowledge Level" | "Business Level" | "Advanced Level" | "Qualified";
  examLeaveStatus?:
    "None" | "On Exam Leave" | "Approved Upcoming" | "Completed";
  stipendStatus: "Paid" | "Processing";
  stipendAmount: number;
  leaveBalanceDays: number;
  workingDaysLogged: number;
  assignedEngagements?: string[];
}

export interface ClientBillingHistoryItem {
  id: string;
  invoiceNo: string;
  engagement: string;
  amount: number;
  date: string;
  status: "Paid" | "Pending" | "Overdue";
}

export interface ClientKycRecord {
  tradeLicenseNo?: string;
  incorporationNo?: string;
  tinNo?: string;
  binNo?: string;
  registeredAddress?: string;
  kycVerifiedDate?: string;
  directors?: string[];
  bankers?: string[];
}

export interface ClientRecord {
  id: string;
  clientCode: string;
  name: string;
  industry: string;
  contactPerson: string;
  email: string;
  phone: string;
  taxId: string;
  tradeLicenseNo?: string;
  relationshipPartner: string;
  annualFee: number;
  status: "Active" | "Under Review" | "Onboarding";
  activeEngagements: number;
  riskRating: "Low" | "Medium" | "High";
  kycDetails?: ClientKycRecord;
  billingHistory?: ClientBillingHistoryItem[];
  companyOverview?: string;
}

export interface EngagementTeamMemberRole {
  name: string;
  role:
    | "Engagement Partner"
    | "Audit Manager"
    | "In-Charge / Senior"
    | "Articled Student"
    | "Tax Specialist";
  avatarInitials: string;
}

export interface EngagementRecord {
  id: string;
  engagementCode: string;
  clientName: string;
  serviceType:
    | "Statutory Audit"
    | "Tax Compliance"
    | "Due Diligence"
    | "Internal Audit"
    | "Transfer Pricing"
    | "VAT Assessment"
    | "Special Advisory";
  stage:
    | "Planning"
    | "Fieldwork"
    | "Review"
    | "Sign-off"
    | "Completed"
    | "Reporting";
  health?: "On Track" | "At Risk" | "Delayed";
  leadManager: string;
  leadPartner: string;
  teamMembers: string[];
  teamMemberRoles?: EngagementTeamMemberRole[];
  dueDate: string;
  yearEndDate?: string;
  targetSignOffDate?: string;
  progressPercent: number;
  budgetHours: number;
  loggedHours: number;
  statusColor: string;
  scopeDescription?: string;
}

export interface AuditActivityEvent {
  id: string;
  type: "upload" | "signoff" | "pbc" | "timesheet" | "stage_change";
  title: string;
  description: string;
  actor: string;
  actorRole?: string;
  timestamp: string;
  ref?: string;
}

export interface TaskSubtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface TaskRecord {
  id: string;
  title: string;
  clientName: string;
  engagementCode?: string;
  assignedTo: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Todo" | "In Progress" | "Blocked" | "Done";
  dueDate: string;
  estimatedHours: number;
  category:
    | "Field Audit"
    | "Report Drafting"
    | "Tax Computation"
    | "Client Meeting"
    | "Audit Workpaper"
    | "Tax Filing"
    | "Documentation"
    | "Client Query";
  subtasks?: TaskSubtask[];
}

export interface WorkCodeOption {
  code: string;
  name:
    | "Field Audit"
    | "Report Drafting"
    | "Tax Computation"
    | "Client Meeting"
    | "General Review"
    | "Admin & Training";
  billable: boolean;
  color: string;
}

export interface WeeklyTimesheetRow {
  id: string;
  clientName: string;
  engagementCode: string;
  workCode:
    "Field Audit" | "Report Drafting" | "Tax Computation" | "Client Meeting";
  billable: boolean;
  hours: {
    mon: number;
    tue: number;
    wed: number;
    thu: number;
    fri: number;
    sat: number;
    sun: number;
  };
}

export interface StaffWorkloadCapacity {
  staffId: string;
  staffName: string;
  role: string;
  department: string;
  avatarInitials: string;
  weeks: {
    weekLabel: string; // e.g. "Week 1 (Sep 1-7)"
    allocatedHours: number;
    capacityHours: number;
    status: "Overallocated" | "Optimal" | "Available";
    engagements: string[];
  }[];
}

export interface TimesheetEntry {
  id: string;
  date: string;
  staffName: string;
  clientName: string;
  engagementCode: string;
  taskDescription: string;
  hours: number;
  billable: boolean;
  status: "Approved" | "Submitted" | "Draft";
}

export interface DocumentVaultItem {
  id: string;
  fileName: string;
  clientName: string;
  financialYear?: string; // e.g. "FY 2025-26", "FY 2024-25"
  engagementType?: string; // e.g. "Statutory Audit", "Tax Advisory", "VAT Compliance", "Corporate Advisory"
  section?:
    | "Current Audit File"
    | "Permanent Audit File"
    | "Tax Filings"
    | "Legal Records";
  category:
    | "Engagement Letter"
    | "Trial Balance"
    | "Tax Return"
    | "Board Minutes"
    | "Legal Certificate"
    | "Bank Confirmation"
    | "Voucher Evidence";
  confidentiality?: "Public" | "Internal" | "Highly Confidential";
  fileSize: string;
  uploadedBy: string;
  uploadedAt: string;
  hash: string;
  version: string;
  isLocked: boolean;
}

export interface WorkingPaperProcedure {
  id: string;
  stepNumber: number;
  description: string;
  completed: boolean;
  performer: string;
  performedDate?: string;
  isaReference?: string;
}

export interface WorkingPaperEvidence {
  id: string;
  fileName: string;
  fileSize: string;
  uploadedAt: string;
  uploadedBy: string;
  hash: string;
  mimeType?: string;
}

export interface WorkingPaperRevision {
  version: string;
  timestamp: string;
  author: string;
  authorRole?: string;
  hash: string;
  changeSummary: string;
  isLocked: boolean;
}

export interface WorkingPaper {
  id: string;
  wpRef: string; // e.g., "A-101 Cash & Bank", "B-201 Fixed Assets", "C-301 Revenue"
  clientName: string;
  engagementCode?: string;
  financialYear?: string;
  title: string;
  objective?: string;
  scope?: string;
  preparedBy: string;
  preparedDate: string;
  reviewedBy?: string;
  reviewedDate?: string;
  status:
    "Draft" | "Ready for Review" | "Partner Signed-off" | "Manager Approved";
  version: string; // e.g. "v1.0", "v1.1"
  fileHash: string;
  isLocked: boolean;
  findingsCount: number;
  checklistComplete: boolean;
  procedures?: WorkingPaperProcedure[];
  evidenceFiles?: WorkingPaperEvidence[];
  revisions?: WorkingPaperRevision[];
}

export interface ReviewNoteReply {
  id: string;
  author: string;
  role: string;
  timestamp: string;
  content: string;
}

export interface ReviewNote {
  id: string;
  sectionRef: string; // e.g. "Section 1: Audit Scope", "Section 2: Substantive Sampling", "Evidence #2: Bank Certificate", "General Review"
  content: string;
  severity: "High" | "Medium" | "Low" | "Advisory";
  author: string;
  authorRole: string;
  timestamp: string;
  status: "Open" | "Addressed" | "Cleared";
  replies?: ReviewNoteReply[];
}

export interface SignOffChecklist {
  standardsCompliance: boolean; // ICAB / ISA / IFRS standards compliance verified
  sufficientEvidence: boolean; // ISA 500 sufficient appropriate evidence attached
  analyticalReviewCompleted: boolean; // ISA 520 analytical review & ratio variance reconciled
  samplingReconciled: boolean; // ISA 530 subledger sampling & trial balance reconciliation
  subsequentEventsEvaluated: boolean; // ISA 560/570 going concern & subsequent events reviewed
}

export interface DigitalSignatureSeal {
  signerName: string;
  signerDesignation: string;
  icabRegNo?: string;
  timestamp: string;
  signatureId: string; // e.g. "AVQ-SIG-7F89B-FCA-2026"
  hashProof: string;
  certificateRef: string;
  status: "Certified Signed-off" | "Manager Approved";
}

export interface SignOffItem {
  id: string;
  engagementCode: string;
  clientName: string;
  paperRef: string;
  title: string;
  workingPaperId?: string;
  documentVersion: string; // e.g. "v1.2"
  fileHash: string; // SHA-256 hash
  financialYear?: string;
  submittedBy: string;
  submittedDate: string;
  roleRequired: "Manager Sign-off" | "Partner Sign-off" | "EQCR Review";
  status: "Pending" | "Signed" | "Rejected" | "Clarification Requested";
  notes?: string;
  checklist?: SignOffChecklist;
  managerSeal?: DigitalSignatureSeal;
  partnerSeal?: DigitalSignatureSeal;
  reviewNotes?: ReviewNote[];
}

export interface PBCFileRequirement {
  id: string;
  title: string;
  format: string; // e.g. "Excel Spreadsheet (.xlsx)", "Signed PDF Scan", "Bank Certificate (.pdf)"
  mandatory: boolean;
  received: boolean;
  receivedDate?: string;
  fileHash?: string;
  fileSize?: string;
  uploadedBy?: string;
}

export interface PBCContactPerson {
  name: string;
  designation: string;
  email: string;
  phone?: string;
}

export interface ClientRequestItem {
  id: string;
  ticketNo: string; // e.g. "PBC-2026-901"
  clientName: string;
  engagementCode?: string;
  subject: string;
  description?: string;
  targetContact?: PBCContactPerson;
  requestedDate: string;
  dueDate: string;
  status:
    | "Requested"
    | "Partially Received"
    | "Under Verification"
    | "Accepted"
    | "Pending Client Upload"
    | "Received & Verifying"
    | "Resolved"
    | "Overdue";
  priority: "High" | "Medium" | "Low";
  assignedStaff: string;
  fileRequirements?: PBCFileRequirement[];
  automatedReminder?: boolean;
  reminderFrequency?: "Daily" | "Every 3 Days" | "Weekly";
  lastReminderSent?: string;
  remindersCount?: number;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  hours?: number;
  rate?: number;
  amount: number;
}

export interface InvoiceRecord {
  id: string;
  invoiceNo: string; // e.g. "INV-2026-052"
  clientName: string;
  engagementRef?: string; // e.g. "AUD-2026-081 (Apex Footwear Statutory Audit)"
  service: string;
  billingBasis?:
    | "Fixed Milestone"
    | "Time & Materials (Timesheet)"
    | "Monthly Retainer"
    | "Special Assignment";
  lineItems?: InvoiceLineItem[];
  amount: number; // Base subtotal before VAT
  vatRate?: number; // e.g. 15 or 0
  vatAmount: number;
  totalAmount: number;
  issueDate: string;
  dueDate: string;
  status: "Draft" | "Sent" | "Pending" | "Paid" | "Overdue";
  billableHoursCount?: number;
  ratePerHour?: number;
  notes?: string;
  paymentDetails?: {
    paidDate?: string;
    receiptNo?: string;
    paymentMethod?: string;
    bankRef?: string;
  };
}

export interface CollectionRecord {
  id: string;
  receiptNo: string; // e.g. "MR-2026-088"
  invoiceId: string;
  invoiceNo: string;
  clientName: string;
  paymentDate: string;
  amount: number;
  paymentMethod:
    | "Bank BEFTN"
    | "RTGS"
    | "Cheque Deposit"
    | "Direct Transfer"
    | "Pay Order"
    | "NPSB Electronic";
  bankRef: string; // e.g. "EBL-BEFTN-994821"
  depositedAccount: string; // e.g. "Eastern Bank Ltd - Principal Firm A/C #104102948"
  status: "Cleared & Credited" | "Pending Clearing";
  receivedBy: string;
  remarks?: string;
}

export interface AgingBucketSummary {
  current: number; // 0-30 days
  days31to60: number; // 31-60 days
  days61to90: number; // 61-90 days
  over90: number; // 90+ days
  totalOutstanding: number;
}

export interface ExpenseRecord {
  id: string;
  date: string;
  category:
    | "Audit Travel & Conveyance"
    | "Client Meeting"
    | "Stationery & Printing"
    | "Software Subscriptions"
    | "Meal Allowance";
  amount: number;
  claimant: string;
  engagementRef?: string;
  status: "Approved" | "Pending";
}

export interface FirmProfile {
  firmName: string;
  firmRegistrationNo: string; // e.g. "ICAB-FRN-2018/0942"
  tradeLicenseNo?: string; // e.g. "TRAD/DSCC/019284/2022"
  taxIdentificationNo: string; // e.g. "TIN: 4892-0194-8201"
  binNumber: string; // e.g. "BIN: 002948192-0101"
  principalAddress: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  logoUrl?: string;
  managingPartner: string;
  establishedYear: string;
}

export interface UserSessionRecord {
  id: string;
  userId: string;
  userName: string;
  role: string;
  device: string; // e.g. "MacBook Pro 16\" (macOS Sequoia)"
  browser: string; // e.g. "Chrome 128.0"
  ipAddress: string; // e.g. "103.145.12.89 (Dhaka, Bangladesh)"
  location: string;
  lastActive: string;
  isCurrentSession: boolean;
  status: "Active" | "Revoked";
}

export interface SecurityEventLog {
  id: string;
  timestamp: string;
  eventType:
    | "AUTH_LOGIN"
    | "MFA_VERIFY"
    | "SIGNOFF_SEAL"
    | "KEY_ROTATION"
    | "SESSION_REVOKED"
    | "EXPORT_LEDGER"
    | "PERMISSION_CHANGE"
    | "SECURITY_POLICY_UPDATE";
  severity: "Info" | "Notice" | "Warning" | "Critical";
  actor: string;
  actorRole: string;
  ipAddress: string;
  actionSummary: string;
  resourceRef?: string;
  status:
    | "Success"
    | "Flagged"
    | "Blocked"
    | "Logged & Certified"
    | "Terminated"
    | "Verified & Active";
}

export interface AiActionCard {
  id: string;
  type:
    | "draft_reminder"
    | "pending_signoffs"
    | "unbilled_hours"
    | "working_paper"
    | "tax_calculation";
  title: string;
  summary: string;
  details?: string[];
  actionLabel: string;
  secondaryActionLabel?: string;
  targetTab?: WorkspaceTab;
  payload?: any;
}
