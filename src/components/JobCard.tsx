import React from "react";
import { JobMatch } from "../types";
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  ExternalLink, 
  Sparkles, 
  FileText, 
  HelpCircle, 
  TrendingUp, 
  Info,
  Check,
  X,
  Clock,
  Layers
} from "lucide-react";

interface JobCardProps {
  match: JobMatch;
  onStatusChange: (matchId: string, status: JobMatch["status"]) => void;
  onOpenAnalyzer: (match: JobMatch) => void;
  onOpenCoverLetter: (match: JobMatch) => void;
  onOpenInterviewPrep: (match: JobMatch) => void;
  onOpenSalary: (match: JobMatch) => void;
  onOpenCompany: (match: JobMatch) => void;
  onOpenTailor: (match: JobMatch) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  match,
  onStatusChange,
  onOpenAnalyzer,
  onOpenCoverLetter,
  onOpenInterviewPrep,
  onOpenSalary,
  onOpenCompany,
  onOpenTailor
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-emerald-400 border-emerald-500/30 bg-emerald-950/20";
    if (score >= 75) return "text-indigo-400 border-indigo-500/30 bg-indigo-950/20";
    if (score >= 60) return "text-sky-400 border-sky-500/30 bg-sky-950/20";
    return "text-slate-400 border-slate-700 bg-slate-800/40";
  };

  const formatSalary = () => {
    if (!match.salary_min && !match.salary_max) return "Competitive Market";
    const curr = match.salary_currency === "INR" ? "₹" : match.salary_currency === "EUR" ? "€" : match.salary_currency === "GBP" ? "£" : "$";
    if (match.salary_currency === "INR") {
      const minL = (match.salary_min || 0) / 100000;
      const maxL = (match.salary_max || 0) / 100000;
      return `${curr}${minL.toFixed(1)}L - ${curr}${maxL.toFixed(1)}L / yr`;
    }
    const minK = Math.round((match.salary_min || 0) / 1000);
    const maxK = Math.round((match.salary_max || 0) / 1000);
    return `${curr}${minK}k - ${curr}${maxK}k / yr`;
  };

  const getStatusBadge = (status: JobMatch["status"]) => {
    switch (status) {
      case "Discovered":
        return "bg-slate-700/60 text-slate-300 border-slate-600";
      case "Applied":
        return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "Interview":
        return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "Offer":
        return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "Rejected":
        return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      default:
        return "bg-slate-700 text-slate-300";
    }
  };

  return (
    <div className="bg-slate-850 hover:bg-slate-825 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 sm:p-5 transition-all duration-200 shadow-sm flex flex-col justify-between group">
      <div>
        {/* Top Header: Score Ring + Title + Source & Status */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            {/* Score Ring Gauge */}
            <div 
              onClick={() => onOpenAnalyzer(match)}
              className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl border ${getScoreColor(match.total_score)} shrink-0 cursor-pointer group-hover:scale-105 transition`}
              title="Click to view full TF-IDF & Skill Match Breakdown"
            >
              <span className="text-xl font-black tracking-tight leading-none">{match.total_score}</span>
              <span className="text-[9px] uppercase tracking-wider font-semibold opacity-75 mt-0.5">Match</span>
            </div>

            {/* Role & Company Details */}
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug group-hover:text-indigo-300 transition truncate">
                {match.title}
              </h3>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-300">
                  <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{match.company}</span>
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{match.location}</span>
                </span>
                {match.is_remote === 1 && (
                  <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 font-semibold text-[10px]">
                    Remote Available
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Source & Status Selector */}
          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
              {match.source}
            </span>
            <select
              value={match.status}
              onChange={(e) => onStatusChange(match.match_id, e.target.value as JobMatch["status"])}
              className={`text-xs font-semibold px-2 py-1 rounded-lg border focus:outline-none transition cursor-pointer ${getStatusBadge(match.status)}`}
            >
              <option value="Discovered">Discovered</option>
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer 🎉</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        {/* Score Breakdown Bar */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1" title="TF-IDF Text Similarity (0-40 pts)">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span>TF-IDF: <strong className="text-slate-200">{match.tfidf_score} pts</strong></span>
            </span>
            <span className="flex items-center gap-1" title="Skill Match Bonus (0-45 pts)">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Skills: <strong className="text-slate-200">{match.skill_bonus} pts</strong></span>
            </span>
            {match.domain_boost > 0 && (
              <span className="flex items-center gap-1 text-indigo-300" title="Domain Boost (e.g. Healthcare / Fintech)">
                <Sparkles className="w-3 h-3 text-indigo-400" />
                <span>Domain Boost: +{match.domain_boost}</span>
              </span>
            )}
          </div>
          <div className="font-semibold text-slate-200 flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span>{formatSalary()}</span>
          </div>
        </div>

        {/* Description Snippet */}
        <p className="mt-2.5 text-xs text-slate-300/90 line-clamp-2 leading-relaxed">
          {match.description}
        </p>

        {/* Skills Matched & Missing Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {/* Matched Skills */}
          {Array.from(new Set(match.matched_skills || [])).slice(0, 5).map((skill, idx) => (
            <span
              key={`card-${match.match_id}-matched-${skill}-${idx}`}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
            >
              <Check className="w-3 h-3 text-emerald-400" />
              {skill}
            </span>
          ))}

          {/* Missing Skills */}
          {Array.from(new Set(match.missing_skills || [])).slice(0, 3).map((skill, idx) => (
            <span
              key={`card-${match.match_id}-missing-${skill}-${idx}`}
              className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20"
              title="Keyword missing from your resume"
            >
              <X className="w-3 h-3 text-amber-400" />
              {skill}
            </span>
          ))}

          {match.matched_skills.length + match.missing_skills.length > 8 && (
            <button
              onClick={() => onOpenAnalyzer(match)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 underline underline-offset-2 ml-1"
            >
              +{match.matched_skills.length + match.missing_skills.length - 8} more
            </button>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1 sm:gap-1.5">
          <button
            onClick={() => onOpenAnalyzer(match)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-750 transition"
            title="Deep Resume vs. JD Analyzer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Analyze JD</span>
          </button>

          <button
            onClick={() => onOpenCoverLetter(match)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-750 transition"
            title="Generate Custom Cover Letter"
          >
            <FileText className="w-3.5 h-3.5 text-sky-400" />
            <span>Cover Letter</span>
          </button>

          <button
            onClick={() => onOpenInterviewPrep(match)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-750 transition"
            title="Interview Question Predictor"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Interview Prep</span>
          </button>

          <button
            onClick={() => onOpenSalary(match)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-750 transition"
            title="Market Salary Estimator"
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>Salary</span>
          </button>

          <button
            onClick={() => onOpenCompany(match)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-750 transition"
            title="Company Research Report"
          >
            <Building2 className="w-3.5 h-3.5 text-purple-400" />
          </button>

          <button
            onClick={() => onOpenTailor(match)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-medium border border-slate-750 transition"
            title="Tailor Resume Bullets for ATS"
          >
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
          </button>
        </div>

        {/* External Link */}
        <a
          href={match.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-semibold transition shrink-0"
        >
          <span>Apply Now</span>
          <ExternalLink className="w-3 h-3 ml-0.5" />
        </a>
      </div>
    </div>
  );
};
