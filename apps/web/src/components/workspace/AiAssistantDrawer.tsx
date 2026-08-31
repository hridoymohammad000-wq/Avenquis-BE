import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  X,
  Bot,
  User,
  ShieldCheck,
  BookOpen,
  FileCheck,
  ExternalLink,
  RotateCcw,
  Copy,
  Check,
  ArrowRight,
  CreditCard,
  Clock,
  SendHorizontal,
  Lock,
  FileText,
  Building,
  Briefcase,
} from "lucide-react";
import { UserSession, WorkspaceTab } from "../../types";

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserSession;
  onNavigateTab?: (tab: WorkspaceTab) => void;
  onTriggerAction?: (actionType: string, payload?: any) => void;
}

interface ActionButton {
  label: string;
  icon?: string;
  actionType:
    | "navigate"
    | "copy"
    | "dispatch_reminder"
    | "open_invoice_modal"
    | "view_wp";
  targetTab?: WorkspaceTab;
  payload?: any;
}

interface OutputCard {
  title: string;
  badge?: string;
  summary: string;
  bulletPoints?: string[];
  actionButtons?: ActionButton[];
}

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  timestamp: string;
  references?: string[];
  outputCard?: OutputCard;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigateTab,
  onTriggerAction,
}) => {
  const [inputQuery, setInputQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-1",
      sender: "ai",
      text: `Greetings, ${currentUser.name}. I am the AVENQUIS Firm Copilot operating strictly within your practice unit. I provide instant analysis on active client working papers, pending ISA 220 quality reviews, unbilled timesheets, and statutory tax compliance under Bangladesh Tax Act 2023.`,
      timestamp: "Just now",
      references: [
        "ISA 220 (Quality Management)",
        "ISA 500 (Audit Evidence)",
        "Income Tax Act 2023",
      ],
      outputCard: {
        title: "Active Practice Context Loaded",
        badge: "ICAB & ISA Grounded",
        summary: `Practice scope for ${currentUser.tenant}: 5 active engagements, 2 pending review sign-offs, and 3 client PBC requests currently tracked.`,
        bulletPoints: [
          "Apex Footwear FY25: WP B-200 Bank Recon awaiting Partner signature.",
          "Orbit Textiles: Overdue VAT appeal fee invoice (BDT 2.87 Lac).",
          "Novartis Healthcare: Q3 Tax Retainer reconciled and cleared.",
        ],
        actionButtons: [
          {
            label: "View Pending Sign-offs",
            actionType: "navigate",
            targetTab: "reviews",
          },
          {
            label: "Inspect Client Requests",
            actionType: "navigate",
            targetTab: "client-requests",
          },
        ],
      },
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Contextual Prompt Chips (Explicitly matching user request specifications)
  const contextualChips = [
    {
      label: "Summarize pending audit sign-offs",
      query: "Summarize pending audit sign-offs",
    },
    {
      label: "Draft client document reminder",
      query: "Draft client document reminder for Apex Footwear",
    },
    {
      label: "Check unbilled hours for Client X",
      query: "Check unbilled hours for Apex Footwear & Polymer Ltd.",
    },
    {
      label: "Test inventory NRV under IAS 2",
      query:
        "How do I test inventory NRV under IAS 2 for manufacturing clients?",
    },
    {
      label: "ISA 505 standard bank confirmation",
      query: "Provide ISA 505 standard bank confirmation wording",
    },
  ];

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleActionButtonClick = (btn: ActionButton) => {
    if (btn.actionType === "navigate" && btn.targetTab && onNavigateTab) {
      onNavigateTab(btn.targetTab);
      onClose();
    } else if (btn.actionType === "copy" && btn.payload) {
      handleCopyText(btn.payload, "card-copy");
    } else if (btn.actionType === "dispatch_reminder" && onTriggerAction) {
      onTriggerAction("dispatch_reminder", btn.payload);
      if (onNavigateTab) onNavigateTab("client-requests");
      onClose();
    } else if (btn.actionType === "open_invoice_modal" && onNavigateTab) {
      onNavigateTab("finance");
      onClose();
    } else if (btn.actionType === "view_wp" && onNavigateTab) {
      onNavigateTab("audit-files");
      onClose();
    }
  };

  const handleSend = (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim()) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: "Now",
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    setTimeout(() => {
      let aiResponseText = "";
      let refs: string[] = [];
      let card: OutputCard | undefined = undefined;

      const lower = textToSend.toLowerCase();

      // 1. "Summarize pending audit sign-offs"
      if (
        lower.includes("sign-off") ||
        lower.includes("pending audit") ||
        lower.includes("review queue")
      ) {
        aiResponseText = `I have audited the working paper queue under **ISA 220 (Quality Management for an Audit)**. There are currently **2 working papers** requiring formal supervisory review before financial statement sign-off:`;
        refs = [
          "ISA 220 (Revised) Paras 29-34",
          "ISA 230 Audit Documentation",
          "ICAB Quality Assurance Review",
        ];
        card = {
          title: "ISA 220 Supervisory Review Summary",
          badge: "2 Papers Pending",
          summary:
            "Working papers prepared and verified with SHA-256 digital seals waiting for Partner & Manager sign-off.",
          bulletPoints: [
            "WP B-200: Cash & Bank Balances (Apex Footwear FY25) - Manager Sign-off Complete, awaiting Senior Partner Fouzia Haque, FCA.",
            "WP E-500: Inventory NRV & Valuation Testing (Apex Footwear FY25) - Awaiting Manager Review with 2 open audit queries.",
            "WP C-301: Revenue Cutoff Testing (Orbit Textiles) - 100% procedures completed by Nadia Sharmin, ACCA.",
          ],
          actionButtons: [
            {
              label: "Open Sign-off Queue",
              actionType: "navigate",
              targetTab: "reviews",
            },
            {
              label: "View Working Papers",
              actionType: "view_wp",
              targetTab: "audit-files",
            },
          ],
        };
      }
      // 2. "Draft client document reminder"
      else if (
        lower.includes("reminder") ||
        lower.includes("draft client") ||
        lower.includes("pbc")
      ) {
        const emailDraft = `Subject: URGENT: Outstanding Audit Deliverables for FY2025-26 - Apex Footwear & Polymer Ltd.

Dear Mr. Tanvir Ahmed (Head of Accounts & Finance),

We hope this message finds you well.

As part of our statutory audit fieldwork under International Standards on Auditing (ISA 500), we kindly remind your team that the following essential deliverables remain outstanding:

1. Bank Confirmation Certificate for EBL Principal Account #104102948 (Bank Scan / Authenticated PDF)
2. Final Factory Raw Materials & Finished Goods Inventory Physical Count Sheet (Excel / Signed Sheet)
3. Fixed Asset Register with Depreciation Schedules for FY2025-26

To prevent any delay in our scheduled Audit Committee submission, please upload these documents via your secure AVENQUIS PBC Client Portal by September 05, 2026.

Thank you for your prompt cooperation.

Sincerely,
Zahirul Islam, FCA
Manager - Audit & Assurance
FAMES & R / AVENQUIS Chartered Accountants`;

        aiResponseText = `I have drafted a formal, ISA 500-compliant document reminder letter for your client's accounts department:`;
        refs = [
          "ISA 500 Audit Evidence",
          "PBC Portal Protocol",
          "Client Requisition Standard",
        ];
        card = {
          title: "Draft Client Escalation Letter",
          badge: "Ready to Dispatch",
          summary:
            "Formal notice addressing CFO & Accounts Lead with list of delinquent PBC deliverables and deadline.",
          bulletPoints: [
            "Includes direct portal upload instructions and SHA-256 cryptographic verification disclaimer.",
            "Cites mandatory statutory audit timetable for upcoming Audit Committee.",
          ],
          actionButtons: [
            {
              label:
                copiedId === "draft-email"
                  ? "Draft Copied!"
                  : "Copy Draft to Clipboard",
              actionType: "copy",
              payload: emailDraft,
            },
            {
              label: "Dispatch Client Reminder",
              actionType: "dispatch_reminder",
              payload: {
                clientName: "Apex Footwear",
                ticketNo: "PBC-2026-901",
              },
            },
          ],
        };
      }
      // 3. "Check unbilled hours for Client X"
      else if (
        lower.includes("unbilled") ||
        lower.includes("timesheet") ||
        lower.includes("client x") ||
        lower.includes("apex")
      ) {
        aiResponseText = `Here is the real-time unbilled work-in-progress (WIP) analysis for **Apex Footwear & Polymer Ltd.** across all active engagement codes:`;
        refs = [
          "Timesheet Ledger FY26",
          "Partner Fee Schedule",
          "WIP Realization Ratio",
        ];
        card = {
          title: "Unbilled Hours & WIP Summary (Apex Footwear)",
          badge: "BDT 2.15 Lac WIP",
          summary:
            "42 unbilled hours logged across 3 audit team members during interim substantive procedures.",
          bulletPoints: [
            "Zahirul Islam, FCA (Manager): 12.5 hrs @ ৳8,500/hr = BDT 106,250",
            "Nadia Sharmin, ACCA (Senior): 18.0 hrs @ ৳4,500/hr = BDT 81,000",
            "Sabbir Ahmed (Articled Student): 11.5 hrs @ ৳2,400/hr = BDT 27,600",
            "Total Unbilled WIP Subtotal: BDT 214,850 + 15% VAT (BDT 32,227) = BDT 247,077",
          ],
          actionButtons: [
            {
              label: "Generate Invoice from WIP",
              actionType: "open_invoice_modal",
              targetTab: "finance",
            },
            {
              label: "Inspect Staff Timesheets",
              actionType: "navigate",
              targetTab: "timesheets",
            },
          ],
        };
      }
      // 4. Inventory NRV under IAS 2
      else if (
        lower.includes("nrv") ||
        lower.includes("ias 2") ||
        lower.includes("inventory")
      ) {
        aiResponseText = `Under **IAS 2 (Inventories)**, inventory items must be stated at the *lower of cost and net realizable value (NRV)*. Here is the recommended substantive testing procedure for manufacturing audit clients:`;
        refs = [
          "IAS 2 Paras 9-33",
          "ISA 501 Inventory Physical Verification",
          "WP Ref E-500",
        ];
        card = {
          title: "IAS 2 Inventory Valuation Procedure Guide",
          badge: "Substantive Checklist",
          summary:
            "Audit testing matrix to verify potential inventory write-downs and slow-moving provision adequacy.",
          bulletPoints: [
            "Test subsequent selling prices on post-year-end sales invoices.",
            "Estimate completion costs (direct labor + variable factory electricity/overheads).",
            "Estimate marketing, distribution, and export freight costs to deduct.",
            "Identify non-moving chemical & polymer batches exceeding 180 days in factory storage.",
          ],
          actionButtons: [
            {
              label: "View Inventory Working Paper",
              actionType: "view_wp",
              targetTab: "audit-files",
            },
          ],
        };
      }
      // 5. Bank Confirmation ISA 505
      else if (lower.includes("505") || lower.includes("bank confirmation")) {
        aiResponseText = `Under **ISA 505 (External Confirmations)**, the auditor must maintain direct control over standard confirmation requests to commercial banking institutions:`;
        refs = [
          "ISA 505 Paras 7-14",
          "ISA 500 Appropriate Evidence",
          "ICAB Bank Confirmation Format",
        ];
        card = {
          title: "ISA 505 Standard Bank Confirmation Protocol",
          badge: "Direct Verification",
          summary:
            "Mandatory confirmation requests must cover all active, dormant, and zero-balance deposit and loan facilities.",
          bulletPoints: [
            "Direct dispatch to bank head office treasury / branch manager with client authorization letter.",
            "Confirmation of outstanding Letter of Credit (LC) liabilities & Bank Guarantees.",
            "Confirmation of foreign exchange forward contracts and pledged collateral assets.",
          ],
          actionButtons: [
            {
              label: "Inspect Cash & Bank Workpaper",
              actionType: "view_wp",
              targetTab: "audit-files",
            },
          ],
        };
      }
      // Default
      else {
        aiResponseText = `I have analyzed your query across **${currentUser.tenant}** practice records and applicable International Standards on Auditing (ISA) and IFRS:\n\n- All working papers in AVENQUIS maintain cryptographic SHA-256 digital seals.\n- All team timesheets are indexed for instantaneous milestone and hourly fee invoicing.\n- Let me know if you would like me to draft client correspondence, calculate materiality thresholds, or summarize partner sign-off queues.`;
        refs = [
          "ISA 220 Quality Management",
          "IFRS Framework",
          "Firm OS Engine",
        ];
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: aiResponseText,
        timestamp: "Just now",
        references: refs,
        outputCard: card,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 700);
  };

  const handleResetConversation = () => {
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: "ai",
        text: `Conversation history cleared. Ready for your next audit research query, client reminder draft, or sign-off review.`,
        timestamp: "Just now",
        references: ["ISA 220", "Income Tax Act 2023"],
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden text-left">
      {/* Dark Overlay Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-900/40 backdrop-blur-xs transition-opacity animate-fadeIn"
      />

      {/* Slide-over Drawer Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className="w-screen max-w-lg bg-[#FAF7F2] border-l border-[#EBE6DD] shadow-2xl flex flex-col justify-between animate-slideLeft">
          {/* Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-[#EBE6DD] bg-white flex flex-col space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#113227] to-[#1E4D3E] text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5 text-[#C58A3E]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#1C1F1E] flex items-center gap-1.5">
                    AVENQUIS AI Audit Copilot
                  </h3>
                  <p className="text-[11px] text-[#7A8782]">
                    Practice:{" "}
                    <span className="font-semibold text-stone-700">
                      {currentUser.tenant.split(" ")[0]}
                    </span>{" "}
                    • {currentUser.name.split(",")[0]}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5">
                <button
                  onClick={handleResetConversation}
                  title="Clear conversation"
                  className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-stone-400 hover:text-[#1C1F1E] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Prominent Permission-Safe Context Badge */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#E1F3EE] border border-[#BDE5D9] text-[#1F5946] text-xs font-semibold">
              <div className="flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-[#1F5946]" />
                <span className="font-bold">
                  Firm Context Protected • Read-Only Scope
                </span>
              </div>
              <span className="text-[10px] bg-white text-[#113227] px-1.5 py-0.2 rounded font-mono font-bold">
                Cmd + J
              </span>
            </div>
          </div>

          {/* Contextual Prompt Chips (Horizontal & Wrap) */}
          <div className="p-3.5 bg-[#FAF8F5] border-b border-[#EBE6DD] space-y-2">
            <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-[#8A9691] block">
              Contextual Audit &amp; Practice Actions
            </span>
            <div className="flex flex-wrap gap-1.5">
              {contextualChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip.query)}
                  className="text-[11px] text-left bg-white hover:bg-[#FAF0DE] hover:border-[#E0CDA9] border border-[#E5DDD0] text-stone-800 font-medium px-2.5 py-1.5 rounded-xl transition-all shadow-2xs cursor-pointer flex items-center space-x-1"
                >
                  <span>{chip.label}</span>
                  <ArrowRight className="w-2.5 h-2.5 text-stone-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Chat Messages Canvas */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col space-y-1.5 ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                {/* Message Header Tag */}
                <div className="flex items-center space-x-1.5 text-[10px] text-stone-400 px-1 font-mono">
                  {msg.sender === "ai" ? (
                    <>
                      <Bot className="w-3 h-3 text-[#113227]" />
                      <span className="font-bold text-[#113227]">
                        AVENQUIS Copilot
                      </span>
                    </>
                  ) : (
                    <>
                      <User className="w-3 h-3 text-stone-600" />
                      <span>{currentUser.name}</span>
                    </>
                  )}
                  <span>• {msg.timestamp}</span>
                </div>

                {/* Message Text Bubble */}
                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[92%] shadow-2xs ${
                    msg.sender === "user"
                      ? "bg-[#113227] text-white font-medium rounded-tr-xs"
                      : "bg-white border border-[#EBE6DD] text-[#1C1F1E] rounded-tl-xs"
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>

                  {/* Standard References */}
                  {msg.references && msg.references.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[#F0EBE1] flex flex-wrap gap-1">
                      {msg.references.map((ref, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-[#FAF7F2] text-[#8A5A18] border border-[#EADBBF] px-1.5 py-0.5 rounded font-mono font-medium"
                        >
                          {ref}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Structured AI Output Card with Direct Action Buttons */}
                {msg.outputCard && (
                  <div className="w-full max-w-[95%] p-4 rounded-2xl bg-white border-2 border-[#E1F3EE] shadow-xs space-y-3 mt-1">
                    <div className="flex items-center justify-between pb-2 border-b border-[#F0EBE1]">
                      <div className="flex items-center space-x-2">
                        <FileCheck className="w-4 h-4 text-[#1F5946]" />
                        <h4 className="text-xs font-bold text-[#113227]">
                          {msg.outputCard.title}
                        </h4>
                      </div>
                      {msg.outputCard.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E1F3EE] text-[#1F5946]">
                          {msg.outputCard.badge}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#66706B] leading-relaxed">
                      {msg.outputCard.summary}
                    </p>

                    {msg.outputCard.bulletPoints && (
                      <div className="space-y-1 bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE3D5]">
                        {msg.outputCard.bulletPoints.map((pt, idx) => (
                          <div
                            key={idx}
                            className="flex items-start space-x-2 text-[11px] text-[#1C1F1E]"
                          >
                            <span className="text-[#C58A3E] font-bold mt-0.5">
                              ▪
                            </span>
                            <span className="leading-snug">{pt}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Direct Action Buttons */}
                    {msg.outputCard.actionButtons &&
                      msg.outputCard.actionButtons.length > 0 && (
                        <div className="pt-1 flex flex-wrap gap-2">
                          {msg.outputCard.actionButtons.map((btn, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleActionButtonClick(btn)}
                              className="px-3 py-1.5 rounded-xl bg-[#113227] hover:bg-[#1A4536] text-white text-xs font-bold flex items-center space-x-1.5 shadow-2xs transition-colors cursor-pointer"
                            >
                              <span>{btn.label}</span>
                              <ArrowRight className="w-3 h-3 text-[#C58A3E]" />
                            </button>
                          ))}
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center space-x-2 text-xs text-[#7A8782] bg-white p-3 rounded-2xl border border-[#EBE6DD] w-48 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-[#C58A3E] animate-spin" />
                <span>Auditing practice context...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Query Input Box */}
          <div className="p-4 bg-white border-t border-[#EBE6DD]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="relative flex items-center"
            >
              <input
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Ask ISA standards, summarize sign-offs, or check WIP..."
                className="w-full pl-3.5 pr-12 py-3 bg-[#FAF8F5] border border-[#E5DDD0] rounded-2xl text-xs text-[#1C1F1E] focus:outline-none focus:border-[#113227] shadow-inner"
              />
              <button
                type="submit"
                disabled={!inputQuery.trim() || isTyping}
                className="absolute right-2 p-2 rounded-xl bg-[#113227] hover:bg-[#1A4536] text-white disabled:opacity-40 transition-all cursor-pointer shadow-xs"
              >
                <SendHorizontal className="w-4 h-4 text-[#C58A3E]" />
              </button>
            </form>
            <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400">
              <span>Press Enter to analyze query</span>
              <span>Context restricted to active client files</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
