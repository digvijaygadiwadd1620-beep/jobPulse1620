import React, { useState } from "react";
import { JobMatch, FilterState, ResumeProfile } from "../types";
import { JobCard } from "./JobCard";
import { 
  Search, 
  SlidersHorizontal, 
  MapPin, 
  Globe, 
  Sparkles, 
  Grid3X3, 
  List, 
  RotateCcw,
  CheckCircle2,
  FileText,
  UploadCloud,
  ArrowRight
} from "lucide-react";

interface MatchesFeedProps {
  matches: JobMatch[];
  filters: FilterState;
  isLoading?: boolean;
  activeProfile?: ResumeProfile | null;
  onOpenResumeManager?: () => void;
  onFilterChange: (filters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  onStatusChange: (matchId: string, status: JobMatch["status"]) => void;
  onOpenAnalyzer: (match: JobMatch) => void;
  onOpenCoverLetter: (match: JobMatch) => void;
  onOpenInterviewPrep: (match: JobMatch) => void;
  onOpenSalary: (match: JobMatch) => void;
  onOpenCompany: (match: JobMatch) => void;
  onOpenTailor: (match: JobMatch) => void;
}

export const MatchesFeed: React.FC<MatchesFeedProps> = ({
  matches,
  filters,
  isLoading = false,
  activeProfile,
  onOpenResumeManager,
  onFilterChange,
  onResetFilters,
  onStatusChange,
  onOpenAnalyzer,
  onOpenCoverLetter,
  onOpenInterviewPrep,
  onOpenSalary,
  onOpenCompany,
  onOpenTailor
}) => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const CITIES = [
    { value: "all", label: "All Cities" },
    { value: "Pune", label: "Pune" },
    { value: "Bangalore", label: "Bangalore" },
    { value: "Hyderabad", label: "Hyderabad" },
    { value: "Mumbai", label: "Mumbai" },
    { value: "San Francisco", label: "San Francisco" },
    { value: "London", label: "London" },
    { value: "Berlin", label: "Berlin" },
    { value: "Dubai", label: "Dubai" },
    { value: "Singapore", label: "Singapore" },
    { value: "Sydney", label: "Sydney" }
  ];

  const COUNTRIES = [
    { value: "all", label: "All Countries" },
    { value: "India", label: "India 🇮🇳" },
    { value: "USA", label: "USA 🇺🇸" },
    { value: "UK", label: "UK 🇬🇧" },
    { value: "Germany", label: "Germany 🇩🇪" },
    { value: "UAE", label: "UAE 🇦🇪" },
    { value: "Singapore", label: "Singapore 🇸🇬" },
    { value: "Australia", label: "Australia 🇦🇺" }
  ];

  return (
    <div className="space-y-4">
      {/* Active Resume Profile Header Banner */}
      {activeProfile && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900 border border-indigo-500/30 rounded-2xl p-4 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Active Matched Resume
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {activeProfile.domain || "general"}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-0.5 truncate">
                {activeProfile.name} • <span className="text-indigo-300 font-medium">{activeProfile.target_title}</span>
              </h3>
              <div className="flex flex-wrap gap-1 mt-1">
                {(activeProfile.skills || []).slice(0, 6).map((s, idx) => (
                  <span key={idx} className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-750">
                    {s}
                  </span>
                ))}
                {(activeProfile.skills || []).length > 6 && (
                  <span className="text-[10px] text-slate-400 self-center">
                    +{(activeProfile.skills || []).length - 6} more
                  </span>
                )}
              </div>
            </div>
          </div>

          {onOpenResumeManager && (
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <button
                id="btn-feed-upload-new-resume"
                onClick={onOpenResumeManager}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Upload New Resume</span>
              </button>
            </div>
          )}
        </div>
      )}
      {/* Search & Filter Header */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        {/* Top Search Bar & View Mode Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => onFilterChange({ search: e.target.value })}
              placeholder="Search by company, role (e.g. QA Test Engineer, Selenium, React), or keyword..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-750 text-white placeholder-slate-400 text-sm focus:outline-none focus:border-indigo-500 transition"
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange({ search: "" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Sort Dropdown */}
            <select
              value={filters.sort}
              onChange={(e) => onFilterChange({ sort: e.target.value })}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-750 text-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 transition cursor-pointer"
            >
              <option value="score_desc">Highest Match Score</option>
              <option value="date_desc">Newest Posted</option>
              <option value="salary_desc">Highest Salary</option>
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-750 rounded-xl p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === "grid" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Grid view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-lg text-xs transition ${
                  viewMode === "list" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"
                }`}
                title="Detailed list view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills / Dropdowns: City, Country, Min Score, Status */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-800">
          <div className="flex flex-wrap items-center gap-2">
            {/* Country Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filters.country}
                onChange={(e) => onFilterChange({ country: e.target.value })}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-slate-850 text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* City Selector */}
            <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filters.city}
                onChange={(e) => onFilterChange({ city: e.target.value })}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
              >
                {CITIES.map((c) => (
                  <option key={c.value} value={c.value} className="bg-slate-850 text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Application Status Filter */}
            <select
              value={filters.status}
              onChange={(e) => onFilterChange({ status: e.target.value })}
              className="bg-slate-900 border border-slate-750 rounded-lg px-2.5 py-1 text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="Discovered">Discovered</option>
              <option value="Applied">Applied</option>
              <option value="Interview">Interview</option>
              <option value="Offer">Offer 🎉</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Quick Score Threshold Pills */}
            <div className="flex items-center gap-1">
              {[
                { label: "All Scores", val: 0 },
                { label: "75+ Great", val: 75 },
                { label: "90+ Top Match", val: 90 }
              ].map((btn) => (
                <button
                  key={btn.val}
                  onClick={() => onFilterChange({ min_score: btn.val })}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                    filters.min_score === btn.val
                      ? "bg-indigo-600 text-white border-indigo-500 shadow-sm"
                      : "bg-slate-900 text-slate-400 border-slate-750 hover:text-slate-200"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reset Filters button */}
          {(filters.city !== "all" || filters.country !== "all" || filters.status !== "all" || filters.min_score > 0 || filters.search) && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium py-1 transition"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-slate-400 font-medium">
          Showing <span className="text-white font-bold">{matches.length}</span> verified job postings matching your resume
        </p>
        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>90+ High Match</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span>75-89 Strong</span>
          </span>
        </div>
      </div>

      {/* Job Cards Grid / List */}
      {matches.length > 0 ? (
        <div className={viewMode === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "space-y-4"}>
          {matches.map((match) => (
            <JobCard
              key={match.match_id}
              match={match}
              onStatusChange={onStatusChange}
              onOpenAnalyzer={onOpenAnalyzer}
              onOpenCoverLetter={onOpenCoverLetter}
              onOpenInterviewPrep={onOpenInterviewPrep}
              onOpenSalary={onOpenSalary}
              onOpenCompany={onOpenCompany}
              onOpenTailor={onOpenTailor}
            />
          ))}
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-slate-850/80 border border-slate-800/80 rounded-2xl p-5 space-y-4 animate-pulse">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="h-5 bg-slate-800 rounded-md w-3/4"></div>
                  <div className="h-3.5 bg-slate-800/60 rounded-md w-1/2"></div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-slate-800"></div>
              </div>
              <div className="h-10 bg-slate-800/40 rounded-lg"></div>
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-slate-800 rounded-full"></div>
                <div className="h-6 w-24 bg-slate-800 rounded-full"></div>
                <div className="h-6 w-16 bg-slate-800 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-850 border border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h4 className="text-base font-bold text-white">No job matches found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1.5">
            Try loosening your city, country, or minimum match score filters, or upload a new resume to discover fresh opportunities.
          </p>
          <button
            onClick={onResetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow transition"
          >
            Reset All Filters
          </button>
        </div>
      )}
    </div>
  );
};
