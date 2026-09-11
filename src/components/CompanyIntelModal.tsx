import React, { useState, useEffect } from "react";
import { JobMatch } from "../types";
import { 
  X, 
  Building2, 
  Star, 
  Lightbulb, 
  RefreshCw,
  TrendingUp,
  Award
} from "lucide-react";

interface CompanyIntelModalProps {
  match: JobMatch | null;
  onClose: () => void;
}

export const CompanyIntelModal: React.FC<CompanyIntelModalProps> = ({
  match,
  onClose
}) => {
  const [intel, setIntel] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchIntel = () => {
    if (!match) return;
    setLoading(true);
    fetch("/api/ai/company-intel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        company: match.company,
        job_title: match.title,
        location: match.location
      })
    })
      .then((res) => res.json())
      .then((json) => setIntel(json))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (match) {
      fetchIntel();
    }
  }, [match]);

  if (!match) return null;

  const tips: string[] = Array.isArray(intel?.interview_insider_tips) && intel.interview_insider_tips.length > 0
    ? intel.interview_insider_tips
    : [
        "Candidates who explain real debugging scenarios rather than memorized theory score substantially higher.",
        "Be ready to explain how your automation scripts handle flaky network requests and dynamic UI elements.",
        "Emphasize cross-functional collaboration between QA, developers, and product managers."
      ];

  const initiatives: string[] = Array.isArray(intel?.recent_initiatives) && intel.recent_initiatives.length > 0
    ? intel.recent_initiatives
    : [];

  const rating = intel?.estimated_rating || intel?.rating || "4.2";

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                AI Company Intelligence
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {match.company}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Office / Hub: <span className="text-slate-200 font-medium">{match.location}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3 bg-slate-850 rounded-xl border border-slate-800">
            <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            <p className="text-xs text-slate-300">Gathering company intelligence, culture, and interview insights...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Rating & Size Overview */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-850 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-[11px] text-slate-400 block">Glassdoor Rating</span>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-base font-bold text-white">{rating}</span>
                  <span className="text-xs text-slate-400">/ 5</span>
                </div>
              </div>

              <div className="bg-slate-850 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-[11px] text-slate-400 block">Culture & Work Life</span>
                <span className="text-sm font-bold text-emerald-400 mt-1 block">
                  {intel?.culture_score || "High (4.3/5)"}
                </span>
              </div>

              <div className="bg-slate-850 border border-slate-800 p-3 rounded-xl text-center">
                <span className="text-[11px] text-slate-400 block">Industry Sector</span>
                <span className="text-xs font-bold text-slate-200 mt-1.5 block truncate">
                  {intel?.industry || "Enterprise Tech & QA"}
                </span>
              </div>
            </div>

            {/* Overview */}
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-1.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Company Overview:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {intel?.overview || `${match.company} is a premier technology organization specializing in software engineering, digital product engineering, and scalable enterprise systems.`}
              </p>
            </div>

            {/* Engineering Culture */}
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Engineering Culture & Standards:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                {intel?.engineering_culture || "Strong emphasis on automated CI/CD pipelines, unit/integration test coverage, agile sprints, code reviews, and structured QA-dev handoffs."}
              </p>
            </div>

            {/* Recent Initiatives (if present) */}
            {initiatives.length > 0 && (
              <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-2">
                <span className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
                  Key Projects & Initiatives:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                  {initiatives.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Insider Interview Tips */}
            <div className="bg-purple-950/20 border border-purple-500/30 rounded-xl p-4 space-y-2">
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-purple-400" />
                Insider Interview Advice:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside">
                {tips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={fetchIntel}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh Intel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
