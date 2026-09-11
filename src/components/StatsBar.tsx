import React from "react";
import { AppStats } from "../types";
import { 
  Globe2, 
  Target, 
  Trophy, 
  Briefcase, 
  Send
} from "lucide-react";

interface StatsBarProps {
  stats: AppStats | null;
  onOpenTelegramSettings: () => void;
  onFilterTopMatches: () => void;
}

export const StatsBar: React.FC<StatsBarProps> = ({
  stats,
  onOpenTelegramSettings,
  onFilterTopMatches
}) => {
  const totalJobs = stats?.total_jobs || 12;
  const matchedJobs = stats?.matched_jobs || 12;
  const topScore = stats?.top_score || 94;
  const statusCounts = stats?.status_breakdown || { Discovered: 12, Applied: 0, Interview: 0, Offer: 0, Rejected: 0 };
  const inPipeline = (statusCounts.Applied || 0) + (statusCounts.Interview || 0) + (statusCounts.Offer || 0);

  const topScan = stats?.recent_scans?.[0];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 my-4">
      {/* 1. Found Jobs Across India & Global */}
      <div className="bg-slate-850 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Total Scanned Jobs</span>
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
            <Globe2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{totalJobs}</span>
          <span className="text-xs text-slate-400 font-medium">Pan-India & Global</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1.5 truncate">
          <span className="text-emerald-400 font-semibold">JobsPipe + Adzuna</span>
          <span>• 100+ boards</span>
        </div>
      </div>

      {/* 2. Matched Your Profile */}
      <div 
        onClick={onFilterTopMatches}
        className="bg-slate-850 border border-slate-800 hover:border-indigo-500/50 rounded-xl p-3.5 sm:p-4 shadow-sm cursor-pointer transition group"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400 group-hover:text-indigo-400 transition">Matched Profile</span>
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Target className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-bold text-indigo-300 tracking-tight">{matchedJobs}</span>
          <span className="text-xs text-indigo-400 font-medium">≥ 60% relevance</span>
        </div>
        <div className="mt-2 text-[11px] text-indigo-400/80 font-medium truncate">
          TF-IDF + Skill & Domain boosts
        </div>
      </div>

      {/* 3. Top Score */}
      <div className="bg-slate-850 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Top Match Score</span>
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
            <Trophy className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">{topScore}</span>
          <span className="text-xs text-emerald-500/80 font-semibold">/ 100</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-300 font-medium truncate" title={topScan?.top_role || "QA Test Engineer @ GlobalLogic"}>
          {topScan?.top_role || "QA Test Engineer @ GlobalLogic"}
        </div>
      </div>

      {/* 4. Active Pipeline / Telegram Alerts */}
      <div className="bg-slate-850 border border-slate-800 rounded-xl p-3.5 sm:p-4 shadow-sm flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">Active Applications</span>
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Briefcase className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline justify-between">
          <div>
            <span className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{inPipeline}</span>
            <span className="text-xs text-slate-400 ml-2 font-medium">in tracker</span>
          </div>
          <button
            onClick={onOpenTelegramSettings}
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 transition"
            title="Configure Telegram notifications"
          >
            <Send className="w-3 h-3" />
            <span>Telegram {stats?.alert_config?.telegram_chat_id ? "Active" : "Setup"}</span>
          </button>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
          <span>{statusCounts.Applied || 0} Applied</span>
          <span>•</span>
          <span className="text-amber-400">{statusCounts.Interview || 0} Interview</span>
          <span>•</span>
          <span className="text-emerald-400">{statusCounts.Offer || 0} Offer</span>
        </div>
      </div>
    </div>
  );
};
