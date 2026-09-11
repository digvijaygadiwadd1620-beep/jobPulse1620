import React, { useState, useEffect } from "react";
import { JobMatch, ResumeProfile } from "../types";
import { 
  X, 
  HelpCircle, 
  CheckCircle2, 
  MessageSquare, 
  Lightbulb, 
  RefreshCw, 
  Building2,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface InterviewPrepModalProps {
  match: JobMatch | null;
  profile: ResumeProfile | null;
  onClose: () => void;
}

export const InterviewPrepModal: React.FC<InterviewPrepModalProps> = ({
  match,
  profile,
  onClose
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"technical" | "behavioral" | "ask_company">("technical");
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  const fetchInterviewPrep = async () => {
    if (!match) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/interview-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: match.title,
          company: match.company,
          job_description: match.description,
          matched_skills: match.matched_skills,
          missing_skills: match.missing_skills,
          resume_text: profile?.raw_text || ""
        })
      });
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (match) {
      fetchInterviewPrep();
    }
  }, [match]);

  if (!match) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Interview Question Predictor
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Interview Preparation: {match.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Company: <strong className="text-slate-200">{match.company}</strong> ({match.location})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            {[
              { id: "technical", label: `Technical Questions (${data?.technical_questions?.length || 4})` },
              { id: "behavioral", label: `Behavioral (STAR) (${data?.behavioral_questions?.length || 3})` },
              { id: "ask_company", label: `Questions to Ask (${data?.company_questions_to_ask?.length || 3})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                  activeTab === tab.id
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={fetchInterviewPrep}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition disabled:opacity-50"
            title="Refresh Questions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Tab Content */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3 bg-slate-850 rounded-xl border border-slate-800">
            <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
            <p className="text-xs text-slate-300 font-medium">Predicting company-specific questions with AI...</p>
          </div>
        ) : (
          <div className="space-y-3 min-h-[300px]">
            {/* 1. Technical Questions */}
            {activeTab === "technical" && data?.technical_questions && (
              <div className="space-y-2.5">
                {data.technical_questions.map((q: any, idx: number) => {
                  const isExpanded = expandedIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-slate-850 border border-slate-800 rounded-xl p-4 transition"
                    >
                      <div
                        onClick={() => setExpandedIndex(isExpanded ? null : idx)}
                        className="flex items-start justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                            {q.question}
                          </h4>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                        )}
                      </div>

                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 text-xs animate-in fade-in">
                          <div className="p-2 rounded-lg bg-slate-900/80 border border-slate-800">
                            <span className="text-[11px] font-semibold text-indigo-300 block mb-0.5">
                              Why the interviewer asks this:
                            </span>
                            <p className="text-slate-300">{q.why_asked}</p>
                          </div>

                          <div>
                            <span className="text-[11px] font-semibold text-emerald-400 block mb-1">
                              Key Points to Hit in Your Answer:
                            </span>
                            <ul className="space-y-1 list-disc list-inside text-slate-300">
                              {q.ideal_answer_points?.map((pt: string, pIdx: number) => (
                                <li key={pIdx}>{pt}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. Behavioral Questions */}
            {activeTab === "behavioral" && data?.behavioral_questions && (
              <div className="space-y-3">
                {data.behavioral_questions.map((b: any, idx: number) => (
                  <div key={idx} className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-white">
                        {b.scenario}
                      </h4>
                    </div>
                    <div className="ml-7 p-2.5 rounded-lg bg-amber-950/25 border border-amber-500/20 text-xs">
                      <span className="text-[11px] font-bold text-amber-400 block mb-1">
                        ⭐ STAR Framework Tip:
                      </span>
                      <p className="text-slate-300 leading-relaxed">{b.star_tip}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. Questions to Ask the Company */}
            {activeTab === "ask_company" && data?.company_questions_to_ask && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Asking these strategic questions at the end of your interview demonstrates curiosity, architectural depth, and leadership.
                </p>
                {data.company_questions_to_ask.map((q: string, idx: number) => (
                  <div key={idx} className="bg-slate-850 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-slate-200 font-medium leading-relaxed">
                      "{q}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Done Reviewing
          </button>
        </div>
      </div>
    </div>
  );
};
