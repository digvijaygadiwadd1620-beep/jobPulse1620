import React, { useState, useEffect } from "react";
import { 
  Radio, 
  RefreshCw, 
  Send, 
  Bell, 
  FileText, 
  Settings, 
  CheckCircle2, 
  Sparkles,
  ChevronDown
} from "lucide-react";
import { ResumeProfile, AlertConfig } from "../types";
import { SAMPLE_PROFILES } from "../data/sampleProfiles";

interface HeaderProps {
  activeProfile: ResumeProfile | null;
  savedProfiles?: ResumeProfile[];
  alertConfig?: AlertConfig;
  isScanning: boolean;
  onScanNow: () => void;
  onOpenSettings: () => void;
  onOpenResumeManager: () => void;
  onSwitchProfile: (profile: ResumeProfile) => void;
  onSendTestNotification: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeProfile,
  savedProfiles = [],
  alertConfig,
  isScanning,
  onScanNow,
  onOpenSettings,
  onOpenResumeManager,
  onSwitchProfile,
  onSendTestNotification
}) => {
  const intervalSecs = (alertConfig?.scan_interval_minutes || 5) * 60;
  const autoScanActive = alertConfig?.auto_scan_enabled !== 0;
  const [countdown, setCountdown] = useState<number>(intervalSecs);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const onScanNowRef = React.useRef(onScanNow);
  const countdownRef = React.useRef(intervalSecs);

  useEffect(() => {
    onScanNowRef.current = onScanNow;
  }, [onScanNow]);

  useEffect(() => {
    countdownRef.current = intervalSecs;
    setCountdown(intervalSecs);
  }, [intervalSecs]);

  useEffect(() => {
    if (!autoScanActive) return;

    const timer = setInterval(() => {
      if (countdownRef.current <= 1) {
        countdownRef.current = intervalSecs;
        setCountdown(intervalSecs);
        // Call parent scan outside of any React render/state updater phase
        onScanNowRef.current();
      } else {
        countdownRef.current -= 1;
        setCountdown(countdownRef.current);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [autoScanActive, intervalSecs]);

  const handleManualScan = () => {
    countdownRef.current = intervalSecs;
    setCountdown(intervalSecs);
    onScanNow();
  };

  const formatCountdown = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Live Pulse */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 shadow-md shadow-indigo-500/20 text-white font-bold">
              <Radio className="w-5 h-5 text-white animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                  JobPulse
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    24/7 Agent
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${autoScanActive ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
                Autonomous Match Engine • {autoScanActive ? `Next auto-scan in ${formatCountdown(countdown)}` : "Auto-scan Paused"}
              </p>
            </div>
          </div>

          {/* Mobile scan button */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={handleManualScan}
              disabled={isScanning}
              className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60 transition"
              title="Scan Now"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* Center/Right Actions: Profile Switcher, Scan Button, Alerts */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
          {/* Active Profile Pill / Dropdown */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs font-medium text-slate-200 transition"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <div className="text-left max-w-[170px] truncate">
                <span className="text-slate-400 text-[10px] block leading-none">Active Profile</span>
                <span className="font-semibold text-slate-100 truncate block">
                  {activeProfile ? activeProfile.name : "Select Resume"}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-slate-850 rounded-xl shadow-2xl border border-slate-700 py-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 border-b border-slate-750 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Switch Resume Profile
                </div>
                {(savedProfiles && savedProfiles.length > 0 ? savedProfiles : SAMPLE_PROFILES).map((prof, idx) => (
                  <button
                    key={`${prof.id}-${idx}`}
                    onClick={() => {
                      onSwitchProfile(prof);
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs hover:bg-slate-750 flex items-start justify-between gap-2 ${
                      (activeProfile?.id === prof.id || activeProfile?.name === prof.name) ? "bg-indigo-950/40 text-indigo-300" : "text-slate-300"
                    }`}
                  >
                    <div>
                      <p className="font-medium text-slate-100">{prof.name}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{prof.target_title}</p>
                    </div>
                    {(activeProfile?.id === prof.id || activeProfile?.name === prof.name) && (
                      <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    )}
                  </button>
                ))}
                <div className="p-2 border-t border-slate-750 mt-1">
                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      onOpenResumeManager();
                    }}
                    className="w-full text-center py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center justify-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Upload / Parse Custom PDF Resume
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Manual Trigger "Scan Now" */}
          <button
            onClick={handleManualScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-medium text-xs shadow-md shadow-indigo-600/25 disabled:opacity-60 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? "animate-spin" : ""}`} />
            <span>{isScanning ? "Scanning 100+ Boards..." : "Scan Now"}</span>
          </button>

          {/* Test Toast Alert */}
          <button
            onClick={onSendTestNotification}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300 transition"
            title="Trigger Instant Windows/Browser Toast Alert"
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Toast Alert</span>
          </button>

          {/* Telegram Alert Status Indicator / Test */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-xs text-slate-300 transition"
            title="Configure Telegram Bot & Notifications"
          >
            <Send className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Telegram</span>
            <span className={`w-2 h-2 rounded-full ${alertConfig?.telegram_chat_id ? "bg-emerald-400" : "bg-slate-500"}`}></span>
          </button>

          {/* Settings Modal Button */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-300 transition"
            title="Settings & Notification Thresholds"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
