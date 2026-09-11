import React, { useState } from "react";
import { JobMatch } from "../types";
import confetti from "canvas-confetti";
import { 
  Building2, 
  MapPin, 
  Calendar, 
  Edit3, 
  ExternalLink, 
  DollarSign, 
  Trophy, 
  ArrowRight,
  ArrowLeft,
  MessageSquare,
  Sparkles
} from "lucide-react";

interface KanbanBoardProps {
  matches: JobMatch[];
  onStatusChange: (matchId: string, status: JobMatch["status"]) => void;
  onUpdateDetails: (matchId: string, payload: { notes?: string; interview_date?: string; salary_offered?: string }) => void;
  onOpenAnalyzer: (match: JobMatch) => void;
}

const COLUMNS: { id: JobMatch["status"]; title: string; color: string; bg: string }[] = [
  { id: "Discovered", title: "Discovered / To Apply", color: "text-slate-300 border-slate-700", bg: "bg-slate-900/50" },
  { id: "Applied", title: "Applied", color: "text-blue-400 border-blue-500/30", bg: "bg-blue-950/20" },
  { id: "Interview", title: "Interview Rounds", color: "text-amber-400 border-amber-500/30", bg: "bg-amber-950/20" },
  { id: "Offer", title: "Offer Extended 🎉", color: "text-emerald-400 border-emerald-500/30", bg: "bg-emerald-950/20" },
  { id: "Rejected", title: "Archived / Rejected", color: "text-rose-400 border-rose-500/30", bg: "bg-rose-950/20" }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  matches,
  onStatusChange,
  onUpdateDetails,
  onOpenAnalyzer
}) => {
  const [activeEditingMatch, setActiveEditingMatch] = useState<JobMatch | null>(null);
  const [tempNotes, setTempNotes] = useState("");
  const [tempDate, setTempDate] = useState("");
  const [tempSalary, setTempSalary] = useState("");

  const handleStatusChangeWithConfetti = (matchId: string, newStatus: JobMatch["status"]) => {
    if (newStatus === "Offer") {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
    onStatusChange(matchId, newStatus);
  };

  const openEditModal = (match: JobMatch) => {
    setActiveEditingMatch(match);
    setTempNotes(match.notes || "");
    setTempDate(match.interview_date || "");
    setTempSalary(match.salary_offered || "");
  };

  const saveDetails = () => {
    if (activeEditingMatch) {
      onUpdateDetails(activeEditingMatch.match_id, {
        notes: tempNotes,
        interview_date: tempDate,
        salary_offered: tempSalary
      });
      setActiveEditingMatch(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Kanban Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Application Pipeline</h2>
          <p className="text-xs text-slate-400">
            Track your progress from AI-discovered openings to interview schedules and final offers.
          </p>
        </div>
      </div>

      {/* 5-Column Horizontal Scroll Board */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 overflow-x-auto pb-4 min-w-[900px]">
        {COLUMNS.map((col) => {
          const colMatches = matches.filter((m) => m.status === col.id);
          return (
            <div
              key={col.id}
              className={`flex flex-col rounded-2xl border ${col.color} ${col.bg} p-3 min-h-[550px] shadow-sm`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
                <h3 className={`text-xs font-bold tracking-tight ${col.color}`}>
                  {col.title}
                </h3>
                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {colMatches.length}
                </span>
              </div>

              {/* Card List in Column */}
              <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[650px] pr-0.5">
                {colMatches.map((m) => (
                  <div
                    key={m.match_id}
                    className="bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl p-3 shadow transition-all duration-150 group"
                  >
                    {/* Top Row: Score + Company */}
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-[11px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 shrink-0">
                        {m.total_score}%
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded truncate max-w-[90px]">
                        {m.source}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white mt-1.5 line-clamp-2 leading-snug">
                      {m.title}
                    </h4>

                    <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{m.company}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{m.city}, {m.country}</span>
                    </div>

                    {/* Interview Date or Salary offered pill if present */}
                    {m.interview_date && (
                      <div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3" />
                        <span>Interview: {m.interview_date}</span>
                      </div>
                    )}

                    {m.salary_offered && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                        <DollarSign className="w-3 h-3" />
                        <span>Offered: {m.salary_offered}</span>
                      </div>
                    )}

                    {/* Notes preview */}
                    {m.notes && (
                      <p className="mt-1.5 text-[10px] text-slate-300 italic bg-slate-900/60 p-1.5 rounded border border-slate-800 line-clamp-2">
                        "{m.notes}"
                      </p>
                    )}

                    {/* Bottom Actions: Move Left, Edit Notes, Move Right */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                      {/* Move back */}
                      {col.id !== "Discovered" ? (
                        <button
                          onClick={() => {
                            const idx = COLUMNS.findIndex(c => c.id === col.id);
                            if (idx > 0) handleStatusChangeWithConfetti(m.match_id, COLUMNS[idx - 1].id);
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                          title="Move to previous stage"
                        >
                          <ArrowLeft className="w-3 h-3" />
                        </button>
                      ) : <span />}

                      {/* Edit Notes & Interview Date */}
                      <button
                        onClick={() => openEditModal(m)}
                        className="flex items-center gap-1 text-[10px] font-medium px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      >
                        <Edit3 className="w-2.5 h-2.5 text-indigo-400" />
                        <span>Notes</span>
                      </button>

                      {/* Move forward */}
                      {col.id !== "Offer" && col.id !== "Rejected" ? (
                        <button
                          onClick={() => {
                            const idx = COLUMNS.findIndex(c => c.id === col.id);
                            if (idx < COLUMNS.length - 1) handleStatusChangeWithConfetti(m.match_id, COLUMNS[idx + 1].id);
                          }}
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                          title="Advance to next stage"
                        >
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      ) : <span />}
                    </div>
                  </div>
                ))}

                {colMatches.length === 0 && (
                  <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-400 font-medium">No jobs in this stage</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Application Notes / Interview Modal */}
      {activeEditingMatch && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-850 border border-slate-750 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">{activeEditingMatch.title}</h3>
                <p className="text-xs text-slate-400">{activeEditingMatch.company}</p>
              </div>
              <button
                onClick={() => setActiveEditingMatch(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Interview Round / Date:
                </label>
                <input
                  type="text"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  placeholder="e.g. Round 1 Technical on Sept 14, 3:00 PM"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-750 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Salary Discussed / Offered:
                </label>
                <input
                  type="text"
                  value={tempSalary}
                  onChange={(e) => setTempSalary(e.target.value)}
                  placeholder="e.g. ₹22 LPA + ₹2L Joining Bonus"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-750 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Application Notes & Interview Insights:
                </label>
                <textarea
                  rows={4}
                  value={tempNotes}
                  onChange={(e) => setTempNotes(e.target.value)}
                  placeholder="e.g. Spoke with HR manager Priya. They liked Selenium and HL7 experience. Focus next round on Cypress parallel test execution..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-750 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveEditingMatch(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={saveDetails}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white shadow"
              >
                Save Updates
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
