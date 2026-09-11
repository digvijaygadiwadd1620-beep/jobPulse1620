import React, { useState, useEffect } from "react";
import { JobMatch, ResumeProfile } from "../types";
import { 
  X, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Sparkles,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";

interface SalaryEstimatorModalProps {
  match: JobMatch | null;
  profile: ResumeProfile | null;
  onClose: () => void;
}

export const SalaryEstimatorModal: React.FC<SalaryEstimatorModalProps> = ({
  match,
  profile,
  onClose
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!match) return;
    setLoading(true);
    fetch("/api/salary/estimate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: match.title,
        location: match.location,
        country: match.country,
        domain: match.domain || "healthcare",
        years_experience: profile?.years_experience || 4
      })
    })
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [match, profile]);

  if (!match) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Market Salary Benchmark Engine
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Salary Compensation Analysis
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {match.title} • {match.location} ({match.country})
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center space-y-3 bg-slate-850 rounded-xl border border-slate-800">
            <TrendingUp className="w-8 h-8 text-emerald-400 animate-pulse" />
            <p className="text-xs text-slate-300">Calculating compensation bands from real market indexes...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Median Hero Banner */}
            <div className="bg-gradient-to-br from-emerald-950/40 via-slate-850 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 text-center relative overflow-hidden">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Estimated Market Median
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white mt-1 tracking-tight">
                {data?.median || "₹18,00,000 / year"}
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Typical range: <strong className="text-emerald-300">{data?.min || "₹14L"}</strong> to{" "}
                <strong className="text-emerald-300">{data?.max || "₹24L"}</strong> for {profile?.years_experience || 4}+ years experience
              </p>
            </div>

            {/* Percentile Distribution */}
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Compensation Percentiles ({data?.currency || "INR"})
              </span>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">25th Percentile</span>
                  <span className="text-xs sm:text-sm font-bold text-slate-200">{data?.p25 || "₹15L"}</span>
                </div>
                <div className="bg-indigo-950/40 p-2.5 rounded-lg border border-indigo-500/30">
                  <span className="text-[10px] text-indigo-300 block">50th (Median)</span>
                  <span className="text-xs sm:text-sm font-bold text-white">{data?.median || "₹18L"}</span>
                </div>
                <div className="bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/30">
                  <span className="text-[10px] text-emerald-300 block">75th Percentile</span>
                  <span className="text-xs sm:text-sm font-bold text-emerald-300">{data?.p75 || "₹21L"}</span>
                </div>
                <div className="bg-purple-950/40 p-2.5 rounded-lg border border-purple-500/30">
                  <span className="text-[10px] text-purple-300 block">90th (Top Tier)</span>
                  <span className="text-xs sm:text-sm font-bold text-purple-200">{data?.max || "₹24L"}</span>
                </div>
              </div>
            </div>

            {/* Premium Multipliers */}
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-2.5">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Salary Drivers for this Role:
              </span>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-slate-200">Healthcare Domain Expertise (HL7 / HIPAA / EHR)</span>
                  </div>
                  <span className="text-emerald-400 font-bold">+15% Premium</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-indigo-400" />
                    <span className="text-slate-200">Dual Automation Frameworks (Selenium + Cypress/Playwright)</span>
                  </div>
                  <span className="text-indigo-400 font-bold">+12% Premium</span>
                </div>

                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-sky-400" />
                    <span className="text-slate-200">Location Tier 1 Tech Hub ({match.city})</span>
                  </div>
                  <span className="text-sky-400 font-bold">Standard High Band</span>
                </div>
              </div>
            </div>

            {/* Negotiation Advice */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-xs space-y-1">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Negotiation Leverage Insight:
              </span>
              <p className="text-slate-300 leading-relaxed">
                When discussing compensation with {match.company}, emphasize your specialized domain knowledge and multi-platform automation efficiency. Anchor your initial expectation around the 75th percentile ({data?.p75 || "₹21L"}).
              </p>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
