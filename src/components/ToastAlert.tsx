import React, { useEffect } from "react";
import { JobMatch } from "../types";
import { 
  Bell, 
  X, 
  ExternalLink, 
  Building2, 
  Sparkles, 
  ArrowRight 
} from "lucide-react";

export interface ToastAlertData {
  id: string;
  title: string;
  company: string;
  location: string;
  score: number;
  match?: JobMatch;
}

interface ToastAlertProps {
  alert: ToastAlertData | null;
  onClose: () => void;
  onViewMatch: (match: JobMatch) => void;
}

export const ToastAlert: React.FC<ToastAlertProps> = ({
  alert,
  onClose,
  onViewMatch
}) => {
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        onClose();
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  if (!alert) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-slate-900/95 backdrop-blur-md border border-indigo-500/50 rounded-2xl p-4 shadow-2xl text-white animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-600/30">
            <Bell className="w-5 h-5 text-white animate-bounce" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {alert.score}/100 Match
              </span>
              <span className="text-slate-400 text-[11px]">Windows Toast</span>
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-white mt-1 truncate">
              {alert.title}
            </h4>
            <div className="flex items-center gap-1 text-[11px] text-slate-300 mt-0.5">
              <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
              <span className="truncate">{alert.company} • {alert.location}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[10px] text-slate-400">
          JobPulse Instant Notification
        </span>

        {alert.match && (
          <button
            onClick={() => {
              onViewMatch(alert.match!);
              onClose();
            }}
            className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition"
          >
            <span>Inspect Match</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
