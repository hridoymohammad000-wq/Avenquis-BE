import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Briefcase,
  FolderGit2,
  Search,
  Plus,
  Building,
  Calendar,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ShieldAlert,
  ShieldCheck,
  Phone,
  Mail,
  FileText,
  FileCheck,
  X,
  ChevronRight,
  User,
  Users,
  Layers,
  Kanban,
  Table as TableIcon,
  DollarSign,
  Receipt,
  Building2,
  FileCode,
  ArrowUpRight,
  Check,
  Sparkles,
  Award,
} from "lucide-react";
import {
  ClientRecord,
  EngagementRecord,
  StaffMember,
  StudentArticle,
  EngagementTeamMemberRole,
} from "../../types";

interface CrmEngagementsViewProps {
  initialTab?: "crm" | "engagements";
  clients: ClientRecord[];
  engagements: EngagementRecord[];
  staffList?: StaffMember[];
  studentList?: StudentArticle[];
  onAddClient: (client: Partial<ClientRecord>) => void;
  onAddEngagement: (engagement: Partial<EngagementRecord>) => void;
  onUpdateEngagementStage: (
    engagementId: string,
    stage: EngagementRecord["stage"],
  ) => void;
}

export const CrmEngagementsView: React.FC<CrmEngagementsViewProps> = ({
  initialTab = "crm",
  clients,
  engagements,
  staffList = [],
  studentList = [],
  onAddClient,
  onAddEngagement,
  onUpdateEngagementStage,
}) => {
  const [activeTab, setActiveTab] = useState<"crm" | "engagements">(initialTab);

  // CRM Filters
  const [clientSearch, setClientSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState<
    "All" | "Manufacturing" | "Garments" | "Banking" | "Tech"
  >("All");
  const [riskFilter, setRiskFilter] = useState<
    "All" | "Low" | "Medium" | "High"
  >("All");

  // Engagement Filters & View Modes
  const [engagementSearch, setEngagementSearch] = useState("");
  const [engagementServiceFilter, setEngagementServiceFilter] =
    useState<string>("All");
  const [engagementViewMode, setEngagementViewMode] = useState<
    "kanban" | "table"
  >("kanban");

  // Modals and Drawers
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isEngagementModalOpen, setIsEngagementModalOpen] = useState(false);
  const [selectedClientDrawer, setSelectedClientDrawer] =
    useState<ClientRecord | null>(null);
  const [selectedEngagementDetail, setSelectedEngagementDetail] =
    useState<EngagementRecord | null>(null);

  // New Client Form State
  const [newClient, setNewClient] = useState({
    name: "",
    industry: "Manufacturing" as ClientRecord["industry"],
    tradeLicenseNo: "TRAD/DSCC/0",
    contactPerson: "",
    email: "",
    phone: "+880 2 ",
    taxId: "TIN-",
    relationshipPartner: "Fouzia Haque, FCA",
    annualFee: 850000,
    riskRating: "Low" as ClientRecord["riskRating"],
    companyOverview: "",
    incorporationNo: "C-",
    binNo: "",
    registeredAddress: "",
  });

  // New Engagement Form State with defined team member roles
  const [newEngagement, setNewEngagement] = useState({
    clientName: clients[0]?.name || "Apex Footwear & Polymer Ltd.",
    serviceType: "Statutory Audit" as EngagementRecord["serviceType"],
    scopeDescription:
      "Statutory financial statement audit in accordance with International Standards on Auditing (ISA) and ICAB guidelines.",
    leadPartner: "Fouzia Haque, FCA",
    leadManager: "Zahirul Islam, FCA",
    auditInCharge: "Nadia Sharmin, ACCA",
    articledStudents: ["Sabbir Ahmed (Art)", "Farhan Kabir (Art)"],
    dueDate: "2026-10-31",
    yearEndDate: "30 Jun 2026",
    targetSignOffDate: "25 Oct 2026",
    budgetHours: 220,
    stage: "Planning" as EngagementRecord["stage"],
  });

  // Available industry filter options
  const INDUSTRY_OPTIONS: Array<
    "All" | "Manufacturing" | "Garments" | "Banking" | "Tech"
  > = ["All", "Manufacturing", "Garments", "Banking", "Tech"];

  // Filtered Clients
  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.clientCode.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.contactPerson.toLowerCase().includes(clientSearch.toLowerCase()) ||
      c.taxId.toLowerCase().includes(clientSearch.toLowerCase()) ||
      (c.tradeLicenseNo &&
        c.tradeLicenseNo.toLowerCase().includes(clientSearch.toLowerCase()));

    const matchesIndustry =
      industryFilter === "All" ||
      c.industry.toLowerCase().includes(industryFilter.toLowerCase());
    const matchesRisk = riskFilter === "All" || c.riskRating === riskFilter;

    return matchesSearch && matchesIndustry && matchesRisk;
  });

  // Filtered Engagements
  const filteredEngagements = engagements.filter((e) => {
    const matchesSearch =
      e.clientName.toLowerCase().includes(engagementSearch.toLowerCase()) ||
      e.engagementCode.toLowerCase().includes(engagementSearch.toLowerCase()) ||
      e.leadManager.toLowerCase().includes(engagementSearch.toLowerCase()) ||
      e.leadPartner.toLowerCase().includes(engagementSearch.toLowerCase());

    const matchesService =
      engagementServiceFilter === "All" ||
      e.serviceType === engagementServiceFilter;
    return matchesSearch && matchesService;
  });

  // 5 Canonical Kanban Stages
  const KANBAN_STAGES: Array<{
    id: EngagementRecord["stage"];
    label: string;
    tag: string;
    description: string;
  }> = [
    {
      id: "Planning",
      label: "Engagement Setup & Planning",
      tag: "STAGE 1",
      description: "ISA 300 Strategy, Materiality, Team Briefing",
    },
    {
      id: "Fieldwork",
      label: "Audit Fieldwork",
      tag: "STAGE 2",
      description: "Substantive testing, vouching, sample audits",
    },
    {
      id: "Review",
      label: "Manager Review",
      tag: "STAGE 3",
      description: "Working paper cross-index & ISA 220 checks",
    },
    {
      id: "Sign-off",
      label: "Partner Review",
      tag: "STAGE 4",
      description: "Partner concurrence & EQCR clearance",
    },
    {
      id: "Completed",
      label: "Finalized / Signed",
      tag: "STAGE 5",
      description: "Auditor report issued & signed",
    },
  ];

  // Submit New Client
  const handleClientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClient.name.trim() || !newClient.email.trim()) return;

    const shortCode =
      newClient.name
        .replace(/[^A-Z]/gi, "")
        .slice(0, 3)
        .toUpperCase() || "CLI";
    const clientCode = `CLI-${shortCode}-0${clients.length + 1}`;

    onAddClient({
      clientCode,
      name: newClient.name,
      industry: newClient.industry,
      contactPerson: newClient.contactPerson || "Managing Director",
      email: newClient.email,
      phone: newClient.phone || "+880 2 000000",
      taxId: newClient.taxId || "TIN-0000000000",
      tradeLicenseNo: newClient.tradeLicenseNo || "TRAD/DSCC/000000",
      relationshipPartner: newClient.relationshipPartner,
      annualFee: Number(newClient.annualFee) || 750000,
      status: "Active",
      activeEngagements: 1,
      riskRating: newClient.riskRating,
      companyOverview:
        newClient.companyOverview ||
        `${newClient.name} is a premier enterprise in the ${newClient.industry} sector.`,
      kycDetails: {
        tradeLicenseNo: newClient.tradeLicenseNo,
        incorporationNo: newClient.incorporationNo || "C-00000/2026",
        tinNo: newClient.taxId,
        binNo: newClient.binNo || "000000000-0101",
        registeredAddress: newClient.registeredAddress || "Dhaka, Bangladesh",
        kycVerifiedDate: "31 Aug 2026",
        directors: [newClient.contactPerson || "Managing Director"],
        bankers: ["Eastern Bank PLC"],
      },
      billingHistory: [
        {
          id: `inv-${Date.now()}`,
          invoiceNo: `INV-2026-${Math.floor(100 + Math.random() * 900)}`,
          engagement: "Retainer & Engagement Onboarding",
          amount: Math.round(Number(newClient.annualFee) * 0.3),
          date: "Today",
          status: "Pending",
        },
      ],
    });

    setIsClientModalOpen(false);
    setNewClient({
      name: "",
      industry: "Manufacturing",
      tradeLicenseNo: "TRAD/DSCC/0",
      contactPerson: "",
      email: "",
      phone: "+880 2 ",
      taxId: "TIN-",
      relationshipPartner: "Fouzia Haque, FCA",
      annualFee: 850000,
      riskRating: "Low",
      companyOverview: "",
      incorporationNo: "C-",
      binNo: "",
      registeredAddress: "",
    });
  };

  // Submit New Engagement
  const handleEngagementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEngagement.clientName) return;

    const prefixMap: Record<EngagementRecord["serviceType"], string> = {
      "Statutory Audit": "AUD",
      "Tax Compliance": "TAX",
      "Due Diligence": "DD",
      "Internal Audit": "INT",
      "Transfer Pricing": "TP",
      "VAT Assessment": "VAT",
      "Special Advisory": "ADV",
    };

    const prefix = prefixMap[newEngagement.serviceType] || "ENG";
    const engagementCode = `${prefix}-2026-${Math.floor(100 + Math.random() * 900)}`;

    const teamRoles: EngagementTeamMemberRole[] = [
      {
        name: newEngagement.leadPartner,
        role: "Engagement Partner",
        avatarInitials: newEngagement.leadPartner
          .split(" ")
          .filter((n) => !n.includes(","))
          .map((n) => n[0])
          .slice(0, 2)
          .join(""),
      },
      {
        name: newEngagement.leadManager,
        role: "Audit Manager",
        avatarInitials: newEngagement.leadManager
          .split(" ")
          .filter((n) => !n.includes(","))
          .map((n) => n[0])
          .slice(0, 2)
          .join(""),
      },
      {
        name: newEngagement.auditInCharge,
        role: "In-Charge / Senior",
        avatarInitials: newEngagement.auditInCharge
          .split(" ")
          .filter((n) => !n.includes(","))
          .map((n) => n[0])
          .slice(0, 2)
          .join(""),
      },
      ...newEngagement.articledStudents.map((st) => ({
        name: st,
        role: "Articled Student" as const,
        avatarInitials: st.slice(0, 2).toUpperCase(),
      })),
    ];

    onAddEngagement({
      engagementCode,
      clientName: newEngagement.clientName,
      serviceType: newEngagement.serviceType,
      stage: newEngagement.stage,
      health: "On Track",
      leadManager: newEngagement.leadManager,
      leadPartner: newEngagement.leadPartner,
      teamMembers: [
        newEngagement.auditInCharge,
        ...newEngagement.articledStudents,
      ],
      teamMemberRoles: teamRoles,
      dueDate: newEngagement.dueDate,
      yearEndDate: newEngagement.yearEndDate,
      targetSignOffDate: newEngagement.targetSignOffDate,
      progressPercent: 12,
      budgetHours: Number(newEngagement.budgetHours) || 200,
      loggedHours: 14,
      statusColor: "#113227",
      scopeDescription: newEngagement.scopeDescription,
    });

    setIsEngagementModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn text-left pb-12">
      {/* 1. TOP HEADER & VIEW TOGGLER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-7 rounded-3xl bg-white border border-[#EBE6DD] shadow-2xs relative overflow-hidden">
        <div className="space-y-1.5 z-10">
          <div className="inline-flex items-center space-x-2 bg-[#FAF0DE] border border-[#EADBBF] px-3 py-1 rounded-full text-[10.5px] font-bold tracking-wider text-[#8A5A18]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C58A3E]" />
            <span className="uppercase">
              AVENQUIS PRACTICE CRM &amp; ENGAGEMENT BOARD
            </span>
            <span className="text-[#C58A3E] font-serif">✦</span>
            <span>ISA 300 &amp; 220 WORKFLOWS</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1F1E] tracking-tight">
            Client Accounts &amp; Engagement Management
          </h1>
          <p className="text-xs sm:text-sm text-[#66706B] max-w-2xl leading-relaxed">
            Manage corporate client relationships, KYC &amp; trade registries,
            multidisciplinary audit engagements, stage-gate review pipelines,
            and cross-functional engagement teams.
          </p>
        </div>

        {/* Top Tab Switcher */}
        <div className="flex items-center space-x-2 bg-[#FAF7F2] p-1.5 rounded-2xl border border-[#E8E1D5] shrink-0 z-10">
          <button
            id="tab-client-crm"
            onClick={() => setActiveTab("crm")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === "crm"
                ? "bg-[#113227] text-white shadow-2xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Client CRM ({clients.length})</span>
          </button>

          <button
            id="tab-engagements-board"
            onClick={() => setActiveTab("engagements")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
              activeTab === "engagements"
                ? "bg-[#113227] text-white shadow-2xs"
                : "text-[#66706B] hover:text-[#1C1F1E]"
            }`}
          >
            <FolderGit2 className="w-4 h-4" />
            <span>Engagements &amp; Teams ({engagements.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CLIENT CRM VIEW */}
      {/* ========================================================================= */}
      {activeTab === "crm" && (
        <div className="space-y-6">
          {/* Controls Bar: Search, Industry Tag Filters, Risk Filter & "+ New Client" */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#EBE6DD] shadow-2xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9691]" />
                <input
                  id="client-search-input"
                  type="text"
                  placeholder="Search by company name, code, contact person, TIN, trade license..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              {/* Industry Tag Filters */}
              <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-[11px] font-bold text-[#8A9691] mr-1 hidden sm:inline">
                  Industry:
                </span>
                {INDUSTRY_OPTIONS.map((ind) => (
                  <button
                    key={ind}
                    id={`filter-industry-${ind.toLowerCase()}`}
                    onClick={() => setIndustryFilter(ind)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      industryFilter === ind
                        ? "bg-[#113227] text-white shadow-2xs"
                        : "bg-[#FAF7F2] text-[#66706B] hover:text-[#1C1F1E] border border-[#E8E1D5]"
                    }`}
                  >
                    {ind}
                  </button>
                ))}
              </div>

              {/* Risk Category Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-bold text-[#8A9691] whitespace-nowrap">
                  Risk:
                </span>
                <select
                  id="client-risk-filter"
                  value={riskFilter}
                  onChange={(e) => setRiskFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                >
                  <option value="All">All Risk</option>
                  <option value="Low">Low Risk</option>
                  <option value="Medium">Medium Risk</option>
                  <option value="High">High Risk</option>
                </select>
              </div>
            </div>

            {/* "+ New Client" Trigger */}
            <button
              id="btn-open-new-client-modal"
              onClick={() => setIsClientModalOpen(true)}
              className="btn-forest px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs hover:shadow-sm cursor-pointer transition-all shrink-0 active:scale-98"
            >
              <Plus className="w-3.5 h-3.5 text-[#C58A3E]" />
              <span>New Client</span>
            </button>
          </div>

          {/* Client List Data Table */}
          <div className="bg-white rounded-3xl border border-[#EBE6DD] p-5 sm:p-6 shadow-2xs">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[920px]">
                <thead>
                  <tr className="border-b border-[#EBE5DA] text-[11px] font-bold text-[#8A9691] uppercase tracking-wider">
                    <th className="pb-3 pl-1">Client &amp; Company Name</th>
                    <th className="pb-3 px-3">Trade License / Reg No</th>
                    <th className="pb-3 px-3">Primary Contact Person</th>
                    <th className="pb-3 px-3">Email &amp; Direct Phone</th>
                    <th className="pb-3 px-3">Active Engagements</th>
                    <th className="pb-3 px-3">Relationship Partner</th>
                    <th className="pb-3 px-3">Risk Category</th>
                    <th className="pb-3 pr-1 text-right">Profile</th>
                  </tr>
                </thead>
                <motion.tbody
                  key={`${clientSearch}-${industryFilter}-${riskFilter}`}
                  className="divide-y divide-[#F0EBE1] text-xs"
                  initial={{ opacity: 0.65 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                >
                  {filteredClients.map((client) => {
                    const clientEngs = engagements.filter(
                      (e) => e.clientName === client.name,
                    );
                    const riskBadge =
                      client.riskRating === "Low"
                        ? "bg-[#E1F3EE] text-[#1F5946] border-[#C5E8DC]"
                        : client.riskRating === "Medium"
                          ? "bg-[#FAF0DE] text-[#8A5A18] border-[#ECD9B8]"
                          : "bg-[#FDE6E2] text-[#8E362C] border-[#F4CCC6]";

                    return (
                      <tr
                        key={client.id}
                        className="hover:bg-[#FAF8F5] transition-colors group cursor-pointer"
                        onClick={() => setSelectedClientDrawer(client)}
                      >
                        {/* Client / Company Name & Industry */}
                        <td className="py-3.5 pl-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-xl bg-[#113227] text-white font-bold text-xs flex items-center justify-center border border-[#C58A3E] shrink-0 shadow-2xs">
                              {client.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-[#1C1F1E] group-hover:text-[#113227] truncate">
                                {client.name}
                              </div>
                              <div className="flex items-center space-x-2 text-[11px] text-[#7A8782]">
                                <span className="font-mono text-[#C58A3E] font-semibold">
                                  {client.clientCode}
                                </span>
                                <span>•</span>
                                <span>{client.industry}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Trade License / Registration No */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            <div className="font-mono text-[11px] font-semibold text-[#1C1F1E]">
                              {client.tradeLicenseNo || "TRAD/DSCC/019842"}
                            </div>
                            <div className="text-[10px] font-mono text-[#8A9691]">
                              {client.taxId}
                            </div>
                          </div>
                        </td>

                        {/* Primary Contact Person */}
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-[#1C1F1E] flex items-center space-x-1.5">
                            <User className="w-3.5 h-3.5 text-[#C58A3E]" />
                            <span>{client.contactPerson}</span>
                          </div>
                          <div className="text-[10px] text-[#7A8782]">
                            Executive Contact
                          </div>
                        </td>

                        {/* Email & Phone */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-1 text-[#333E38] text-[11.5px]">
                              <Mail className="w-3 h-3 text-[#8A9691]" />
                              <span className="truncate max-w-[160px]">
                                {client.email}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1 text-[10.5px] font-mono text-[#8A9691]">
                              <Phone className="w-2.5 h-2.5" />
                              <span>{client.phone}</span>
                            </div>
                          </div>
                        </td>

                        {/* Active Engagements Count */}
                        <td className="py-3.5 px-3">
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-[#FAF0DE] border border-[#EADBBF] text-[#8A5A18]">
                              <Briefcase className="w-3 h-3 mr-1" />
                              {clientEngs.length ||
                                client.activeEngagements}{" "}
                              Active
                            </span>
                            <div className="text-[10px] font-mono text-[#7A8782]">
                              ৳{(client.annualFee / 100000).toFixed(2)}L
                              Retainer
                            </div>
                          </div>
                        </td>

                        {/* Relationship Partner */}
                        <td className="py-3.5 px-3">
                          <div className="font-semibold text-[#113227] text-xs flex items-center space-x-1">
                            <UserCheck className="w-3.5 h-3.5 text-[#1F5946]" />
                            <span>{client.relationshipPartner}</span>
                          </div>
                        </td>

                        {/* Risk Category (Low, Medium, High) */}
                        <td className="py-3.5 px-3">
                          <span
                            className={`motion-badge inline-flex items-center space-x-1 px-2.5 py-0.8 rounded-full text-[10.5px] font-bold border ${riskBadge}`}
                          >
                            {client.riskRating === "High" ? (
                              <ShieldAlert className="w-3 h-3 text-[#8E362C]" />
                            ) : (
                              <ShieldCheck className="w-3 h-3" />
                            )}
                            <span>{client.riskRating} Risk</span>
                          </span>
                        </td>

                        {/* Profile Drawer Action */}
                        <td className="py-3.5 pr-1 text-right">
                          <button
                            id={`btn-view-client-${client.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedClientDrawer(client);
                            }}
                            className="p-1.5 rounded-lg text-[#8A9691] hover:text-[#113227] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                            title="View KYC &amp; billing profile"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
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
                <Building className="w-4 h-4 text-[#1F5946]" />
                <span>
                  Showing {filteredClients.length} enterprise corporate accounts
                </span>
              </div>
              <div className="flex items-center space-x-3 text-[11px] font-mono">
                <span>
                  Total Retainer Value:{" "}
                  <strong>
                    ৳
                    {clients
                      .reduce((acc, c) => acc + c.annualFee, 0)
                      .toLocaleString()}
                  </strong>
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ENGAGEMENTS & TEAMS VIEW (KANBAN & TABULAR GRID) */}
      {/* ========================================================================= */}
      {activeTab === "engagements" && (
        <div className="space-y-6">
          {/* Controls Bar: Search, Service Filter, View Mode Switcher, + Create Engagement */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#EBE6DD] shadow-2xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              {/* Search Bar */}
              <div className="relative flex-1 max-w-md">
                <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A9691]" />
                <input
                  id="engagement-search-input"
                  type="text"
                  placeholder="Search by engagement code, client name, partner, manager..."
                  value={engagementSearch}
                  onChange={(e) => setEngagementSearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              {/* Service Type Filter */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[11px] font-bold text-[#8A9691] whitespace-nowrap">
                  Service:
                </span>
                <select
                  id="engagement-service-filter"
                  value={engagementServiceFilter}
                  onChange={(e) => setEngagementServiceFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                >
                  <option value="All">All Service Lines</option>
                  <option value="Statutory Audit">Statutory Audit</option>
                  <option value="Tax Compliance">Tax Compliance</option>
                  <option value="VAT Assessment">VAT Assessment</option>
                  <option value="Special Advisory">Special Advisory</option>
                </select>
              </div>
            </div>

            {/* View Switcher (Kanban vs Table) & "+ Create Engagement" Button */}
            <div className="flex items-center space-x-2.5 shrink-0">
              <div className="flex items-center bg-[#FAF7F2] p-1 rounded-xl border border-[#E8E1D5]">
                <button
                  id="btn-view-kanban"
                  onClick={() => setEngagementViewMode("kanban")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    engagementViewMode === "kanban"
                      ? "bg-[#113227] text-white shadow-2xs"
                      : "text-[#66706B] hover:text-[#1C1F1E]"
                  }`}
                  title="Kanban Pipeline Board"
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Kanban</span>
                </button>

                <button
                  id="btn-view-table"
                  onClick={() => setEngagementViewMode("table")}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 ${
                    engagementViewMode === "table"
                      ? "bg-[#113227] text-white shadow-2xs"
                      : "text-[#66706B] hover:text-[#1C1F1E]"
                  }`}
                  title="Tabular Grid View"
                >
                  <TableIcon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Grid Table</span>
                </button>
              </div>

              <button
                id="btn-open-create-engagement-modal"
                onClick={() => setIsEngagementModalOpen(true)}
                className="btn-forest px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-2xs hover:shadow-sm cursor-pointer transition-all active:scale-98"
              >
                <Plus className="w-3.5 h-3.5 text-[#C58A3E]" />
                <span>Create Engagement</span>
              </button>
            </div>
          </div>

          {/* 3A. KANBAN BOARD VIEW (5 STAGES) */}
          {engagementViewMode === "kanban" && (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
              {KANBAN_STAGES.map((stage) => {
                const stageEngs = filteredEngagements.filter(
                  (e) => e.stage === stage.id,
                );

                return (
                  <div
                    key={stage.id}
                    className="bg-[#FAF8F5] rounded-3xl border border-[#EBE5DA] p-4 flex flex-col justify-between min-h-[580px] shadow-2xs"
                  >
                    {/* Stage Column Header */}
                    <div className="space-y-1 pb-3 border-b border-[#E8E0D2]">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold font-mono text-[#8A5A18] bg-[#FAF0DE] px-2 py-0.5 rounded border border-[#EADBBF]">
                          {stage.tag}
                        </span>
                        <span className="w-6 h-6 rounded-full bg-white border border-[#E2DACB] font-bold text-xs text-[#113227] flex items-center justify-center shadow-2xs">
                          {stageEngs.length}
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-xs text-[#1C1F1E]">
                        {stage.label}
                      </h3>
                      <p className="text-[10.5px] text-[#7A8782] leading-tight">
                        {stage.description}
                      </p>
                    </div>

                    {/* Stage Engagement Cards List */}
                    <div className="flex-1 py-3 space-y-3 overflow-y-auto custom-scrollbar pr-1">
                      {stageEngs.length === 0 ? (
                        <div className="h-44 rounded-2xl border border-dashed border-[#DCD5C8] flex flex-col items-center justify-center p-4 text-center text-[#8A9691] text-xs">
                          <span>No engagements currently in {stage.label}</span>
                        </div>
                      ) : (
                        stageEngs.map((eng) => {
                          const percentHours = Math.min(
                            100,
                            Math.round(
                              (eng.loggedHours / (eng.budgetHours || 1)) * 100,
                            ),
                          );

                          return (
                            <div
                              key={eng.id}
                              onClick={() => setSelectedEngagementDetail(eng)}
                              className="p-4 rounded-2xl bg-white border border-[#E5DDD0] hover:border-[#C58A3E] transition-all shadow-2xs hover:shadow-sm space-y-3 cursor-pointer group"
                            >
                              {/* Header: Code & Health */}
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-mono font-bold text-[11px] text-[#C58A3E]">
                                  {eng.engagementCode}
                                </span>
                                <span
                                  className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full border ${
                                    eng.health === "Delayed"
                                      ? "bg-[#FDE6E2] text-[#8E362C] border-[#F4CCC6]"
                                      : eng.health === "At Risk"
                                        ? "bg-[#FAF0DE] text-[#8A5A18] border-[#ECD9B8]"
                                        : "bg-[#E1F3EE] text-[#1F5946] border-[#C5E8DC]"
                                  }`}
                                >
                                  {eng.health || "On Track"}
                                </span>
                              </div>

                              {/* Client Name & Service */}
                              <div className="space-y-0.5">
                                <h4 className="font-bold text-xs text-[#1C1F1E] group-hover:text-[#113227] transition-colors leading-snug">
                                  {eng.clientName}
                                </h4>
                                <span className="inline-block text-[10px] font-semibold text-[#66706B] bg-[#FAF7F2] px-2 py-0.2 rounded border border-[#EAE3D5]">
                                  {eng.serviceType}
                                </span>
                              </div>

                              {/* Year End & Target Sign-off Date */}
                              <div className="grid grid-cols-2 gap-1 text-[10.5px] text-[#7A8782] bg-[#FAF8F5] p-2 rounded-xl border border-[#F0EBE1]">
                                <div>
                                  <span className="block text-[9.5px] font-mono text-[#8A9691] uppercase">
                                    Year End
                                  </span>
                                  <span className="font-semibold text-[#1C1F1E]">
                                    {eng.yearEndDate || "30 Jun 2026"}
                                  </span>
                                </div>
                                <div>
                                  <span className="block text-[9.5px] font-mono text-[#8A9691] uppercase">
                                    Target Sign-off
                                  </span>
                                  <span className="font-semibold text-[#113227]">
                                    {eng.targetSignOffDate || eng.dueDate}
                                  </span>
                                </div>
                              </div>

                              {/* Budget vs Actual Hours Progress Bar */}
                              <div className="space-y-1">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="text-[#7A8782] font-mono">
                                    <strong>{eng.loggedHours}h</strong> /{" "}
                                    {eng.budgetHours}h budget
                                  </span>
                                  <span className="font-mono font-bold text-[#1C1F1E]">
                                    {percentHours}%
                                  </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-[#EAE4D9] overflow-hidden">
                                  <div
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      percentHours > 90
                                        ? "bg-rose-600"
                                        : percentHours > 70
                                          ? "bg-amber-600"
                                          : "bg-[#113227]"
                                    }`}
                                    style={{ width: `${percentHours}%` }}
                                  />
                                </div>
                              </div>

                              {/* Leadership & Assigned Team Members with Avatars */}
                              <div className="pt-2 border-t border-[#F0EBE1] flex items-center justify-between">
                                <div className="text-[10px] text-[#66706B] truncate max-w-[120px]">
                                  <strong>Lead:</strong>{" "}
                                  {eng.leadPartner.split(",")[0]}
                                </div>

                                <div className="flex items-center -space-x-1.5">
                                  {(
                                    eng.teamMemberRoles || [
                                      {
                                        name: "Fouzia Haque, FCA",
                                        role: "Engagement Partner",
                                        avatarInitials: "FH",
                                      },
                                      {
                                        name: "Nadia Sharmin, ACCA",
                                        role: "In-Charge",
                                        avatarInitials: "NS",
                                      },
                                      {
                                        name: "Sabbir Ahmed (Art)",
                                        role: "Articled Student",
                                        avatarInitials: "SA",
                                      },
                                    ]
                                  )
                                    .slice(0, 4)
                                    .map((m, idx) => (
                                      <div
                                        key={idx}
                                        className="w-5 h-5 rounded-full bg-[#113227] text-white text-[9px] font-bold flex items-center justify-center border border-white shrink-0 shadow-2xs"
                                        title={`${m.name} (${m.role})`}
                                      >
                                        {m.avatarInitials}
                                      </div>
                                    ))}
                                </div>
                              </div>

                              {/* Quick Stage Progression Trigger */}
                              <div className="pt-1 flex items-center justify-between text-[10px]">
                                <span className="text-[#8A9691] font-mono">
                                  Move stage:
                                </span>
                                <select
                                  value={eng.stage}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    onUpdateEngagementStage(
                                      eng.id,
                                      e.target.value as any,
                                    )
                                  }
                                  className="px-1.5 py-0.5 bg-[#FAF7F2] border border-[#E0D7C8] rounded text-[10px] text-[#113227] font-bold focus:outline-none cursor-pointer"
                                >
                                  <option value="Planning">Planning</option>
                                  <option value="Fieldwork">Fieldwork</option>
                                  <option value="Review">Review</option>
                                  <option value="Sign-off">Sign-off</option>
                                  <option value="Completed">Completed</option>
                                </select>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Column Footer */}
                    <div className="pt-2 border-t border-[#E8E0D2] text-[10.5px] font-mono text-[#8A9691] text-center">
                      Total Hours:{" "}
                      {stageEngs.reduce((sum, e) => sum + e.loggedHours, 0)}h
                      logged
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3B. TABULAR GRID VIEW */}
          {engagementViewMode === "table" && (
            <div className="bg-white rounded-3xl border border-[#EBE6DD] p-5 sm:p-6 shadow-2xs">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse min-w-[960px]">
                  <thead>
                    <tr className="border-b border-[#EBE5DA] text-[11px] font-bold text-[#8A9691] uppercase tracking-wider">
                      <th className="pb-3 pl-1">Engagement &amp; Code</th>
                      <th className="pb-3 px-3">Client Name</th>
                      <th className="pb-3 px-3">
                        Year-End &amp; Target Sign-Off
                      </th>
                      <th className="pb-3 px-3">Engagement Leadership</th>
                      <th className="pb-3 px-3">Assigned Team</th>
                      <th className="pb-3 px-3">Budgeted vs Actual Hours</th>
                      <th className="pb-3 px-3">Stage &amp; Health</th>
                      <th className="pb-3 pr-1 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0EBE1] text-xs">
                    {filteredEngagements.map((eng) => {
                      const percentHours = Math.min(
                        100,
                        Math.round(
                          (eng.loggedHours / (eng.budgetHours || 1)) * 100,
                        ),
                      );

                      return (
                        <tr
                          key={eng.id}
                          className="hover:bg-[#FAF8F5] transition-colors group cursor-pointer"
                          onClick={() => setSelectedEngagementDetail(eng)}
                        >
                          {/* Engagement Code & Service Type */}
                          <td className="py-3.5 pl-1">
                            <div className="space-y-0.5">
                              <div className="font-mono font-bold text-[#C58A3E] text-xs">
                                {eng.engagementCode}
                              </div>
                              <span className="inline-block text-[10.5px] font-semibold text-[#66706B]">
                                {eng.serviceType}
                              </span>
                            </div>
                          </td>

                          {/* Client Name */}
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-[#1C1F1E] group-hover:text-[#113227] text-xs">
                              {eng.clientName}
                            </div>
                          </td>

                          {/* Year-End Date & Target Sign-off Date */}
                          <td className="py-3.5 px-3">
                            <div className="space-y-0.5 text-xs font-mono">
                              <div className="text-[#333E38]">
                                <span className="text-[#8A9691] text-[10px]">
                                  FYE:
                                </span>{" "}
                                {eng.yearEndDate || "30 Jun 2026"}
                              </div>
                              <div className="text-[#113227] font-semibold">
                                <span className="text-[#8A9691] text-[10px]">
                                  Target:
                                </span>{" "}
                                {eng.targetSignOffDate || eng.dueDate}
                              </div>
                            </div>
                          </td>

                          {/* Engagement Partner & Manager */}
                          <td className="py-3.5 px-3">
                            <div className="space-y-0.5">
                              <div className="font-semibold text-[#1C1F1E] text-xs flex items-center space-x-1">
                                <UserCheck className="w-3.5 h-3.5 text-[#C58A3E]" />
                                <span>{eng.leadPartner}</span>
                              </div>
                              <div className="text-[10.5px] text-[#7A8782]">
                                Mgr: {eng.leadManager}
                              </div>
                            </div>
                          </td>

                          {/* Assigned Team Members (Avatars) */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center -space-x-1.5">
                              {(
                                eng.teamMemberRoles || [
                                  {
                                    name: "Fouzia Haque, FCA",
                                    role: "Partner",
                                    avatarInitials: "FH",
                                  },
                                  {
                                    name: "Nadia Sharmin, ACCA",
                                    role: "Senior",
                                    avatarInitials: "NS",
                                  },
                                  {
                                    name: "Sabbir Ahmed (Art)",
                                    role: "Student",
                                    avatarInitials: "SA",
                                  },
                                ]
                              ).map((m, idx) => (
                                <div
                                  key={idx}
                                  className="w-6 h-6 rounded-full bg-[#113227] text-white text-[9.5px] font-bold flex items-center justify-center border border-white shrink-0 shadow-2xs"
                                  title={`${m.name} (${m.role})`}
                                >
                                  {m.avatarInitials}
                                </div>
                              ))}
                            </div>
                          </td>

                          {/* Budget vs Actual Hours Progress Bar */}
                          <td className="py-3.5 px-3">
                            <div className="space-y-1 w-36">
                              <div className="flex items-center justify-between text-[10px] font-mono">
                                <span>
                                  {eng.loggedHours}h / {eng.budgetHours}h
                                </span>
                                <span className="font-bold">
                                  {percentHours}%
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-[#EAE4D9] overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    percentHours > 90
                                      ? "bg-rose-600"
                                      : percentHours > 70
                                        ? "bg-amber-600"
                                        : "bg-[#113227]"
                                  }`}
                                  style={{ width: `${percentHours}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Stage & Health */}
                          <td className="py-3.5 px-3">
                            <div className="space-y-1">
                              <span className="inline-block px-2.5 py-0.5 rounded-md text-[10.5px] font-bold bg-[#FAF0DE] border border-[#EADBBF] text-[#8A5A18]">
                                {eng.stage}
                              </span>
                              <div>
                                <span
                                  className={`inline-block text-[9.5px] font-bold px-2 py-0.2 rounded-full border ${
                                    eng.health === "Delayed"
                                      ? "bg-[#FDE6E2] text-[#8E362C] border-[#F4CCC6]"
                                      : "bg-[#E1F3EE] text-[#1F5946] border-[#C5E8DC]"
                                  }`}
                                >
                                  {eng.health || "On Track"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Details Trigger */}
                          <td className="py-3.5 pr-1 text-right">
                            <button
                              id={`btn-view-engagement-${eng.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedEngagementDetail(eng);
                              }}
                              className="p-1.5 rounded-lg text-[#8A9691] hover:text-[#113227] hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Table Footer */}
              <div className="pt-4 border-t border-[#F0EBE1] flex flex-col sm:flex-row items-center justify-between text-xs text-[#7A8782] gap-2">
                <span>
                  Showing {filteredEngagements.length} audit &amp; advisory
                  engagements
                </span>
                <span className="font-mono text-[11px]">
                  Total Budget:{" "}
                  <strong>
                    {filteredEngagements.reduce(
                      (sum, e) => sum + e.budgetHours,
                      0,
                    )}{" "}
                    hours
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. CLIENT DETAIL DRAWER (KYC, STATUTORY RECORDS, ENGAGEMENTS, BILLING) */}
      {/* ========================================================================= */}
      {selectedClientDrawer && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setSelectedClientDrawer(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-lg bg-white border-l border-[#E5DDD0] shadow-2xl p-6 flex flex-col justify-between text-left overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-start justify-between pb-4 border-b border-[#F0EBE1]">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#113227] text-white font-bold text-base flex items-center justify-center border border-[#C58A3E] shadow-sm">
                      {selectedClientDrawer.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base font-serif font-bold text-[#1C1F1E]">
                        {selectedClientDrawer.name}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs text-[#7A8782]">
                        <span className="font-mono font-bold text-[#C58A3E]">
                          {selectedClientDrawer.clientCode}
                        </span>
                        <span>•</span>
                        <span>{selectedClientDrawer.industry}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedClientDrawer(null)}
                    className="p-2 rounded-xl text-[#7A8782] hover:bg-[#FAF7F2] hover:text-[#1C1F1E] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Company Profile & Overview */}
                <div className="space-y-2">
                  <span className="text-[10.5px] font-bold text-[#8A9691] uppercase tracking-wider block">
                    Company Overview
                  </span>
                  <p className="text-xs text-[#3D4742] leading-relaxed bg-[#FAF8F5] p-3 rounded-2xl border border-[#EBE5DA]">
                    {selectedClientDrawer.companyOverview ||
                      `${selectedClientDrawer.name} is an active enterprise managed under ${selectedClientDrawer.relationshipPartner}.`}
                  </p>
                </div>

                {/* Key KYC & Statutory Registry Box */}
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-[#1C1F1E] flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#1F5946]" />
                    <span>KYC &amp; Statutory Regulatory Records</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DA]">
                      <span className="text-[10px] font-bold text-[#8A9691] uppercase block">
                        Trade License No
                      </span>
                      <span className="font-mono font-bold text-[#1C1F1E]">
                        {selectedClientDrawer.tradeLicenseNo ||
                          selectedClientDrawer.kycDetails?.tradeLicenseNo ||
                          "TRAD/DSCC/019842"}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DA]">
                      <span className="text-[10px] font-bold text-[#8A9691] uppercase block">
                        Tax Identification (TIN)
                      </span>
                      <span className="font-mono font-bold text-[#113227]">
                        {selectedClientDrawer.taxId}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DA]">
                      <span className="text-[10px] font-bold text-[#8A9691] uppercase block">
                        Incorporation Certificate
                      </span>
                      <span className="font-mono font-semibold text-[#1C1F1E]">
                        {selectedClientDrawer.kycDetails?.incorporationNo ||
                          "C-38291/98"}
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DA]">
                      <span className="text-[10px] font-bold text-[#8A9691] uppercase block">
                        VAT BIN / Registration
                      </span>
                      <span className="font-mono font-semibold text-[#1C1F1E]">
                        {selectedClientDrawer.kycDetails?.binNo ||
                          "001928374-0101"}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DA] space-y-1 text-xs">
                    <span className="text-[10px] font-bold text-[#8A9691] uppercase block">
                      Registered Corporate Address
                    </span>
                    <p className="text-[#333E38] text-[11.5px]">
                      {selectedClientDrawer.kycDetails?.registeredAddress ||
                        "Gulshan-1, Dhaka-1212, Bangladesh"}
                    </p>
                    <div className="text-[10.5px] text-[#8A5A18] font-semibold pt-1">
                      KYC Verified:{" "}
                      {selectedClientDrawer.kycDetails?.kycVerifiedDate ||
                        "15 Jan 2026"}
                    </div>
                  </div>
                </div>

                {/* Historical & Active Engagements */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1C1F1E] flex items-center space-x-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-[#C58A3E]" />
                      <span>Historical &amp; Active Engagements</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#113227]">
                      {
                        engagements.filter(
                          (e) => e.clientName === selectedClientDrawer.name,
                        ).length
                      }{" "}
                      Mandates
                    </span>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
                    {engagements
                      .filter((e) => e.clientName === selectedClientDrawer.name)
                      .map((eng) => (
                        <div
                          key={eng.id}
                          className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#ECE5D9] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold text-[#1C1F1E]">
                            <span className="font-mono text-[#C58A3E]">
                              {eng.engagementCode}
                            </span>
                            <span className="text-[10px] bg-[#FAF0DE] text-[#8A5A18] px-2 py-0.2 rounded border border-[#EADBBF]">
                              {eng.stage}
                            </span>
                          </div>
                          <p className="text-[11.5px] font-semibold text-[#113227]">
                            {eng.serviceType}
                          </p>
                          <div className="flex items-center justify-between text-[10.5px] text-[#7A8782]">
                            <span>Lead: {eng.leadPartner}</span>
                            <span>
                              {eng.loggedHours}h / {eng.budgetHours}h
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Billing & Invoicing History */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#1C1F1E] flex items-center space-x-1.5">
                    <Receipt className="w-3.5 h-3.5 text-[#1D526D]" />
                    <span>Billing &amp; Retainer Invoices</span>
                  </span>

                  <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar pr-1">
                    {(
                      selectedClientDrawer.billingHistory || [
                        {
                          id: "1",
                          invoiceNo: "INV-2026-081",
                          engagement: "Statutory Audit FY25",
                          amount: 450000,
                          date: "15 Jul 2026",
                          status: "Paid",
                        },
                        {
                          id: "2",
                          invoiceNo: "INV-2026-092",
                          engagement: "Corporate Tax Filing",
                          amount: 200000,
                          date: "10 Aug 2026",
                          status: "Pending",
                        },
                      ]
                    ).map((bill) => (
                      <div
                        key={bill.id}
                        className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE5D9] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-mono font-bold text-[#1C1F1E]">
                            {bill.invoiceNo}
                          </div>
                          <div className="text-[11px] text-[#7A8782]">
                            {bill.engagement}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-[#113227]">
                            ৳{bill.amount.toLocaleString()}
                          </div>
                          <span
                            className={`text-[9.5px] font-bold px-1.5 py-0.2 rounded ${
                              bill.status === "Paid"
                                ? "bg-[#E1F3EE] text-[#1F5946]"
                                : bill.status === "Overdue"
                                  ? "bg-[#FDE6E2] text-[#8E362C]"
                                  : "bg-[#FAF0DE] text-[#8A5A18]"
                            }`}
                          >
                            {bill.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Drawer Footer Actions */}
              <div className="pt-4 border-t border-[#F0EBE1] flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedClientDrawer(null);
                    setNewEngagement((prev) => ({
                      ...prev,
                      clientName: selectedClientDrawer.name,
                    }));
                    setIsEngagementModalOpen(true);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE3D5] border border-[#E0D7C8] text-[#113227] text-xs font-bold cursor-pointer transition-colors flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Initiate Engagement</span>
                </button>

                <button
                  onClick={() => setSelectedClientDrawer(null)}
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
      {/* 5. ENGAGEMENT DETAIL DRAWER */}
      {/* ========================================================================= */}
      {selectedEngagementDetail && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-2xs transition-opacity"
            onClick={() => setSelectedEngagementDetail(null)}
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-md bg-white border-l border-[#E5DDD0] shadow-2xl p-6 flex flex-col justify-between text-left overflow-y-auto custom-scrollbar">
              <div className="space-y-6">
                <div className="flex items-start justify-between pb-4 border-b border-[#F0EBE1]">
                  <div>
                    <div className="inline-block font-mono font-bold text-xs text-[#C58A3E] bg-[#FAF0DE] px-2 py-0.5 rounded border border-[#EADBBF] mb-1">
                      {selectedEngagementDetail.engagementCode}
                    </div>
                    <h3 className="text-base font-serif font-bold text-[#1C1F1E]">
                      {selectedEngagementDetail.clientName}
                    </h3>
                    <p className="text-xs text-[#7A8782]">
                      {selectedEngagementDetail.serviceType}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedEngagementDetail(null)}
                    className="p-2 rounded-xl text-[#7A8782] hover:bg-[#FAF7F2] hover:text-[#1C1F1E] transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Scope Description */}
                <div className="space-y-1.5">
                  <span className="text-[10.5px] font-bold text-[#8A9691] uppercase tracking-wider block">
                    Scope of Engagement
                  </span>
                  <p className="text-xs text-[#3D4742] bg-[#FAF8F5] p-3 rounded-2xl border border-[#EBE5DA] leading-relaxed">
                    {selectedEngagementDetail.scopeDescription ||
                      "Statutory audit in compliance with ISA and ICAB Quality Assurance guidelines."}
                  </p>
                </div>

                {/* Stage & Progress */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DA] space-y-3">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#1C1F1E]">Current Review Stage</span>
                    <span className="text-[#8A5A18]">
                      {selectedEngagementDetail.stage}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-[#7A8782]">
                      <span>
                        Hours: {selectedEngagementDetail.loggedHours}h /{" "}
                        {selectedEngagementDetail.budgetHours}h
                      </span>
                      <span>
                        {Math.round(
                          (selectedEngagementDetail.loggedHours /
                            selectedEngagementDetail.budgetHours) *
                            100,
                        )}
                        %
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#EAE4D9] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#113227]"
                        style={{
                          width: `${Math.min(100, Math.round((selectedEngagementDetail.loggedHours / selectedEngagementDetail.budgetHours) * 100))}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Defined Team Roles */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#1C1F1E] flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-[#C58A3E]" />
                    <span>Assigned Audit Engagement Team</span>
                  </span>

                  <div className="space-y-1.5">
                    {(
                      selectedEngagementDetail.teamMemberRoles || [
                        {
                          name: selectedEngagementDetail.leadPartner,
                          role: "Engagement Partner",
                          avatarInitials: "EP",
                        },
                        {
                          name: selectedEngagementDetail.leadManager,
                          role: "Audit Manager",
                          avatarInitials: "AM",
                        },
                        {
                          name: "Nadia Sharmin, ACCA",
                          role: "In-Charge / Senior",
                          avatarInitials: "NS",
                        },
                        {
                          name: "Sabbir Ahmed (Art)",
                          role: "Articled Student",
                          avatarInitials: "SA",
                        },
                      ]
                    ).map((member, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#ECE5D9] flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-xl bg-[#113227] text-white text-[10px] font-bold flex items-center justify-center border border-[#C58A3E]">
                            {member.avatarInitials}
                          </div>
                          <div>
                            <div className="font-bold text-[#1C1F1E]">
                              {member.name}
                            </div>
                            <div className="text-[10px] text-[#7A8782]">
                              {member.role}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#F0EBE1] flex items-center justify-end">
                <button
                  onClick={() => setSelectedEngagementDetail(null)}
                  className="btn-forest px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: "+ NEW CLIENT" */}
      {/* ========================================================================= */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5DDD0] shadow-2xl max-w-xl w-full p-6 space-y-5 text-left max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF0DE] border border-[#EADBBF] text-[#8A5A18] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#1C1F1E]">
                    Onboard New Corporate Client
                  </h3>
                  <p className="text-xs text-[#7A8782]">
                    Record company profile, trade licenses, and KYC parameters
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="p-1.5 rounded-lg text-[#7A8782] hover:bg-[#FAF7F2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleClientSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#1C1F1E]">
                  Company / Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Beximco Synthetics PLC"
                  value={newClient.name}
                  onChange={(e) =>
                    setNewClient({ ...newClient, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1C1F1E]">
                    Industry Sector
                  </label>
                  <select
                    value={newClient.industry}
                    onChange={(e) =>
                      setNewClient({ ...newClient, industry: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="Manufacturing">
                      Manufacturing &amp; Heavy Industry
                    </option>
                    <option value="Garments">
                      Garments &amp; Textiles (RMG)
                    </option>
                    <option value="Banking">
                      Banking &amp; Financial Services
                    </option>
                    <option value="Tech">Information Technology / SaaS</option>
                    <option value="Pharmaceuticals">
                      Pharmaceuticals &amp; Healthcare
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1C1F1E]">
                    Risk Category Rating
                  </label>
                  <select
                    value={newClient.riskRating}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        riskRating: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="Low">
                      Low Risk (Standard Due Diligence)
                    </option>
                    <option value="Medium">Medium Risk</option>
                    <option value="High">
                      High Risk (Enhanced ISA 220 Review)
                    </option>
                  </select>
                </div>
              </div>

              {/* Trade License & Tax ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1C1F1E]">
                    Trade License No *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="TRAD/DSCC/019842/2022"
                    value={newClient.tradeLicenseNo}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        tradeLicenseNo: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs font-mono text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1C1F1E]">
                    Tax ID / TIN Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="TIN-8891023910"
                    value={newClient.taxId}
                    onChange={(e) =>
                      setNewClient({ ...newClient, taxId: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs font-mono text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>
              </div>

              {/* Primary Contact Person & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1C1F1E]">
                    Primary Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Kazi Enamul Huq (CFO)"
                    value={newClient.contactPerson}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        contactPerson: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1C1F1E]">
                    Work Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="cfo@company.com"
                    value={newClient.email}
                    onChange={(e) =>
                      setNewClient({ ...newClient, email: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>
              </div>

              {/* Phone & Annual Mandate Fee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1C1F1E]">
                    Contact Phone
                  </label>
                  <input
                    type="text"
                    value={newClient.phone}
                    onChange={(e) =>
                      setNewClient({ ...newClient, phone: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs font-mono text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1C1F1E]">
                    Annual Retainer Fee (BDT)
                  </label>
                  <input
                    type="number"
                    value={newClient.annualFee}
                    onChange={(e) =>
                      setNewClient({
                        ...newClient,
                        annualFee: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs font-mono text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>
              </div>

              {/* Relationship Partner */}
              <div className="space-y-1">
                <label className="font-bold text-[#1C1F1E]">
                  Relationship Partner
                </label>
                <select
                  value={newClient.relationshipPartner}
                  onChange={(e) =>
                    setNewClient({
                      ...newClient,
                      relationshipPartner: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                >
                  <option value="Fouzia Haque, FCA">
                    Fouzia Haque, FCA (Senior Partner)
                  </option>
                  <option value="Zahirul Islam, FCA">
                    Zahirul Islam, FCA (Partner - Audit &amp; Tax)
                  </option>
                  <option value="Mahmudur Rahman, ACA">
                    Mahmudur Rahman, ACA (Partner - Advisory)
                  </option>
                </select>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-[#F0EBE1] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE3D5] text-[#1C1F1E] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-forest px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Save &amp; Onboard Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: "CREATE ENGAGEMENT" WITH MULTI-MEMBER TEAMS */}
      {/* ========================================================================= */}
      {isEngagementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs animate-fadeIn">
          <div className="bg-white rounded-3xl border border-[#E5DDD0] shadow-2xl max-w-xl w-full p-6 space-y-5 text-left max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0EBE1]">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FAF0DE] border border-[#EADBBF] text-[#8A5A18] flex items-center justify-center">
                  <FolderGit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#1C1F1E]">
                    Create Audit / Tax Engagement
                  </h3>
                  <p className="text-xs text-[#7A8782]">
                    Select client, scope, budget hours, and assign multi-member
                    teams
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsEngagementModalOpen(false)}
                className="p-1.5 rounded-lg text-[#7A8782] hover:bg-[#FAF7F2]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleEngagementSubmit}
              className="space-y-4 text-xs"
            >
              {/* Client Selection */}
              <div className="space-y-1">
                <label className="font-bold text-[#1C1F1E]">
                  Target Client Entity *
                </label>
                <select
                  required
                  value={newEngagement.clientName}
                  onChange={(e) =>
                    setNewEngagement({
                      ...newEngagement,
                      clientName: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs font-semibold text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.clientCode}) - {c.industry}
                    </option>
                  ))}
                </select>
              </div>

              {/* Engagement Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1C1F1E]">
                    Engagement Scope Line
                  </label>
                  <select
                    value={newEngagement.serviceType}
                    onChange={(e) =>
                      setNewEngagement({
                        ...newEngagement,
                        serviceType: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  >
                    <option value="Statutory Audit">
                      Statutory Audit (ISA/IFRS)
                    </option>
                    <option value="Tax Compliance">
                      Corporate Tax Assessment
                    </option>
                    <option value="VAT Assessment">
                      VAT &amp; Mushak 6.3 Audit
                    </option>
                    <option value="Special Advisory">
                      Special Advisory / Due Diligence
                    </option>
                    <option value="Transfer Pricing">
                      Transfer Pricing (Sec 107)
                    </option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1C1F1E]">
                    Budgeted Working Hours
                  </label>
                  <input
                    type="number"
                    value={newEngagement.budgetHours}
                    onChange={(e) =>
                      setNewEngagement({
                        ...newEngagement,
                        budgetHours: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs font-mono text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>
              </div>

              {/* Year-End Date & Target Sign-off Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-[#1C1F1E]">
                    Financial Year-End Date
                  </label>
                  <input
                    type="text"
                    placeholder="30 Jun 2026"
                    value={newEngagement.yearEndDate}
                    onChange={(e) =>
                      setNewEngagement({
                        ...newEngagement,
                        yearEndDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs font-mono text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#1C1F1E]">
                    Target Sign-off Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newEngagement.dueDate}
                    onChange={(e) =>
                      setNewEngagement({
                        ...newEngagement,
                        dueDate: e.target.value,
                        targetSignOffDate: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs font-mono text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                  />
                </div>
              </div>

              {/* Engagement Leadership Roles */}
              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EBE5DA] space-y-3">
                <span className="text-[11px] font-bold text-[#1C1F1E] uppercase tracking-wider block">
                  Assign Multi-Member Engagement Team
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#8A9691]">
                      Lead Engagement Partner
                    </label>
                    <select
                      value={newEngagement.leadPartner}
                      onChange={(e) =>
                        setNewEngagement({
                          ...newEngagement,
                          leadPartner: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E0D7C8] rounded-xl text-xs text-[#1C1F1E]"
                    >
                      <option value="Fouzia Haque, FCA">
                        Fouzia Haque, FCA
                      </option>
                      <option value="Zahirul Islam, FCA">
                        Zahirul Islam, FCA
                      </option>
                      <option value="Mahmudur Rahman, ACA">
                        Mahmudur Rahman, ACA
                      </option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#8A9691]">
                      Audit In-Charge / Manager
                    </label>
                    <select
                      value={newEngagement.leadManager}
                      onChange={(e) =>
                        setNewEngagement({
                          ...newEngagement,
                          leadManager: e.target.value,
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E0D7C8] rounded-xl text-xs text-[#1C1F1E]"
                    >
                      <option value="Zahirul Islam, FCA">
                        Zahirul Islam, FCA (Manager)
                      </option>
                      <option value="Mahmudur Rahman, ACA">
                        Mahmudur Rahman, ACA (Manager)
                      </option>
                      <option value="Nadia Sharmin, ACCA">
                        Nadia Sharmin, ACCA (Senior In-Charge)
                      </option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-[#8A9691]">
                    Senior In-Charge Associate
                  </label>
                  <input
                    type="text"
                    value={newEngagement.auditInCharge}
                    onChange={(e) =>
                      setNewEngagement({
                        ...newEngagement,
                        auditInCharge: e.target.value,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E0D7C8] rounded-xl text-xs text-[#1C1F1E]"
                  />
                </div>
              </div>

              {/* Scope Description */}
              <div className="space-y-1">
                <label className="font-bold text-[#1C1F1E]">
                  Scope &amp; Deliverables Description
                </label>
                <textarea
                  rows={2}
                  value={newEngagement.scopeDescription}
                  onChange={(e) =>
                    setNewEngagement({
                      ...newEngagement,
                      scopeDescription: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E0D7C8] rounded-xl text-xs text-[#1C1F1E] focus:outline-none focus:ring-1 focus:ring-[#113227]"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#F0EBE1] flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEngagementModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#EAE3D5] text-[#1C1F1E] text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-forest px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Create &amp; Deploy Team
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
