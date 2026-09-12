import React, { useState, useCallback } from 'react';
import { JobMatch, ResumeProfile } from './types';
import { Header } from './components/Header';
import { Sidebar, ActiveTab } from './components/Sidebar';
import { StatsBar } from './components/StatsBar';
import { MatchesFeed } from './components/MatchesFeed';
import { KanbanBoard } from './components/KanbanBoard';
import { JDAnalyzerModal } from './components/JDAnalyzerModal';
import { CoverLetterModal } from './components/CoverLetterModal';
import { InterviewPrepModal } from './components/InterviewPrepModal';
import { SalaryEstimatorModal } from './components/SalaryEstimatorModal';
import { CompanyIntelModal } from './components/CompanyIntelModal';
import { ResumeTailorModal } from './components/ResumeTailorModal';
import { ResumeManagerModal } from './components/ResumeManagerModal';
import { AlertSettingsModal } from './components/AlertSettingsModal';
import { AgentScannerLogs } from './components/AgentScannerLogs';
import { ToastAlert, ToastAlertData } from './components/ToastAlert';
import { useJobMatches } from './hooks/useJobMatches';
import { useModalState } from './hooks/useModalState';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('matches');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [toastAlert, setToastAlert] = useState<ToastAlertData | null>(null);

  const handleToast = useCallback((alert: ToastAlertData) => {
    setToastAlert(alert);
  }, []);

  const {
    matches,
    stats,
    activeProfile,
    savedProfiles,
    filters,
    filteredMatches,
    isScanning,
    isLoading,
    connectionWarning,
    setFilters,
    loadAll,
    handleScanNow,
    handleStatusChange,
    handleUpdateDetails,
    handleSaveConfig,
    handleSwitchProfile,
    handleSaveProfile,
  } = useJobMatches(handleToast);

  const { isOpen, activeJob, openModal, closeModal } = useModalState();

  const handleSendTestNotification = () => {
    const top = matches[0];
    setToastAlert({
      id: `toast-${Date.now()}`,
      title: top ? top.title : 'QA Automation Lead (Healthcare Domain)',
      company: top ? top.company : 'Apollo Health Tech',
      location: top ? top.location : 'Pune, India',
      score: top ? top.total_score : 92,
      match: top,
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar */}
      <Header
        activeProfile={activeProfile}
        savedProfiles={savedProfiles}
        alertConfig={stats?.alert_config}
        isScanning={isScanning}
        onScanNow={handleScanNow}
        onOpenSettings={() => openModal('alert')}
        onOpenResumeManager={() => openModal('resume')}
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

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
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

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          <StatsBar
            stats={stats}
            onOpenTelegramSettings={() => openModal('alert')}
            onFilterTopMatches={() => setFilters((prev) => ({ ...prev, min_score: 85 }))}
          />

          {/* Matches Feed */}
          {activeTab === 'matches' && (
            <MatchesFeed
              matches={filteredMatches}
              filters={filters}
              isLoading={isLoading}
              activeProfile={activeProfile}
              onOpenResumeManager={() => openModal('resume')}
              onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
              onResetFilters={() =>
                setFilters({
                  city: 'all',
                  country: 'all',
                  status: 'all',
                  min_score: 0,
                  search: '',
                  sort: 'score_desc',
                })
              }
              onStatusChange={handleStatusChange}
              onOpenAnalyzer={(m) => openModal('jd_analyzer', m)}
              onOpenCoverLetter={(m) => openModal('cover_letter', m)}
              onOpenInterviewPrep={(m) => openModal('interview_prep', m)}
              onOpenSalary={(m) => openModal('salary', m)}
              onOpenCompany={(m) => openModal('intel', m)}
              onOpenTailor={(m) => openModal('tailor', m)}
            />
          )}

          {/* Application Tracker (Kanban) */}
          {activeTab === 'kanban' && (
            <KanbanBoard
              matches={matches}
              onStatusChange={handleStatusChange}
              onUpdateDetails={handleUpdateDetails}
              onOpenAnalyzer={(m) => openModal('jd_analyzer', m)}
            />
          )}

          {/* Dedicated Resume vs. JD Analyzer View */}
          {activeTab === 'analyzer' && (
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
                    city: 'all',
                    country: 'all',
                    status: 'all',
                    min_score: 0,
                    search: '',
                    sort: 'score_desc',
                  })
                }
                onStatusChange={handleStatusChange}
                onOpenAnalyzer={(m) => openModal('jd_analyzer', m)}
                onOpenCoverLetter={(m) => openModal('cover_letter', m)}
                onOpenInterviewPrep={(m) => openModal('interview_prep', m)}
                onOpenSalary={(m) => openModal('salary', m)}
                onOpenCompany={(m) => openModal('intel', m)}
                onOpenTailor={(m) => openModal('tailor', m)}
              />
            </div>
          )}

          {/* 24/7 Agent Logs */}
          {activeTab === 'logs' && (
            <AgentScannerLogs
              logs={stats?.recent_scans || []}
              isScanning={isScanning}
              onTriggerScan={handleScanNow}
            />
          )}

          {/* Active Profile Info */}
          {activeTab === 'resume' && (
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white">Active Candidate Resume Profile</h2>
                  <p className="text-xs text-slate-400">
                    Profile used for TF-IDF calculations, skill bonus points, and instant alerts.
                  </p>
                </div>
                <button
                  onClick={() => openModal('resume')}
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
                  <p className="text-base font-bold text-emerald-400 capitalize">{activeProfile.domain || 'Healthcare'}</p>
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

          {/* Alert Settings */}
          {activeTab === 'settings' && (
            <div className="bg-slate-850 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white">Alert Settings & Dispatch Configuration</h2>
              <p className="text-xs text-slate-400">
                Configure your Telegram bot token, chat ID, and notification thresholds.
              </p>
              <button
                onClick={() => openModal('alert')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow cursor-pointer"
              >
                Open Alerts Configuration Modal
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modals & Dialogs */}
      {isOpen('jd_analyzer') && activeJob && (
        <JDAnalyzerModal
          match={activeJob}
          onClose={closeModal}
          onOpenCoverLetter={(m) => openModal('cover_letter', m)}
          onOpenTailor={(m) => openModal('tailor', m)}
        />
      )}

      {isOpen('cover_letter') && activeJob && (
        <CoverLetterModal
          match={activeJob}
          profile={activeProfile}
          onClose={closeModal}
        />
      )}

      {isOpen('interview_prep') && activeJob && (
        <InterviewPrepModal
          match={activeJob}
          profile={activeProfile}
          onClose={closeModal}
        />
      )}

      {isOpen('salary') && activeJob && (
        <SalaryEstimatorModal
          match={activeJob}
          profile={activeProfile}
          onClose={closeModal}
        />
      )}

      {isOpen('intel') && activeJob && (
        <CompanyIntelModal
          match={activeJob}
          onClose={closeModal}
        />
      )}

      {isOpen('tailor') && activeJob && (
        <ResumeTailorModal
          match={activeJob}
          profile={activeProfile}
          onClose={closeModal}
        />
      )}

      {isOpen('resume') && (
        <ResumeManagerModal
          activeProfile={activeProfile}
          onSelectProfile={handleSwitchProfile}
          onSaveProfile={handleSaveProfile}
          onClose={closeModal}
        />
      )}

      {isOpen('alert') && (
        <AlertSettingsModal
          config={stats?.alert_config || null}
          onSaveConfig={handleSaveConfig}
          onTestInAppNotification={handleSendTestNotification}
          onClose={closeModal}
        />
      )}

      {/* Desktop Toast Notification */}
      <ToastAlert
        alert={toastAlert}
        onClose={() => setToastAlert(null)}
        onViewMatch={(match) => openModal('jd_analyzer', match)}
      />
    </div>
  );
}
