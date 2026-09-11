import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  JobMatch, 
  ResumeProfile, 
  AppStats, 
  AlertConfig, 
  FilterState, 
  ScanLog 
} from "./types";
import { SAMPLE_PROFILES } from "./data/sampleProfiles";
import { Header } from "./components/Header";
import { Sidebar, ActiveTab } from "./components/Sidebar";
import { StatsBar } from "./components/StatsBar";
import { MatchesFeed } from "./components/MatchesFeed";
import { KanbanBoard } from "./components/KanbanBoard";
import { JDAnalyzerModal } from "./components/JDAnalyzerModal";
import { CoverLetterModal } from "./components/CoverLetterModal";
import { InterviewPrepModal } from "./components/InterviewPrepModal";
import { SalaryEstimatorModal } from "./components/SalaryEstimatorModal";
import { CompanyIntelModal } from "./components/CompanyIntelModal";
import { ResumeTailorModal } from "./components/ResumeTailorModal";
import { ResumeManagerModal } from "./components/ResumeManagerModal";
import { AlertSettingsModal } from "./components/AlertSettingsModal";
import { AgentScannerLogs } from "./components/AgentScannerLogs";
import { ToastAlert, ToastAlertData } from "./components/ToastAlert";

export default function App() {
  // State
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [stats, setStats] = useState<AppStats | null>(null);
  const [activeProfile, setActiveProfile] = useState<ResumeProfile>(SAMPLE_PROFILES[0]);
  const [activeTab, setActiveTab] = useState<ActiveTab>("matches");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    city: "all",
    country: "all",
    status: "all",
    min_score: 0,
    search: "",
    sort: "score_desc"
  });

  // Modals state
  const [analyzingMatch, setAnalyzingMatch] = useState<JobMatch | null>(null);
  const [coverLetterMatch, setCoverLetterMatch] = useState<JobMatch | null>(null);
  const [interviewMatch, setInterviewMatch] = useState<JobMatch | null>(null);
  const [salaryMatch, setSalaryMatch] = useState<JobMatch | null>(null);
  const [companyMatch, setCompanyMatch] = useState<JobMatch | null>(null);
  const [tailorMatch, setTailorMatch] = useState<JobMatch | null>(null);
  const [resumeModalOpen, setResumeModalOpen] = useState<boolean>(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState<boolean>(false);
  const [toastAlert, setToastAlert] = useState<ToastAlertData | null>(null);
  const [savedProfiles, setSavedProfiles] = useState<ResumeProfile[]>(SAMPLE_PROFILES);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionWarning, setConnectionWarning] = useState<string | null>(null);

  const activeProfileRef = useRef<ResumeProfile | null>(activeProfile);
  useEffect(() => {
    activeProfileRef.current = activeProfile;
  }, [activeProfile]);

  // Resilient JSON fetcher with automatic exponential backoff retry
  const safeFetchJson = async <T,>(url: string, retries = 3, delayMs = 600): Promise<T | null> => {
    let lastErr: any = null;
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        return data as T;
      } catch (err) {
        lastErr = err;
        if (i < retries - 1) {
          await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(1.5, i)));
        }
      }
    }
    console.warn(`Fetch notice for ${url} (retried ${retries}x):`, lastErr?.message || lastErr);
    return null;
  };

  // Load Initial Data
  const loadJobs = async (resumeId?: string) => {
    const targetId = resumeId || activeProfileRef.current?.id || activeProfile?.id;
    const url = targetId ? `/api/jobs?resume_id=${encodeURIComponent(targetId)}` : "/api/jobs";
    const data = await safeFetchJson<JobMatch[]>(url);
    if (Array.isArray(data) && data.length > 0) {
      setMatches(data);
      setConnectionWarning(null);
    } else if (Array.isArray(data) && data.length === 0) {
      setMatches([]);
      setConnectionWarning(null);
    } else if (!data && matches.length === 0) {
      setConnectionWarning("Connecting to JobPulse Agent Engine...");
    }
  };

  const loadStats = async (resumeId?: string) => {
    const targetId = resumeId || activeProfileRef.current?.id || activeProfile?.id;
    const url = targetId ? `/api/stats?resume_id=${encodeURIComponent(targetId)}` : "/api/stats";
    const data = await safeFetchJson<AppStats>(url);
    if (data && data.total_jobs !== undefined) {
      setStats(data);
      setConnectionWarning(null);
      if (data?.active_profile?.name) {
        setActiveProfile((prev) => {
          if (!prev || prev.id !== data.active_profile.id || prev.name !== data.active_profile.name) {
            return data.active_profile;
          }
          return prev;
        });
      }
    }
  };

  const loadResumes = async () => {
    const data = await safeFetchJson<ResumeProfile[]>("/api/resumes");
    if (Array.isArray(data) && data.length > 0) {
      setSavedProfiles(data);
      const active = data.find((r) => r.is_active === 1);
      if (active) {
        setActiveProfile(active);
      }
    }
  };

  const loadAll = async () => {
    setIsLoading(true);
    try {
      await Promise.all([loadJobs(), loadStats(), loadResumes()]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();

    // Trigger initial toast to show user the 24/7 Agent is ready
    const initTimer = setTimeout(() => {
      setToastAlert({
        id: "init-toast",
        title: "Senior QA Automation Engineer (Healthcare)",
        company: "GlobalLogic",
        location: "Pune, India",
        score: 94
      });
    }, 1500);

    // Periodic live refresh every 30 seconds to keep stats and new matches updated
    const liveRefreshTimer = setInterval(() => {
      loadJobs();
      loadStats();
      loadResumes();
    }, 30000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(liveRefreshTimer);
    };
  }, []);

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    return matches.filter((m) => {
      // City
      if (filters.city !== "all" && m.city.toLowerCase() !== filters.city.toLowerCase()) {
        return false;
      }
      // Country
      if (filters.country !== "all" && m.country.toLowerCase() !== filters.country.toLowerCase()) {
        return false;
      }
      // Status
      if (filters.status !== "all" && m.status !== filters.status) {
        return false;
      }
      // Min Score
      if (filters.min_score > 0 && m.total_score < filters.min_score) {
        return false;
      }
      // Search
      if (filters.search.trim()) {
        const query = filters.search.toLowerCase();
        const inTitle = m.title.toLowerCase().includes(query);
        const inCompany = m.company.toLowerCase().includes(query);
        const inDesc = m.description.toLowerCase().includes(query);
        const inSkills = m.matched_skills.some((s) => s.toLowerCase().includes(query));
        if (!inTitle && !inCompany && !inDesc && !inSkills) return false;
      }
      return true;
    }).sort((a, b) => {
      if (filters.sort === "score_desc") return b.total_score - a.total_score;
      if (filters.sort === "salary_desc") return (b.salary_max || 0) - (a.salary_max || 0);
      return new Date(b.posted_at || 0).getTime() - new Date(a.posted_at || 0).getTime();
    });
  }, [matches, filters]);

  // Actions
  const handleScanNow = React.useCallback(async () => {
    setIsScanning((curr) => {
      if (curr) return curr;
      return true;
    });

    try {
      const profile = activeProfileRef.current || activeProfile;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 18000);

      const res = await fetch("/api/scan/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          resume_id: profile?.id || "",
          candidate_name: profile?.name || "",
          target_title: profile?.target_title || "",
          domain: profile?.domain || "",
          skills: profile?.skills || [],
          raw_text: profile?.raw_text || ""
        })
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      const currentResumeId = profile?.id;
      await Promise.all([loadJobs(currentResumeId), loadStats(currentResumeId)]);

      // Show top match alert
      const top = data.top_match;
      if (top) {
        setToastAlert({
          id: `scan-${Date.now()}`,
          title: top.title,
          company: top.company,
          location: top.location,
          score: top.score || top.total_score || 94,
          match: top
        });
      }
    } catch (err: any) {
      console.warn("Scan notice:", err?.message || err);
      // Reload current jobs and stats in case updates occurred
      const currentResumeId = activeProfileRef.current?.id || activeProfile?.id;
      await Promise.all([loadJobs(currentResumeId), loadStats(currentResumeId)]);
    } finally {
      setIsScanning(false);
    }
  }, [activeProfile]);

  const handleStatusChange = async (matchId: string, newStatus: JobMatch["status"]) => {
    // Optimistic update
    setMatches((prev) =>
      prev.map((m) => (m.match_id === matchId ? { ...m, status: newStatus } : m))
    );

    try {
      await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      loadStats();
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleUpdateDetails = async (
    matchId: string,
    payload: { notes?: string; interview_date?: string; salary_offered?: string }
  ) => {
    setMatches((prev) =>
      prev.map((m) => (m.match_id === matchId ? { ...m, ...payload } : m))
    );

    try {
      await fetch(`/api/matches/${matchId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      loadStats();
    } catch (err) {
      console.error("Update details error:", err);
    }
  };

  const handleSaveConfig = async (updated: Partial<AlertConfig>) => {
    try {
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          setStats((prev) => prev ? { ...prev, alert_config: data.config } : prev);
        }
      }
    } catch (err) {
      console.error("Config save error:", err);
    }
  };

  const handleSwitchProfile = async (profile: ResumeProfile) => {
    setActiveProfile(profile);
    setIsScanning(true);
    try {
      // First try activating existing profile in database
      const res = await fetch(`/api/resumes/${profile.id}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) {
        // If not present in DB, save and activate it
        await fetch("/api/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...profile, is_active: 1 })
        });
      }
      await Promise.all([loadJobs(profile.id), loadStats(profile.id), loadResumes()]);
    } catch (err) {
      console.error("Profile switch scan error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveProfile = async (profile: ResumeProfile) => {
    setActiveProfile(profile);
    setIsScanning(true);
    try {
      await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...profile, is_active: 1 })
      });
      await Promise.all([loadJobs(profile.id), loadStats(profile.id), loadResumes()]);
    } catch (err) {
      console.error("Profile save error:", err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSendTestNotification = () => {
    const top = matches[0];
    setToastAlert({
      id: `toast-${Date.now()}`,
      title: top ? top.title : "QA Automation Lead (Healthcare Domain)",
      company: top ? top.company : "Apollo Health Tech",
      location: top ? top.location : "Pune, India",
      score: top ? top.total_score : 92,
      match: top
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Header */}
      <Header
        activeProfile={activeProfile}
        savedProfiles={savedProfiles}
        alertConfig={stats?.alert_config}
        isScanning={isScanning}
        onScanNow={handleScanNow}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onOpenResumeManager={() => setResumeModalOpen(true)}
        onSwitchProfile={handleSwitchProfile}
        onSendTestNotification={handleSendTestNotification}
      />

      {/* Connection Warning Banner */}
      {connectionWarning && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs text-amber-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span>{connectionWarning}</span>
          </div>
          <button
            onClick={loadAll}
            className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded text-[11px] font-semibold transition cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Main Workspace: Sidebar + Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          applicationCount={
            (stats?.status_breakdown?.Applied || 0) +
            (stats?.status_breakdown?.Interview || 0) +
            (stats?.status_breakdown?.Offer || 0)
          }
          matchedCount={stats?.matched_jobs || matches.length}
        />

        {/* Dynamic Workspace Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* Top Metric Stats Bar */}
          <StatsBar
            stats={stats}
            onOpenTelegramSettings={() => setSettingsModalOpen(true)}
            onFilterTopMatches={() => setFilters((prev) => ({ ...prev, min_score: 85 }))}
          />

          {/* Tab 1: Matches Feed */}
          {activeTab === "matches" && (
            <MatchesFeed
              matches={filteredMatches}
              filters={filters}
              isLoading={isLoading}
              activeProfile={activeProfile}
              onOpenResumeManager={() => setResumeModalOpen(true)}
              onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
              onResetFilters={() =>
                setFilters({
                  city: "all",
                  country: "all",
                  status: "all",
                  min_score: 0,
                  search: "",
                  sort: "score_desc"
                })
              }
              onStatusChange={handleStatusChange}
              onOpenAnalyzer={setAnalyzingMatch}
              onOpenCoverLetter={setCoverLetterMatch}
              onOpenInterviewPrep={setInterviewMatch}
              onOpenSalary={setSalaryMatch}
              onOpenCompany={setCompanyMatch}
              onOpenTailor={setTailorMatch}
            />
          )}

          {/* Tab 2: Application Kanban Tracker */}
          {activeTab === "kanban" && (
            <KanbanBoard
              matches={matches}
              onStatusChange={handleStatusChange}
              onUpdateDetails={handleUpdateDetails}
              onOpenAnalyzer={setAnalyzingMatch}
            />
          )}

          {/* Tab 3: Resume vs. JD Analyzer Dedicated View */}
          {activeTab === "analyzer" && (
            <div className="space-y-4">
              <div className="bg-slate-850 border border-slate-800 rounded-2xl p-5">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Resume vs. Job Description Matching Hub
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Select any discovered job to view a full side-by-side TF-IDF score breakdown, matched keywords, and gap suggestions.
                </p>
              </div>

              <MatchesFeed
                matches={filteredMatches}
                filters={filters}
                isLoading={isLoading}
                onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
                onResetFilters={() =>
                  setFilters({
                    city: "all",
                    country: "all",
                    status: "all",
                    min_score: 0,
                    search: "",
                    sort: "score_desc"
                  })
                }
                onStatusChange={handleStatusChange}
                onOpenAnalyzer={setAnalyzingMatch}
                onOpenCoverLetter={setCoverLetterMatch}
                onOpenInterviewPrep={setInterviewMatch}
                onOpenSalary={setSalaryMatch}
                onOpenCompany={setCompanyMatch}
                onOpenTailor={setTailorMatch}
              />
            </div>
          )}

          {/* Tab 4: 24/7 Agent Logs */}
          {activeTab === "logs" && (
            <AgentScannerLogs
              logs={stats?.recent_scans || []}
              isScanning={isScanning}
              onTriggerScan={handleScanNow}
            />
          )}

          {/* Tab 5: Resume & Skills Manager View */}
          {activeTab === "resume" && (
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white">Active Candidate Resume Profile</h2>
                  <p className="text-xs text-slate-400">
                    Profile used for TF-IDF calculations, skill bonus points, and instant alerts.
                  </p>
                </div>
                <button
                  onClick={() => setResumeModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow"
                >
                  Switch / Upload New Resume
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Candidate Name</span>
                  <p className="text-base font-bold text-white">{activeProfile.name}</p>
                  <p className="text-xs text-indigo-400 font-medium">{activeProfile.target_title}</p>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Domain & Experience</span>
                  <p className="text-base font-bold text-emerald-400 capitalize">{activeProfile.domain || "Healthcare"}</p>
                  <p className="text-xs text-slate-300">{activeProfile.years_experience || 4} Years Experience</p>
                </div>

                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-1">
                  <span className="text-xs text-slate-400">Target Locations</span>
                  <p className="text-base font-bold text-slate-200">Pune, India + Global</p>
                  <p className="text-xs text-slate-400">Pan-India & International</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Core Skills & Keywords ({Array.from(new Set(activeProfile.skills || [])).length}):
                </span>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(activeProfile.skills || [])).map((s, idx) => (
                    <span
                      key={`profile-skill-${s}-${idx}`}
                      className="px-2.5 py-1 rounded-lg bg-indigo-950/40 text-indigo-300 border border-indigo-500/30 text-xs font-semibold"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Telegram & Alert Settings */}
          {activeTab === "settings" && (
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Alert Settings & Dispatch Configuration</h2>
              <p className="text-xs text-slate-400">
                Configure your Telegram bot token, chat ID, and notification thresholds.
              </p>
              <button
                onClick={() => setSettingsModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow"
              >
                Open Alerts Configuration Modal
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modals & Dialogs */}
      {analyzingMatch && (
        <JDAnalyzerModal
          match={analyzingMatch}
          onClose={() => setAnalyzingMatch(null)}
          onOpenCoverLetter={(m) => {
            setAnalyzingMatch(null);
            setCoverLetterMatch(m);
          }}
          onOpenTailor={(m) => {
            setAnalyzingMatch(null);
            setTailorMatch(m);
          }}
        />
      )}

      {coverLetterMatch && (
        <CoverLetterModal
          match={coverLetterMatch}
          profile={activeProfile}
          onClose={() => setCoverLetterMatch(null)}
        />
      )}

      {interviewMatch && (
        <InterviewPrepModal
          match={interviewMatch}
          profile={activeProfile}
          onClose={() => setInterviewMatch(null)}
        />
      )}

      {salaryMatch && (
        <SalaryEstimatorModal
          match={salaryMatch}
          profile={activeProfile}
          onClose={() => setSalaryMatch(null)}
        />
      )}

      {companyMatch && (
        <CompanyIntelModal
          match={companyMatch}
          onClose={() => setCompanyMatch(null)}
        />
      )}

      {tailorMatch && (
        <ResumeTailorModal
          match={tailorMatch}
          profile={activeProfile}
          onClose={() => setTailorMatch(null)}
        />
      )}

      {resumeModalOpen && (
        <ResumeManagerModal
          activeProfile={activeProfile}
          onSelectProfile={handleSwitchProfile}
          onSaveProfile={handleSaveProfile}
          onClose={() => setResumeModalOpen(false)}
        />
      )}

      {settingsModalOpen && (
        <AlertSettingsModal
          config={stats?.alert_config || null}
          onSaveConfig={handleSaveConfig}
          onTestInAppNotification={handleSendTestNotification}
          onClose={() => setSettingsModalOpen(false)}
        />
      )}

      {/* Desktop Windows Toast Popup */}
      <ToastAlert
        alert={toastAlert}
        onClose={() => setToastAlert(null)}
        onViewMatch={(match) => setAnalyzingMatch(match)}
      />
    </div>
  );
}
