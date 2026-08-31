import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Users,
  GraduationCap,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  Building,
  Briefcase,
  ExternalLink,
  ChevronRight,
  UserCheck,
  UserPlus,
  FileSpreadsheet,
  FileText,
  X,
  Edit3,
  Sliders,
  DollarSign,
  AlertCircle,
  Download,
  Check,
  Activity,
  Layers,
  ArrowUpRight,
  BookOpen,
} from "lucide-react";
import { StaffMember, StudentArticle, StaffActivityLog } from "../../types";

interface PeopleStudentsViewProps {
  initialTab?: "staff" | "students";
  staffList: StaffMember[];
  studentList: StudentArticle[];
  onAddStaff: (member: Partial<StaffMember>) => void;
  onAddStudent: (student: Partial<StudentArticle>) => void;
  onUpdateStaff?: (staffId: string, updatedData: Partial<StaffMember>) => void;
  onUpdateStudent?: (
    studentId: string,
    updatedData: Partial<StudentArticle>,
  ) => void;
}

export const PeopleStudentsView: React.FC<PeopleStudentsViewProps> = ({
  initialTab = "staff",
  staffList,
  studentList,
  onAddStaff,
  onAddStudent,
  onUpdateStaff,
  onUpdateStudent,
}) => {
  const [subTab, setSubTab] = useState<"staff" | "students">(initialTab);

  // Staff Filters
  const [staffSearch, setStaffSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<
    | "All"
    | "Audit & Assurance"
    | "Taxation & Regulatory"
    | "Advisory"
    | "Finance & Admin"
  >("All");
  const [roleFilter, setRoleFilter] = useState<string>("All");

  // Student Filters
  const [studentSearch, setStudentSearch] = useState("");
  const [examLevelFilter, setExamLevelFilter] = useState<string>("All");
  const [examLeaveFilter, setExamLeaveFilter] = useState<string>("All");

  // Modals & Drawers
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [selectedStaffDrawer, setSelectedStaffDrawer] =
    useState<StaffMember | null>(null);
  const [editingPermissionsStaff, setEditingPermissionsStaff] =
    useState<StaffMember | null>(null);
  const [editingStudentModal, setEditingStudentModal] =
    useState<StudentArticle | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // New Staff Form State
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    phone: "+880 ",
    designation: "Senior Audit Associate",
    department: "Audit & Assurance" as StaffMember["department"],
    role: "Senior Associate" as StaffMember["role"],
    hourlyRate: 4500,
    status: "Active" as StaffMember["status"],
    assignedTeams: "Core Audit Alpha",
  });

  // Permissions Edit State
  const [staffPermissions, setStaffPermissions] = useState<string[]>([]);

  // New Student Form State
  const [newStudent, setNewStudent] = useState({
    name: "",
    email: "",
    phone: "+880 ",
    registrationNo: `REG-2026-${Math.floor(100 + Math.random() * 900)}`,
    batch: "Batch 2026-A",
    icabRegNo: `ICAB-ART-${Math.floor(20000 + Math.random() * 5000)}`,
    principalMentor: "Fouzia Haque, FCA",
    joiningDate: "2026-08-01",
    completionDate: "2029-07-31",
    examLevel: "Knowledge Level" as StudentArticle["examLevel"],
    examLeaveStatus: "None" as StudentArticle["examLeaveStatus"],
    stipendAmount: 11000,
  });

  // Filtered Lists
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.designation.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.phone.toLowerCase().includes(staffSearch.toLowerCase());
    const matchesDept =
      departmentFilter === "All" || s.department === departmentFilter;
    const matchesRole = roleFilter === "All" || s.role === roleFilter;
    return matchesSearch && matchesDept && matchesRole;
  });

  const filteredStudents = studentList.filter((st) => {
    const matchesSearch =
      st.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      st.batch.toLowerCase().includes(studentSearch.toLowerCase()) ||
      st.registrationNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      st.icabRegNo.toLowerCase().includes(studentSearch.toLowerCase()) ||
      st.principalMentor.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesLevel =
      examLevelFilter === "All" || st.examLevel === examLevelFilter;
    const matchesLeave =
      examLeaveFilter === "All" || st.examLeaveStatus === examLeaveFilter;
    return matchesSearch && matchesLevel && matchesLeave;
  });

  // Calculate Remaining Term for Students
  const calculateRemainingTerm = (completionDateStr: string) => {
    const target = new Date(completionDateStr);
    const now = new Date("2026-08-31");
    const diffTime = target.getTime() - now.getTime();
    if (diffTime <= 0) return "Completed / Eligible for Qualified Status";
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const months = Math.floor(diffDays / 30.4);
    const remainingDays = Math.floor(diffDays % 30.4);
    return `${months} mos ${remainingDays} days left`;
  };

  // Handlers
  const handleCreateStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name.trim() || !newStaff.email.trim()) return;

    const defaultPermissionsMap: Record<StaffMember["role"], string[]> = {
      Partner: [
        "Final Audit Report Sign-off (ICAB/ISA)",
        "Partner Review Sign-off",
        "Engagement Acceptance & Continuance",
        "Quality Control ISA 220 Lead",
        "Fee Billing & Partner Approvals",
      ],
      "Senior Manager": [
        "Managerial Sign-off",
        "Working Paper Approval",
        "Engagement Planning",
        "Timesheet Authorization",
      ],
      Manager: [
        "Quality Review Sign-off",
        "Working Paper Approval",
        "Engagement Planning",
        "Timesheet Authorization",
        "ISA Compliance Verification",
      ],
      "Senior Associate": [
        "Working Paper Drafting",
        "Audit Sample Testing",
        "Trainee Supervision",
      ],
      Associate: [
        "Audit Sample Testing",
        "Vouching & Verification",
        "Working Paper Data Entry",
      ],
    };

    onAddStaff({
      ...newStaff,
      status: "Active",
      activeEngagementsCount: 1,
      billableUtilization: 88,
      hourlyRate: Number(newStaff.hourlyRate) || 4500,
      assignedTeams: [newStaff.assignedTeams],
      permissions: defaultPermissionsMap[newStaff.role] || [
        "Working Paper Drafting",
      ],
      activityLogs: [
        {
          id: `log-${Date.now()}`,
          action: "Staff Member Onboarded",
          timestamp: "Just now",
          details: `Registered as ${newStaff.designation} in ${newStaff.department}.`,
        },
      ],
    });

    setIsAddStaffModalOpen(false);
    setNewStaff({
      name: "",
      email: "",
      phone: "+880 ",
      designation: "Senior Audit Associate",
      department: "Audit & Assurance",
      role: "Senior Associate",
      hourlyRate: 4500,
      status: "Active",
      assignedTeams: "Core Audit Alpha",
    });
  };

  const handleCreateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudent.name.trim() || !newStudent.email.trim()) return;

    onAddStudent({
      ...newStudent,
      stipendStatus: "Paid",
      leaveBalanceDays: 20,
      workingDaysLogged: 0,
      assignedEngagements: ["Unassigned (Orientation Phase)"],
    });

    setIsAddStudentModalOpen(false);
    setNewStudent({
      name: "",
      email: "",
      phone: "+880 ",
      registrationNo: `REG-2026-${Math.floor(100 + Math.random() * 900)}`,
      batch: "Batch 2026-A",
      icabRegNo: `ICAB-ART-${Math.floor(20000 + Math.random() * 5000)}`,
      principalMentor: "Fouzia Haque, FCA",
      joiningDate: "2026-08-01",
      completionDate: "2029-07-31",
      examLevel: "Knowledge Level",
      examLeaveStatus: "None",
      stipendAmount: 11000,
    });
  };

  const handleOpenPermissionsModal = (staff: StaffMember) => {
    setEditingPermissionsStaff(staff);
    setStaffPermissions(
      staff.permissions || [
        "Working Paper Drafting",
        "Audit Sample Testing",
        "Trainee Supervision",
      ],
    );
  };

  const handleSavePermissions = () => {
    if (editingPermissionsStaff && onUpdateStaff) {
      onUpdateStaff(editingPermissionsStaff.id, {
        permissions: staffPermissions,
        activityLogs: [
          {
            id: `log-${Date.now()}`,
            action: "Permissions & Roles Updated",
            timestamp: "Just now",
            details: `Updated security template with ${staffPermissions.length} granted authorizations.`,
          },
          ...(editingPermissionsStaff.activityLogs || []),
        ],
      });
      // If drawer is open for this staff, update it too
      if (selectedStaffDrawer?.id === editingPermissionsStaff.id) {
        setSelectedStaffDrawer({
          ...selectedStaffDrawer,
          permissions: staffPermissions,
        });
      }
    }
    setEditingPermissionsStaff(null);
  };

  const handleTogglePermission = (permission: string) => {
    setStaffPermissions((prev) =>
      prev.includes(permission)
        ? prev.filter((p) => p !== permission)
        : [...prev, permission],
    );
  };

  const handleUpdateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudentModal) return;
    if (onUpdateStudent) {
      onUpdateStudent(editingStudentModal.id, editingStudentModal);
    }
    setEditingStudentModal(null);
  };

  const handleExportArticleship = (format: "PDF" | "Excel") => {
    setExportNotice(
      `Exporting CA Articleship Registry (${studentList.length} trainees) as ${format} formatted report...`,
    );
    setTimeout(() => {
      setExportNotice(null);
    }, 4000);
  };

  // Available permissions list for CA Practice
  const ALL_PERMISSIONS = [
    "Final Audit Report Sign-off (ICAB/ISA)",
    "Partner Review Sign-off",
    "Quality Review Sign-off",
    "Working Paper Approval",
    "Engagement Planning",
    "Timesheet Authorization",
    "ISA Compliance Verification",
    "Tax Return Verification",
    "Assessment Defense Representation",
    "Working Paper Drafting",
    "Audit Sample Testing",
    "Trainee Supervision",
    "Fee Billing & Partner Approvals",
    "Engagement Acceptance & Continuance",
  ];

  return (
    <div className="space-y-6 animate-fadeIn text-left pb-12">
      {/* 1. HEADER & SUB-TAB SWITCHER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-white border border-[#EBE6DD] shadow-2xs relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center space-x-2 bg-[#FAF0DE] border border-[#EADBBF] px-3 py-1 rounded-full text-[10.5px] font-bold tracking-wider text-[#8A5A18]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C58A3E]" />
            <span className="uppercase">
              AVENQUIS HUMAN CAPITAL &amp; GOVERNANCE
            </span>
            <span className="text-[#C58A3E] font-serif">✦</span>
            <span>ICAB-ALIGNED WORKFLOW</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1F1E] tracking-tight">
            {subTab === "students"
              ? "CA Students & Articleship Governance"
              : "People, Staff & Practice Directory"}
          </h1>
          <p className="text-xs sm:text-sm text-[#66706B] max-w-2xl leading-relaxed">
            {subTab === "students"
              ? "Track ICAB registered articled students, training agreement tenures, principal mentor assignments, exam leaves, and stipend disbursements."
              : "Manage firm partners, audit managers, multidisciplinary practice staff, billing rates, and assigned engagement teams."}
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center space-x-2 bg-[#FAF7F2] p-1.5 rounded-2xl border border-[#E8E1D5] shrink-0 z-10">
          <button
            id="tab-firm-staff"
            onClick={() => setSubTab("staff")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              subTab === "staff"
                ? "bg-[#113227] text-white shadow-2xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Firm Staff &amp; Professionals ({staffList.length})</span>
          </button>

          <button
            id="tab-ca-articleship"
            onClick={() => setSubTab("students")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              subTab === "students"
                ? "bg-[#113227] text-white shadow-2xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>CA Students &amp; Articleship ({studentList.length})</span>
          </button>
        </div>
      </div>

      {/* Export Notification banner */}
      {exportNotice && (
        <div className="p-3.5 rounded-2xl bg-[#E1F3EE] border border-[#BDE5D9] text-[#1F5946] text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-[#113227]" />
            <span>{exportNotice}</span>
          </div>
          <button
            onClick={() => setExportNotice(null)}
            className="text-[#1F5946] hover:text-[#113227]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: FIRM STAFF & PROFESSIONALS VIEW */}
      {/* ========================================================================= */}
      {subTab === "staff" && (
        <div className="space-y-6">
          {/* Controls Bar: Search, Department Filter, Role Filter & Add Staff Button */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#EBE6DD] shadow-2xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9691]" />
                <input
                  id="staff-search-input"
                  type="text"
                  placeholder="Search staff by name, designation, email, phone..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              {/* Department Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-bold text-[#8A9691] whitespace-nowrap">
                  Dept:
                </span>
                <select
                  id="staff-dept-filter"
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                >
                  <option value="All">All Departments</option>
                  <option value="Audit & Assurance">
                    Audit &amp; Assurance
                  </option>
                  <option value="Taxation & Regulatory">
                    Taxation &amp; Regulatory
                  </option>
                  <option value="Advisory">Advisory &amp; Valuation</option>
                  <option value="Finance & Admin">Finance &amp; Admin</option>
                </select>
              </div>

              {/* Role Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-bold text-[#8A9691] whitespace-nowrap">
                  Role:
                </span>
                <select
                  id="staff-role-filter"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                >
                  <option value="All">All Roles</option>
                  <option value="Partner">Partner</option>
                  <option value="Manager">Manager</option>
                  <option value="Senior Associate">Senior Associate</option>
                  <option value="Associate">Associate</option>
                </select>
              </div>
            </div>

            {/* "+ Add Staff Member" modal trigger */}
            <button
              id="btn-open-add-staff-modal"
              onClick={() => setIsAddStaffModalOpen(true)}
              className="btn-forest px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs hover:shadow-sm cursor-pointer transition-all shrink-0 active:scale-98"
            >
              <UserPlus className="w-3.5 h-3.5 text-[#C58A3E]" />
              <span>Add Staff Member</span>
            </button>
          </div>

          {/* Staff Data Table / Grid */}
          <div className="bg-white rounded-3xl border border-[#EBE6DD] p-5 sm:p-6 shadow-2xs">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[840px]">
                <thead>
                  <tr className="border-b border-[#EBE5DA] text-[11px] font-bold text-[#8A9691] uppercase tracking-wider">
                    <th className="pb-3 pl-1">
                      Professional &amp; Designation
                    </th>
                    <th className="pb-3 px-3">Department</th>
                    <th className="pb-3 px-3">Role &amp; Permissions</th>
                    <th className="pb-3 px-3">Active Engagements</th>
                    <th className="pb-3 px-3">Work Email &amp; Contact</th>
                    <th className="pb-3 px-3">Status</th>
                    <th className="pb-3 pr-1 text-right">Actions</th>
                  </tr>
                </thead>
                <motion.tbody
                  key={`${staffSearch}-${departmentFilter}-${roleFilter}`}
                  className="divide-y divide-[#F0EBE1] text-xs"
                  initial={{ opacity: 0.65 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                >
                  {filteredStaff.map((staff) => {
                    const initials = staff.name
                      .split(" ")
                      .filter((n) => !n.includes(","))
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("");

                    return (
                      <tr
                        key={staff.id}
                        className="hover:bg-[#FAF8F5] transition-colors group cursor-pointer"
                        onClick={() => setSelectedStaffDrawer(staff)}
                      >
                        {/* Avatar, Full Name, Designation */}
                        <td className="py-3.5 pl-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-[#113227] text-white font-bold text-xs flex items-center justify-center border border-[#C58A3E] shrink-0 shadow-2xs">
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[#1C1F1E] group-hover:text-[#113227] flex items-center gap-1.5">
                                <span>{staff.name}</span>
                                {staff.role === "Partner" && (
                                  <span className="px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-[#FAF0DE] text-[#8A5A18] border border-[#EADBBF]">
                                    PARTNER
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-[#7A8782]">
                                {staff.designation}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[11px] font-semibold bg-[#FAF7F2] border border-[#E5DDD0] text-[#3D4742]">
                            {staff.department}
                          </span>
                        </td>

                        {/* Role / Permissions Template */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-[#1C1F1E] flex items-center gap-1">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#1F5946]" />
                              <span>{staff.role} Template</span>
                            </div>
                            <div className="text-[10px] text-[#8A9691]">
                              {staff.permissions?.length || 3} active
                              authorities
                            </div>
                          </div>
                        </td>

                        {/* Active Engagements Count & Utilization */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5 text-xs font-bold text-[#1C1F1E]">
                              <Briefcase className="w-3.5 h-3.5 text-[#C58A3E]" />
                              <span>
                                {staff.activeEngagementsCount} Engagements
                              </span>
                            </div>
                            <div className="text-[10px] text-[#7A8782]">
                              {staff.billableUtilization}% billable rate
                            </div>
                          </div>
                        </td>

                        {/* Work Email & Phone */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1 text-[#333E38] text-[11.5px] font-medium">
                              <Mail className="w-3 h-3 text-[#8A9691]" />
                              <span className="truncate max-w-[180px]">
                                {staff.email}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-[10.5px] font-mono text-[#8A9691]">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{staff.phone}</span>
                            </div>
                          </div>
                        </td>

                        {/* Status (Active / On Leave / In Field) */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`motion-badge inline-flex items-center space-x-1.5 px-2.5 py-0.8 rounded-full text-[10.5px] font-bold ${
                              staff.status === "Active"
                                ? "bg-[#E1F3EE] text-[#1F5946] border border-[#C5E8DC]"
                                : staff.status === "In Field"
                                  ? "bg-[#FAF0DE] text-[#8A5A18] border border-[#ECD9B8]"
                                  : "bg-[#FDE6E2] text-[#8E362C] border border-[#F4CCC6]"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                staff.status === "Active"
                                  ? "bg-emerald-600"
                                  : staff.status === "In Field"
                                    ? "bg-amber-600 animate-pulse"
                                    : "bg-rose-600"
                              }`}
                            />
                            <span>{staff.status}</span>
                          </span>
                        </td>

                        {/* Edit Permissions Action */}
                        <td
                          className="py-3.5 pr-1 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              id={`btn-edit-permissions-${staff.id}`}
                              onClick={() => handleOpenPermissionsModal(staff)}
                              className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE3D5] border border-[#E0D7C8] text-[#113227] text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1"
                              title="Configure granular permissions"
                            >
                              <Sliders className="w-3 h-3 text-[#C58A3E]" />
                              <span className="hidden sm:inline">
                                Permissions
                              </span>
                            </button>
                            <button
                              onClick={() => setSelectedStaffDrawer(staff)}
                              className="p-1.5 rounded-lg text-[#8A9691] hover:text-[#113227] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                              title="View full staff profile"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="pt-4 border-t border-[#F0EBE1] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A8782] gap-2">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-[#1F5946]" />
                <span>
                  Showing {filteredStaff.length} professionals across{" "}
                  {departmentFilter === "All"
                    ? "all firm departments"
                    : departmentFilter}
                </span>
              </div>
              <span className="font-mono text-[11px] text-[#55605B]">
                Average Billable Utilization: <strong>89.6%</strong>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CA ARTICLESHIP TRACKER VIEW */}
      {/* ========================================================================= */}
      {subTab === "students" && (
        <div className="space-y-6">
          {/* Controls Bar: Search, Exam Level Filter, Exam Leave Filter & Add Trainee */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#EBE6DD] shadow-2xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9691]" />
                <input
                  id="student-search-input"
                  type="text"
                  placeholder="Search by student name, Reg No, ICAB No, Batch, Principal..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              {/* Exam Level Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-bold text-[#8A9691] whitespace-nowrap">
                  Exam:
                </span>
                <select
                  id="student-exam-filter"
                  value={examLevelFilter}
                  onChange={(e) => setExamLevelFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                >
                  <option value="All">All Exam Levels</option>
                  <option value="Knowledge Level">Knowledge Level</option>
                  <option value="Business Level">Business Level</option>
                  <option value="Advanced Level">Advanced Level</option>
                  <option value="Qualified">Qualified</option>
                </select>
              </div>

              {/* Exam Leave Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-bold text-[#8A9691] whitespace-nowrap">
                  Leave:
                </span>
                <select
                  id="student-leave-filter"
                  value={examLeaveFilter}
                  onChange={(e) => setExamLeaveFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                >
                  <option value="All">All Leave Status</option>
                  <option value="On Exam Leave">On Exam Leave</option>
                  <option value="Approved Upcoming">Approved Upcoming</option>
                  <option value="None">None (Active Duty)</option>
                </select>
              </div>
            </div>

            {/* Export & Add Student Buttons */}
            <div className="flex items-center space-x-2 shrink-0">
              <button
                id="btn-export-articleship-excel"
                onClick={() => handleExportArticleship("Excel")}
                className="px-3 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE3D5] border border-[#E0D7C8] text-[#113227] text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
                title="Export list as Excel spreadsheet"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#1F5946]" />
                <span className="hidden sm:inline">Export Excel</span>
              </button>

              <button
                id="btn-export-articleship-pdf"
                onClick={() => handleExportArticleship("PDF")}
                className="px-3 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE3D5] border border-[#E0D7C8] text-[#113227] text-xs font-bold flex items-center space-x-1.5 cursor-pointer transition-colors"
                title="Export list as ICAB compliant PDF"
              >
                <FileText className="w-3.5 h-3.5 text-[#8A5A18]" />
                <span className="hidden sm:inline">Export PDF</span>
              </button>

              <button
                id="btn-open-add-student-modal"
                onClick={() => setIsAddStudentModalOpen(true)}
                className="btn-forest px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs hover:shadow-sm cursor-pointer transition-all active:scale-98"
              >
                <UserPlus className="w-3.5 h-3.5 text-[#C58A3E]" />
                <span>Add Articled Student</span>
              </button>
            </div>
          </div>

          {/* CA Articleship Data Table */}
          <div className="bg-white rounded-3xl border border-[#EBE6DD] p-5 sm:p-6 shadow-2xs">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[900px]">
                <thead>
                  <tr className="border-b border-[#EBE5DA] text-[11px] font-bold text-[#8A9691] uppercase tracking-wider">
                    <th className="pb-3 pl-1">Articled Trainee &amp; ID</th>
                    <th className="pb-3 px-3">Principal Partner</th>
                    <th className="pb-3 px-3">Batch &amp; ICAB Reg</th>
                    <th className="pb-3 px-3">Enrolment &amp; Completion</th>
                    <th className="pb-3 px-3">Remaining Term</th>
                    <th className="pb-3 px-3">Exam Level &amp; Leave Status</th>
                    <th className="pb-3 pr-1 text-right">Actions</th>
                  </tr>
                </thead>
                <motion.tbody
                  key={`${studentSearch}-${examLevelFilter}-${examLeaveFilter}`}
                  className="divide-y divide-[#F0EBE1] text-xs"
                  initial={{ opacity: 0.65 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                >
                  {filteredStudents.map((student) => {
                    const remainingTermStr = calculateRemainingTerm(
                      student.completionDate,
                    );

                    return (
                      <tr
                        key={student.id}
                        className="hover:bg-[#FAF8F5] transition-colors group cursor-pointer"
                        onClick={() => setEditingStudentModal(student)}
                      >
                        {/* Trainee Name & Registration/Student ID */}
                        <td className="py-3.5 pl-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-[#FAF0DE] border border-[#EADBBF] text-[#8A5A18] font-bold text-xs flex items-center justify-center shrink-0">
                              {student.name.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[#1C1F1E] group-hover:text-[#113227] truncate">
                                {student.name}
                              </div>
                              <div className="text-[10.5px] font-mono text-[#C58A3E] font-semibold">
                                {student.registrationNo}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Principal Partner */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            <div className="font-semibold text-[#1C1F1E] text-xs flex items-center gap-1">
                              <UserCheck className="w-3.5 h-3.5 text-[#C58A3E]" />
                              <span>{student.principalMentor}</span>
                            </div>
                            <div className="text-[10px] text-[#7A8782]">
                              Principal Mentor Agreement
                            </div>
                          </div>
                        </td>

                        {/* Articleship Batch & ICAB Reg */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10.5px] font-semibold bg-[#FAF7F2] border border-[#E5DDD0] text-[#3D4742]">
                              {student.batch}
                            </span>
                            <div className="text-[10px] font-mono text-[#8A9691]">
                              {student.icabRegNo}
                            </div>
                          </div>
                        </td>

                        {/* Enrolment Date & Completion Date */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5 text-xs font-medium">
                            <div className="text-[#333E38]">
                              <span className="text-[#8A9691] text-[10px]">
                                Start:
                              </span>{" "}
                              {student.joiningDate}
                            </div>
                            <div className="text-[#113227] font-semibold">
                              <span className="text-[#8A9691] text-[10px]">
                                End:
                              </span>{" "}
                              {student.completionDate}
                            </div>
                          </div>
                        </td>

                        {/* Remaining Term */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-[#E1F3EE] text-[#1F5946] font-mono text-[11px] font-bold">
                              <Clock className="w-3 h-3" />
                              <span>{remainingTermStr}</span>
                            </span>
                            <div className="text-[10px] text-[#7A8782]">
                              {student.workingDaysLogged} days logged •{" "}
                              {student.leaveBalanceDays}d leave left
                            </div>
                          </div>
                        </td>

                        {/* Exam Level & Exam Leave Status */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-1.5">
                              <span className="text-[10.5px] font-bold text-[#1C1F1E] bg-[#FAF8F5] px-2 py-0.5 rounded border border-[#EBE6DD]">
                                {student.examLevel}
                              </span>
                            </div>
                            {student.examLeaveStatus === "On Exam Leave" ? (
                              <span className="motion-badge inline-flex items-center space-x-1 text-[10px] font-bold text-[#8E362C] bg-[#FDE6E2] px-2 py-0.2 rounded">
                                <AlertCircle className="w-2.5 h-2.5" />
                                <span>On Exam Leave</span>
                              </span>
                            ) : student.examLeaveStatus ===
                              "Approved Upcoming" ? (
                              <span className="motion-badge inline-flex items-center space-x-1 text-[10px] font-bold text-[#8A5A18] bg-[#FAF0DE] px-2 py-0.2 rounded">
                                <Clock className="w-2.5 h-2.5" />
                                <span>Exam Leave Approved</span>
                              </span>
                            ) : (
                              <span className="text-[10px] text-[#7A8782]">
                                Active on Engagements
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action Buttons */}
                        <td
                          className="py-3.5 pr-1 text-right"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            id={`btn-edit-student-${student.id}`}
                            onClick={() => setEditingStudentModal(student)}
                            className="px-2.5 py-1 rounded-lg bg-[#FAF7F2] hover:bg-[#EAE3D5] border border-[#E0D7C8] text-[#113227] text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1 ml-auto"
                          >
                            <Edit3 className="w-3 h-3 text-[#C58A3E]" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </motion.tbody>
              </table>
            </div>

            {/* Trainee Footer Stats */}
            <div className="pt-4 border-t border-[#F0EBE1] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A8782] gap-2">
              <div className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4 text-[#1F5946]" />
                <span>ICAB Mandatory 3-Year Articleship Period Governance</span>
              </div>
              <div className="flex items-center space-x-3 text-[11px]">
                <span>
                  Total Trainees:{" "}
                  <strong className="text-[#1C1F1E]">
                    {studentList.length}
                  </strong>
                </span>
                <span>•</span>
                <span>
                  On Exam Leave:{" "}
                  <strong className="text-[#8E362C]">
                    {
                      studentList.filter(
                        (s) => s.examLeaveStatus === "On Exam Leave",
                      ).length
                    }
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SLIDE-OVER DRAWER: DETAILED STAFF PROFILE WITH TEAMS, BILLING RATE & LOGS */}
      {/* ========================================================================= */}
      {selectedStaffDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setSelectedStaffDrawer(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-[#E5DDD0] shadow-2xl p-6 flex flex-col justify-between text-left overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                {/* Header with Close */}
                <div className="flex items-start justify-between pb-4 border-b border-[#F0EBE1]">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#113227] text-white font-bold text-base flex items-center justify-center border border-[#C58A3E] shadow-sm">
                      {selectedStaffDrawer.name
                        .split(" ")
                        .filter((n) => !n.includes(","))
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <h3 className="text-base font-serif font-bold text-[#1C1F1E]">
                        {selectedStaffDrawer.name}
                      </h3>
                      <p className="text-xs text-[#7A8782]">
                        {selectedStaffDrawer.designation}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedStaffDrawer(null)}
                    className="p-2 rounded-xl text-[#7A8782] hover:bg-[#FAF7F2] hover:text-[#1C1F1E] transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Core Profile Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DA] space-y-1">
                    <span className="text-[10.5px] font-bold text-[#8A9691] uppercase">
                      Department
                    </span>
                    <p className="text-xs font-bold text-[#1C1F1E]">
                      {selectedStaffDrawer.department}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DA] space-y-1">
                    <span className="text-[10.5px] font-bold text-[#8A9691] uppercase">
                      Practice Role
                    </span>
                    <p className="text-xs font-bold text-[#113227]">
                      {selectedStaffDrawer.role}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DA] space-y-1">
                    <span className="text-[10.5px] font-bold text-[#8A9691] uppercase">
                      Hourly Billing Rate
                    </span>
                    <p className="text-xs font-bold font-mono text-[#8A5A18]">
                      ৳
                      {(
                        selectedStaffDrawer.hourlyRate || 4500
                      ).toLocaleString()}
                      /hr
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DA] space-y-1">
                    <span className="text-[10.5px] font-bold text-[#8A9691] uppercase">
                      Billable Velocity
                    </span>
                    <p className="text-xs font-bold font-mono text-[#1F5946]">
                      {selectedStaffDrawer.billableUtilization}% Target
                    </p>
                  </div>
                </div>

                {/* Contact Coordinates */}
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DA] space-y-2 text-xs">
                  <span className="text-[10.5px] font-bold text-[#8A9691] uppercase block">
                    Direct Coordinates
                  </span>
                  <div className="flex items-center space-x-2 text-[#333E38]">
                    <Mail className="w-3.5 h-3.5 text-[#8A9691]" />
                    <span className="font-mono">
                      {selectedStaffDrawer.email}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[#333E38]">
                    <Phone className="w-3.5 h-3.5 text-[#8A9691]" />
                    <span className="font-mono">
                      {selectedStaffDrawer.phone}
                    </span>
                  </div>
                </div>

                {/* Assigned Teams & Workgroups */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#1C1F1E] flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-[#C58A3E]" />
                    <span>Assigned Practice Teams &amp; Desks</span>
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      selectedStaffDrawer.assignedTeams || ["Core Audit Alpha"]
                    ).map((team, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#FAF0DE] border border-[#EADBBF] text-[#8A5A18]"
                      >
                        {team}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Granted Permissions Template */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1F1E] flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#1F5946]" />
                      <span>Security &amp; Audit Authorities</span>
                    </span>
                    <button
                      onClick={() =>
                        handleOpenPermissionsModal(selectedStaffDrawer)
                      }
                      className="text-[11px] font-bold text-[#113227] hover:underline"
                    >
                      Edit Template
                    </button>
                  </div>
                  <div className="space-y-1 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                    {(
                      selectedStaffDrawer.permissions || [
                        "Working Paper Drafting",
                      ]
                    ).map((perm, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-[#FAF8F5] border border-[#ECE5D9] text-[11px] text-[#3D4742] flex items-center space-x-2"
                      >
                        <Check className="w-3.5 h-3.5 text-[#1F5946] shrink-0" />
                        <span className="truncate">{perm}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Activity Log */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#1C1F1E] flex items-center space-x-1.5">
                    <Activity className="w-3.5 h-3.5 text-[#1D526D]" />
                    <span>Audit &amp; Practice Activity Trail</span>
                  </span>
                  <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                    {(
                      selectedStaffDrawer.activityLogs || [
                        {
                          id: "1",
                          action: "Timesheet Verified",
                          timestamp: "Today",
                          details: "Logged 4.5h on substantive procedures.",
                        },
                      ]
                    ).map((log) => (
                      <div
                        key={log.id}
                        className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE5D9] text-xs space-y-0.5"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#1C1F1E]">
                          <span>{log.action}</span>
                          <span className="text-[10px] font-mono text-[#8A9691]">
                            {log.timestamp}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#66706B] leading-tight">
                          {log.details}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-4 border-t border-[#F0EBE1] flex items-center justify-between">
                <button
                  onClick={() =>
                    handleOpenPermissionsModal(selectedStaffDrawer)
                  }
                  className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE3D5] border border-[#E0D7C8] text-[#113227] text-xs font-bold cursor-pointer transition-colors"
                >
                  Configure Permissions
                </button>
                <button
                  onClick={() => setSelectedStaffDrawer(null)}
                  className="btn-forest px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW STAFF MEMBER MODAL */}
      {/* ========================================================================= */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5DDD0] shadow-2xl p-6 sm:p-7 max-w-lg w-full text-left space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1C1F1E]">
                  Add Staff Member / Professional
                </h3>
                <p className="text-xs text-[#7A8782]">
                  Onboard partner, manager, or associate with practice billing
                  rates.
                </p>
              </div>
              <button
                onClick={() => setIsAddStaffModalOpen(false)}
                className="p-2 rounded-xl text-[#7A8782] hover:bg-[#FAF7F2] hover:text-[#1C1F1E] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateStaffSubmit}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#1C1F1E] mb-1">
                  Full Name &amp; Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Mohammad Tariqul Islam, ACA"
                  value={newStaff.name}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="tariqul@avenquis.com"
                    value={newStaff.email}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+880 1711-000000"
                    value={newStaff.phone}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Department
                  </label>
                  <select
                    value={newStaff.department}
                    onChange={(e) =>
                      setNewStaff({
                        ...newStaff,
                        department: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="Audit & Assurance">
                      Audit &amp; Assurance
                    </option>
                    <option value="Taxation & Regulatory">
                      Taxation &amp; Regulatory
                    </option>
                    <option value="Advisory">Advisory &amp; Valuation</option>
                    <option value="Finance & Admin">Finance &amp; Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Role Template
                  </label>
                  <select
                    value={newStaff.role}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, role: e.target.value as any })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="Partner">Partner</option>
                    <option value="Senior Manager">Senior Manager</option>
                    <option value="Manager">Manager</option>
                    <option value="Senior Associate">Senior Associate</option>
                    <option value="Associate">Associate</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Designation Title
                  </label>
                  <input
                    type="text"
                    value={newStaff.designation}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, designation: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Hourly Rate (BDT / hr)
                  </label>
                  <input
                    type="number"
                    value={newStaff.hourlyRate}
                    onChange={(e) =>
                      setNewStaff({
                        ...newStaff,
                        hourlyRate: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#1C1F1E] mb-1">
                  Primary Team / Desk Assignment
                </label>
                <input
                  type="text"
                  placeholder="e.g., Core Audit Alpha"
                  value={newStaff.assignedTeams}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, assignedTeams: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-[#66706B] font-bold hover:bg-[#F2ECE1] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-forest px-5 py-2 rounded-xl text-xs font-bold shadow-2xs"
                >
                  Confirm Staff Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: EDIT PERMISSIONS & ROLE TEMPLATE MODAL */}
      {/* ========================================================================= */}
      {editingPermissionsStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5DDD0] shadow-2xl p-6 sm:p-7 max-w-lg w-full text-left space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1C1F1E]">
                  Edit Permissions: {editingPermissionsStaff.name}
                </h3>
                <p className="text-xs text-[#7A8782]">
                  Grant or revoke granular audit sign-off, approval, and
                  management authorities.
                </p>
              </div>
              <button
                onClick={() => setEditingPermissionsStaff(null)}
                className="p-2 rounded-xl text-[#7A8782] hover:bg-[#FAF7F2] hover:text-[#1C1F1E] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-bold text-[#8A9691] uppercase block">
                Select Authorized Capabilities
              </span>

              <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                {ALL_PERMISSIONS.map((perm) => {
                  const isChecked = staffPermissions.includes(perm);
                  return (
                    <label
                      key={perm}
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-all ${
                        isChecked
                          ? "bg-[#E1F3EE]/40 border-[#1F5946] font-bold text-[#113227]"
                          : "bg-[#FAF8F5] border-[#E8E1D5] text-[#66706B] hover:bg-white"
                      }`}
                    >
                      <div className="flex items-center space-x-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleTogglePermission(perm)}
                          className="rounded text-[#113227] focus:ring-[#113227] cursor-pointer"
                        />
                        <span>{perm}</span>
                      </div>
                      {isChecked && (
                        <ShieldCheck className="w-3.5 h-3.5 text-[#1F5946]" />
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-between">
              <span className="text-[11px] text-[#7A8782]">
                {staffPermissions.length} permissions active
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingPermissionsStaff(null)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-[#66706B] font-bold hover:bg-[#F2ECE1] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePermissions}
                  className="btn-forest px-5 py-2 rounded-xl text-xs font-bold shadow-2xs"
                >
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: ADD CA ARTICLED STUDENT MODAL */}
      {/* ========================================================================= */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5DDD0] shadow-2xl p-6 sm:p-7 max-w-lg w-full text-left space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1C1F1E]">
                  Register Articled Student (Trainee)
                </h3>
                <p className="text-xs text-[#7A8782]">
                  Assign principal partner mentor and ICAB Form-11 registration
                  period.
                </p>
              </div>
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="p-2 rounded-xl text-[#7A8782] hover:bg-[#FAF7F2] hover:text-[#1C1F1E] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleCreateStudentSubmit}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-[#1C1F1E] mb-1">
                  Student Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Kazi Raihan Ahmed"
                  value={newStudent.name}
                  onChange={(e) =>
                    setNewStudent({ ...newStudent, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="raihan.art@avenquis.com"
                    value={newStudent.email}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, email: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    placeholder="+880 1700-112233"
                    value={newStudent.phone}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, phone: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Principal Partner Mentor *
                  </label>
                  <select
                    value={newStudent.principalMentor}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        principalMentor: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="Fouzia Haque, FCA">
                      Fouzia Haque, FCA (Senior Partner)
                    </option>
                    <option value="Zahirul Islam, FCA">
                      Zahirul Islam, FCA (Manager / Partner)
                    </option>
                    <option value="Mahmudur Rahman, ACA">
                      Mahmudur Rahman, ACA
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Articleship Batch
                  </label>
                  <input
                    type="text"
                    value={newStudent.batch}
                    onChange={(e) =>
                      setNewStudent({ ...newStudent, batch: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Enrolment / Joining Date
                  </label>
                  <input
                    type="date"
                    value={newStudent.joiningDate}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        joiningDate: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Target Completion Date (3 Yrs)
                  </label>
                  <input
                    type="date"
                    value={newStudent.completionDate}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        completionDate: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    ICAB Exam Level
                  </label>
                  <select
                    value={newStudent.examLevel}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        examLevel: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="Knowledge Level">Knowledge Level</option>
                    <option value="Business Level">Business Level</option>
                    <option value="Advanced Level">Advanced Level</option>
                    <option value="Qualified">Qualified</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Monthly Stipend (BDT)
                  </label>
                  <input
                    type="number"
                    value={newStudent.stipendAmount}
                    onChange={(e) =>
                      setNewStudent({
                        ...newStudent,
                        stipendAmount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-[#66706B] font-bold hover:bg-[#F2ECE1] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-forest px-5 py-2 rounded-xl text-xs font-bold shadow-2xs"
                >
                  Register CA Trainee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: EDIT CA ARTICLED STUDENT MODAL */}
      {/* ========================================================================= */}
      {editingStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5DDD0] shadow-2xl p-6 sm:p-7 max-w-lg w-full text-left space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div>
                <h3 className="text-lg font-serif font-bold text-[#1C1F1E]">
                  Edit Articleship Record: {editingStudentModal.name}
                </h3>
                <p className="text-xs text-[#7A8782]">
                  Update exam status, exam leave, principal partner assignment,
                  or period dates.
                </p>
              </div>
              <button
                onClick={() => setEditingStudentModal(null)}
                className="p-2 rounded-xl text-[#7A8782] hover:bg-[#FAF7F2] hover:text-[#1C1F1E] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleUpdateStudentSubmit}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Principal Partner Mentor
                  </label>
                  <select
                    value={editingStudentModal.principalMentor}
                    onChange={(e) =>
                      setEditingStudentModal({
                        ...editingStudentModal,
                        principalMentor: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="Fouzia Haque, FCA">Fouzia Haque, FCA</option>
                    <option value="Zahirul Islam, FCA">
                      Zahirul Islam, FCA
                    </option>
                    <option value="Mahmudur Rahman, ACA">
                      Mahmudur Rahman, ACA
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Articleship Batch
                  </label>
                  <input
                    type="text"
                    value={editingStudentModal.batch}
                    onChange={(e) =>
                      setEditingStudentModal({
                        ...editingStudentModal,
                        batch: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    ICAB Exam Level
                  </label>
                  <select
                    value={editingStudentModal.examLevel}
                    onChange={(e) =>
                      setEditingStudentModal({
                        ...editingStudentModal,
                        examLevel: e.target
                          .value as StudentArticle["examLevel"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="Knowledge Level">Knowledge Level</option>
                    <option value="Business Level">Business Level</option>
                    <option value="Advanced Level">Advanced Level</option>
                    <option value="Qualified">Qualified</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Exam Leave Status
                  </label>
                  <select
                    value={editingStudentModal.examLeaveStatus || "None"}
                    onChange={(e) =>
                      setEditingStudentModal({
                        ...editingStudentModal,
                        examLeaveStatus: e.target
                          .value as StudentArticle["examLeaveStatus"],
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="None">None (Active on Duty)</option>
                    <option value="On Exam Leave">
                      On Exam Leave (Study Period)
                    </option>
                    <option value="Approved Upcoming">Approved Upcoming</option>
                    <option value="Completed">Completed Exams</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Joining Date
                  </label>
                  <input
                    type="date"
                    value={editingStudentModal.joiningDate}
                    onChange={(e) =>
                      setEditingStudentModal({
                        ...editingStudentModal,
                        joiningDate: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1C1F1E] mb-1">
                    Completion Date
                  </label>
                  <input
                    type="date"
                    value={editingStudentModal.completionDate}
                    onChange={(e) =>
                      setEditingStudentModal({
                        ...editingStudentModal,
                        completionDate: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#D5CBBC] text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingStudentModal(null)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] text-[#66706B] font-bold hover:bg-[#F2ECE1] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-forest px-5 py-2 rounded-xl text-xs font-bold shadow-2xs"
                >
                  Update Articleship Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
