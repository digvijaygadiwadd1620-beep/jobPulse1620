import React from 'react';
import { Sliders, Clock, Bell } from 'lucide-react';

interface ScannerThresholdSectionProps {
  minScore: number;
  interval: number;
  autoScan: boolean;
  desktopNotif: boolean;
  onChangeMinScore: (score: number) => void;
  onChangeInterval: (minutes: number) => void;
  onChangeAutoScan: (enabled: boolean) => void;
  onChangeDesktopNotif: (enabled: boolean) => void;
}

export const ScannerThresholdSection: React.FC<ScannerThresholdSectionProps> = ({
  minScore,
  interval,
  autoScan,
  desktopNotif,
  onChangeMinScore,
  onChangeInterval,
  onChangeAutoScan,
  onChangeDesktopNotif,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          Autonomous Scanner & Notification Filters
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Define minimum TF-IDF match thresholds and background polling intervals.
        </p>
      </div>

      <div className="space-y-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        {/* Min Score Slider */}
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-slate-300">Minimum Match Score for Alerts</span>
            <span className="font-bold text-indigo-400">{minScore}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="95"
            step="5"
            value={minScore}
            onChange={(e) => onChangeMinScore(Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer"
          />
          <div className="flex justify-between text-[11px] text-slate-500 mt-1">
            <span>50% (Broad)</span>
            <span>80% (Recommended)</span>
            <span>95% (Strict Top Matches)</span>
          </div>
        </div>

        {/* Scan Interval */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Background Scanner Interval
          </label>
          <select
            value={interval}
            onChange={(e) => onChangeInterval(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value={1}>Every 1 minute (Aggressive Live Polling)</option>
            <option value={5}>Every 5 minutes (Recommended)</option>
            <option value={15}>Every 15 minutes</option>
            <option value={30}>Every 30 minutes</option>
            <option value={60}>Hourly</option>
          </select>
        </div>

        {/* Checkbox Toggles */}
        <div className="pt-2 space-y-2 border-t border-slate-800">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoScan}
              onChange={(e) => onChangeAutoScan(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Enable 24/7 Autonomous Scanner Daemon</span>
              <span className="text-[11px] text-slate-400 block">Automatically scans for new job postings using your active profile</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={desktopNotif}
              onChange={(e) => onChangeDesktopNotif(e.target.checked)}
              className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
            />
            <div>
              <span className="text-xs font-semibold text-slate-200 block">Enable Desktop / In-App Match Banners</span>
              <span className="text-[11px] text-slate-400 block">Display instant desktop notifications when high-scoring matches arrive</span>
            </div>
          </label>
        </div>
      </div>
    </div>
  );
};
