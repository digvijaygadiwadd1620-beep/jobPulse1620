import React from "react";
import { ScanLog } from "../types";
import { 
  Terminal, 
  RefreshCw, 
  CheckCircle2, 
  Send, 
  Bell, 
  Globe, 
  Clock,
  Sparkles,
  ShieldCheck
} from "lucide-react";

interface AgentScannerLogsProps {
  logs: ScanLog[];
  isScanning: boolean;
  onTriggerScan: () => void;
}

export const AgentScannerLogs: React.FC<AgentScannerLogsProps> = ({
  logs,
  isScanning,
  onTriggerScan
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Autonomous Daemon Running
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">
            24/7 Background Agent Activity & Logs
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuously polling JobsPipe, Adzuna, LinkedIn, Indeed across India and global tech hubs.
          </p>
        </div>

        <button
          onClick={onTriggerScan}
          disabled={isScanning}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 disabled:opacity-50 transition shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? "animate-spin" : ""}`} />
          <span>{isScanning ? "Executing Pipeline..." : "Force Immediate Scan"}</span>
        </button>
      </div>

      {/* Terminal Live Stream Box */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 shadow-inner">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-semibold text-white">agent_worker.py - Standard Output</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Process ID: 4920</span>
          </div>
        </div>

        <div className="space-y-1.5 text-[11px] leading-relaxed max-h-56 overflow-y-auto">
          <p className="text-slate-400">
            [2026-09-07 15:45:00] <span className="text-sky-400">[INFO]</span> JobPulse background worker initialized.
          </p>
          <p className="text-slate-400">
            [2026-09-07 15:45:01] <span className="text-emerald-400">[DB]</span> SQLite database connected. Dedup cache initialized.
          </p>
          <p className="text-slate-400">
            [2026-09-07 15:45:02] <span className="text-indigo-400">[PARSER]</span> Active profile loaded: Digvijay Gadiwadd (QA Test Engineer, Healthcare).
          </p>
          <p className="text-slate-400">
            [2026-09-07 15:45:03] <span className="text-sky-400">[AGGREGATOR]</span> Querying JobsPipe (LinkedIn, Indeed, Naukri) & Adzuna for Pune, Bangalore, Hyderabad, USA, Remote...
          </p>
          <p className="text-slate-400">
            [2026-09-07 15:45:04] <span className="text-emerald-400">[SCORER]</span> Running TF-IDF vectorizer + domain keyword boosting.
          </p>
          <p className="text-slate-300 font-semibold">
            [2026-09-07 15:45:05] <span className="text-amber-400">[MATCH]</span> Found top candidate: "Senior QA Automation Engineer - Healthcare Systems" @ GlobalLogic (Score: 94/100).
          </p>
          <p className="text-emerald-400 font-semibold">
            [2026-09-07 15:45:06] <span className="text-sky-400">[ALERT]</span> Windows Toast popup triggered. Telegram notification dispatched to chat.
          </p>
          {isScanning && (
            <p className="text-indigo-400 animate-pulse font-semibold">
              [LIVE] ➔ Fetching live feeds and scoring against active resume profile...
            </p>
          )}
        </div>
      </div>

      {/* Historical Scan Logs Table */}
      <div className="bg-slate-850 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          Recent Automated Scan Cycles
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-semibold uppercase">
                <th className="pb-2.5">Time</th>
                <th className="pb-2.5">Jobs Found</th>
                <th className="pb-2.5">Matches (≥60%)</th>
                <th className="pb-2.5">Top Match Score</th>
                <th className="pb-2.5">Top Matched Role</th>
                <th className="pb-2.5 text-right">Alert Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((l) => (
                <tr key={l.id} className="text-slate-200 hover:bg-slate-800/40 transition">
                  <td className="py-3 font-mono text-slate-400 text-[11px]">{l.timestamp}</td>
                  <td className="py-3 font-medium">{l.jobs_found} jobs</td>
                  <td className="py-3 font-bold text-indigo-300">{l.jobs_matched}</td>
                  <td className="py-3">
                    <span className="font-extrabold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-500/30">
                      {l.top_score}/100
                    </span>
                  </td>
                  <td className="py-3 font-medium max-w-xs truncate">{l.top_role}</td>
                  <td className="py-3 text-right">
                    {l.alert_sent ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        <Send className="w-3 h-3" />
                        Dispatched
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-500">Logged</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
