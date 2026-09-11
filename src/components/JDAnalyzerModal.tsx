import React from "react";
import { JobMatch } from "../types";
import { 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Building2, 
  MapPin, 
  FileText, 
  TrendingUp,
  Cpu,
  Layers,
  ArrowRight
} from "lucide-react";

interface JDAnalyzerModalProps {
  match: JobMatch | null;
  onClose: () => void;
  onOpenCoverLetter: (match: JobMatch) => void;
  onOpenTailor: (match: JobMatch) => void;
}

export const JDAnalyzerModal: React.FC<JDAnalyzerModalProps> = ({
  match,
  onClose,
  onOpenCoverLetter,
  onOpenTailor
}) => {
  if (!match) return null;

  const totalRequired = match.matched_skills.length + match.missing_skills.length;
  const matchRate = totalRequired > 0 ? Math.round((match.matched_skills.length / totalRequired) * 100) : 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl space-y-6 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <Cpu className="w-3 h-3" />
                TF-IDF & Keyword Engine
              </span>
              <span className="text-xs text-slate-400">Match ID: {match.match_id}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Resume vs. Job Description Analysis
            </h2>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">{match.title}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {match.company}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {match.location}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Score Visuals Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Total Match */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400">Overall Match Score</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-black text-emerald-400">{match.total_score}</span>
              <span className="text-sm text-slate-400 font-semibold">/ 100</span>
            </div>
            <div className="mt-2 text-[11px] text-slate-400">
              {match.total_score >= 90 ? "🔥 Exceptional candidate match" : "⚡ Strong contender match"}
            </div>
          </div>

          {/* Skill Coverage % */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-400">Skill Coverage Rate</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl sm:text-4xl font-black text-indigo-400">{matchRate}%</span>
              <span className="text-xs text-indigo-300 font-medium">({match.matched_skills.length}/{totalRequired} detected)</span>
            </div>
            <div className="w-full bg-slate-750 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-sky-400 h-full rounded-full transition-all duration-500" 
                style={{ width: `${matchRate}%` }}
              />
            </div>
          </div>

          {/* Scoring Math Breakdown */}
          <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-1.5 text-xs">
            <span className="text-xs font-semibold text-slate-400 block mb-1">Algorithm Breakdown</span>
            <div className="flex justify-between text-slate-300">
              <span>TF-IDF Text Similarity:</span>
              <strong className="text-white">{match.tfidf_score} / 40 pts</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Skill Overlap Bonus:</span>
              <strong className="text-white">{match.skill_bonus} / 45 pts</strong>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Domain Keywords Boost:</span>
              <strong className="text-emerald-400">+{match.domain_boost} pts</strong>
            </div>
          </div>
        </div>

        {/* Matched vs Missing Skills Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Matched Skills */}
          <div className="bg-slate-850/80 border border-emerald-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                ✅ Matched Skills in Your Resume ({match.matched_skills.length})
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              These keywords are explicitly verified in both your resume and this job posting:
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(match.matched_skills || [])).map((skill, idx) => (
                <span
                  key={`jd-matched-${skill}-${idx}`}
                  className="px-2.5 py-1 rounded-lg bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-xs font-semibold"
                >
                  {skill}
                </span>
              ))}
              {match.matched_skills.length === 0 && (
                <span className="text-xs text-slate-400 italic">No direct keyword overlap detected</span>
              )}
            </div>
          </div>

          {/* Missing Skills */}
          <div className="bg-slate-850/80 border border-amber-500/20 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <AlertCircle className="w-4 h-4" />
                ❌ Missing Skills from JD ({match.missing_skills.length})
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              Adding these keywords to your resume will boost ATS screening performance:
            </p>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(match.missing_skills || [])).map((skill, idx) => (
                <span
                  key={`jd-missing-${skill}-${idx}`}
                  className="px-2.5 py-1 rounded-lg bg-amber-950/40 text-amber-300 border border-amber-500/30 text-xs font-semibold"
                >
                  {skill}
                </span>
              ))}
              {match.missing_skills.length === 0 && (
                <span className="text-xs text-emerald-400 font-semibold">
                  🎉 Perfect skill match! Zero missing keywords.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Job Description Reference */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            Full Job Description Excerpt
          </h3>
          <p className="text-xs text-slate-300/90 leading-relaxed max-h-40 overflow-y-auto pr-2">
            {match.description}
          </p>
        </div>

        {/* Strategic Next Steps */}
        <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              AI Recommendation to Reach 98%+ Match
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Generate a tailored ATS bullet point revision or customized cover letter highlighting {match.matched_skills.slice(0, 3).join(", ")}.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => {
                onClose();
                onOpenTailor(match);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              Tailor Resume
            </button>
            <button
              onClick={() => {
                onClose();
                onOpenCoverLetter(match);
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow transition flex items-center justify-center gap-1"
            >
              <span>Write Cover Letter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
