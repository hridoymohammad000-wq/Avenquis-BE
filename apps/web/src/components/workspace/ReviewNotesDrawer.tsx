import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Tag,
  CornerDownRight,
  Plus,
  X,
  Filter,
} from "lucide-react";
import { ReviewNote, ReviewNoteReply, SignOffItem } from "../../types";

interface ReviewNotesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  signoff: SignOffItem;
  onAddReviewNote: (
    signoffId: string,
    note: Omit<ReviewNote, "id" | "timestamp" | "status">,
  ) => void;
  onReplyReviewNote: (
    signoffId: string,
    noteId: string,
    replyContent: string,
  ) => void;
  onUpdateNoteStatus: (
    signoffId: string,
    noteId: string,
    status: ReviewNote["status"],
  ) => void;
  onToast?: (message: string, type: "success" | "info" | "error") => void;
}

const SECTION_OPTIONS = [
  "General Review Observation",
  "Section 1: Audit Objective & Scope",
  "Section 2: Substantive Sampling & Testing",
  "Section 3: Attached Evidence & Confirmations",
  "Section 4: Analytical Variance & Ratio Explanations",
  "Section 5: Disclosure & Presentation (IAS/IFRS)",
];

export const ReviewNotesDrawer: React.FC<ReviewNotesDrawerProps> = ({
  isOpen,
  onClose,
  signoff,
  onAddReviewNote,
  onReplyReviewNote,
  onUpdateNoteStatus,
  onToast,
}) => {
  const [filterStatus, setFilterStatus] = useState<
    "All" | "Open" | "Addressed" | "Cleared"
  >("All");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newSectionRef, setNewSectionRef] = useState(SECTION_OPTIONS[0]);
  const [newContent, setNewContent] = useState("");
  const [newSeverity, setNewSeverity] = useState<
    "High" | "Medium" | "Low" | "Advisory"
  >("Medium");

  // Active reply input state: map of noteId -> string
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);

  if (!isOpen) return null;

  const notes = signoff.reviewNotes || [];
  const filteredNotes = notes.filter((n) => {
    if (filterStatus === "All") return true;
    return n.status === filterStatus;
  });

  const openCount = notes.filter((n) => n.status === "Open").length;
  const clearedCount = notes.filter((n) => n.status === "Cleared").length;

  const handleCreateNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    onAddReviewNote(signoff.id, {
      sectionRef: newSectionRef,
      content: newContent.trim(),
      severity: newSeverity,
      author: "Zahirul Islam, FCA",
      authorRole: "Audit Manager",
    });

    setNewContent("");
    setIsAddingNote(false);
    if (onToast) {
      onToast(`Review note raised on "${newSectionRef}".`, "info");
    }
  };

  const handleSendReply = (noteId: string) => {
    const text = replyInputs[noteId];
    if (!text || !text.trim()) return;

    onReplyReviewNote(signoff.id, noteId, text.trim());
    setReplyInputs((prev) => ({ ...prev, [noteId]: "" }));
    setActiveReplyId(null);
    if (onToast) {
      onToast("Response recorded in review note thread.", "success");
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-xs flex justify-end z-50 animate-fadeIn text-left">
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden border-l border-[#EBE6DD]">
        {/* Drawer Header */}
        <div className="p-5 bg-[#FAF7F2] border-b border-[#EBE6DD] flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs font-bold text-[#113227] bg-[#FAF0DE] px-2 py-0.5 rounded border border-[#EADBBF]">
                {signoff.paperRef}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                {signoff.clientName}
              </span>
            </div>
            <h2 className="text-base font-serif font-bold text-[#1C1F1E] mt-1">
              Review Notes &amp; Audit Queries
            </h2>
            <div className="flex items-center space-x-3 text-xs text-stone-500 mt-0.5">
              <span>
                Total Notes: <strong>{notes.length}</strong>
              </span>
              <span className="text-amber-700">
                Open: <strong>{openCount}</strong>
              </span>
              <span className="text-emerald-700">
                Cleared: <strong>{clearedCount}</strong>
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="p-4 bg-white border-b border-[#F0EBE1] flex items-center justify-between gap-2">
          <div className="flex items-center space-x-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#ECE5D9] text-xs">
            {(["All", "Open", "Addressed", "Cleared"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                  filterStatus === s
                    ? "bg-[#113227] text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddingNote(!isAddingNote)}
            className="btn-forest px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#C58A3E]" />
            <span>Raise Review Note</span>
          </button>
        </div>

        {/* Drawer Body: Notes List & Add Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#FAF8F5]">
          {/* Add Review Note Form */}
          {isAddingNote && (
            <form
              onSubmit={handleCreateNoteSubmit}
              className="p-4 bg-[#FAF0DE] rounded-2xl border border-[#EADBBF] space-y-3 animate-fadeIn"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#8A5A18]">
                  New Audit Review Note
                </span>
                <span className="text-[10px] text-stone-500">
                  Linked to specific WP Section
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                    Target Section
                  </label>
                  <select
                    value={newSectionRef}
                    onChange={(e) => setNewSectionRef(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                  >
                    {SECTION_OPTIONS.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                    Severity Level
                  </label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#E5DDD0] rounded-xl text-xs focus:outline-none"
                  >
                    <option value="High">High (Blocking)</option>
                    <option value="Medium">Medium (Correction Required)</option>
                    <option value="Low">Low (Minor Documentation)</option>
                    <option value="Advisory">Advisory (Recommendation)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-stone-500 mb-1">
                  Review Note Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Clearly describe the audit finding, deficiency, or clarification required..."
                  className="w-full p-2.5 bg-white border border-[#E5DDD0] rounded-xl text-xs focus:outline-none focus:border-[#113227]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingNote(false)}
                  className="px-3 py-1.5 text-xs text-stone-600 rounded-xl hover:bg-stone-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#113227] text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Post Note
                </button>
              </div>
            </form>
          )}

          {/* Notes List */}
          {filteredNotes.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-[#EBE6DD] text-stone-400 text-xs">
              <MessageSquare className="w-8 h-8 text-stone-300 mx-auto mb-2" />
              <p className="font-medium text-stone-600">
                No review notes in this filter view.
              </p>
              <p className="text-[11px] text-stone-400 mt-1">
                All audit checklist items for this working paper are clear.
              </p>
            </div>
          ) : (
            filteredNotes.map((note) => (
              <div
                key={note.id}
                className="p-4 rounded-2xl bg-white border border-[#EBE6DD] shadow-xs space-y-3"
              >
                {/* Note Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-[#113227] bg-[#FAF8F5] border border-[#E5DDD0] px-2 py-0.5 rounded">
                        {note.sectionRef}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          note.severity === "High"
                            ? "bg-rose-100 text-rose-800"
                            : note.severity === "Medium"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {note.severity}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500">
                      By{" "}
                      <strong className="text-stone-800">{note.author}</strong>{" "}
                      ({note.authorRole}) • {note.timestamp}
                    </div>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={note.status}
                    onChange={(e) =>
                      onUpdateNoteStatus(
                        signoff.id,
                        note.id,
                        e.target.value as any,
                      )
                    }
                    className={`text-[10px] font-bold px-2 py-1 rounded-xl border cursor-pointer focus:outline-none ${
                      note.status === "Cleared"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                        : note.status === "Addressed"
                          ? "bg-blue-50 text-blue-800 border-blue-300"
                          : "bg-amber-50 text-amber-800 border-amber-300"
                    }`}
                  >
                    <option value="Open">Open</option>
                    <option value="Addressed">Addressed by Preparer</option>
                    <option value="Cleared">Cleared by Reviewer</option>
                  </select>
                </div>

                {/* Note Content */}
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#ECE5D9] text-xs text-[#1C1F1E] leading-relaxed">
                  {note.content}
                </div>

                {/* Threaded Replies */}
                {note.replies && note.replies.length > 0 && (
                  <div className="space-y-2 pl-3 border-l-2 border-[#113227]/20 pt-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                      <CornerDownRight className="w-3 h-3" />
                      <span>
                        Preparer &amp; Reviewer Replies ({note.replies.length})
                      </span>
                    </div>

                    {note.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="p-2.5 rounded-xl bg-white border border-[#EBE6DD] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-stone-800">
                            {reply.author}{" "}
                            <span className="font-normal text-stone-400">
                              ({reply.role})
                            </span>
                          </span>
                          <span className="font-mono text-stone-400">
                            {reply.timestamp}
                          </span>
                        </div>
                        <p className="text-stone-700 leading-snug">
                          {reply.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reply Button / Box */}
                {activeReplyId === note.id ? (
                  <div className="pt-2 space-y-2 animate-fadeIn">
                    <textarea
                      rows={2}
                      value={replyInputs[note.id] || ""}
                      onChange={(e) =>
                        setReplyInputs((prev) => ({
                          ...prev,
                          [note.id]: e.target.value,
                        }))
                      }
                      placeholder="Write your explanation, evidence reference, or verification response..."
                      className="w-full p-2 bg-white border border-[#E5DDD0] rounded-xl text-xs focus:outline-none focus:border-[#113227]"
                    />
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => setActiveReplyId(null)}
                        className="px-2.5 py-1 text-xs text-stone-500 hover:text-stone-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleSendReply(note.id)}
                        className="px-3 py-1 bg-[#113227] text-white rounded-lg text-xs font-semibold flex items-center space-x-1 shadow-xs cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Send Reply</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-1 text-xs">
                    <button
                      onClick={() => setActiveReplyId(note.id)}
                      className="text-[11px] font-bold text-[#8A5A18] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <CornerDownRight className="w-3.5 h-3.5" />
                      <span>Reply to this note</span>
                    </button>

                    {note.status !== "Cleared" && (
                      <button
                        onClick={() =>
                          onUpdateNoteStatus(signoff.id, note.id, "Cleared")
                        }
                        className="text-[11px] font-semibold text-emerald-800 hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Mark as Cleared</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 bg-[#FAF7F2] border-t border-[#EBE6DD] flex items-center justify-between">
          <div className="text-xs text-stone-500 font-medium">
            ISA 220 Engagement Quality Control Documentation
          </div>
          <button
            onClick={onClose}
            className="btn-forest px-4 py-2 rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
          >
            Close Notes
          </button>
        </div>
      </div>
    </div>
  );
};
