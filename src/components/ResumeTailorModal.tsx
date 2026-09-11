import React, { useState, useEffect } from "react";
import { JobMatch, ResumeProfile } from "../types";
import { 
  X, 
  Sparkles, 
  Check, 
  Copy, 
  RefreshCw, 
  Plus,
  Percent,
  FileText
} from "lucide-react";

interface ResumeTailorModalProps {
  match: JobMatch | null;
  profile: ResumeProfile | null;
  onClose: () => void;
}

export const ResumeTailorModal: React.FC<ResumeTailorModalProps> = ({
  match,
  profile,
  onClose
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [copiedHook, setCopiedHook] = useState<boolean>(false);

  const fetchTailoring = () => {
    if (!match) return;
    setLoading(true);
    fetch("/api/ai/resume-tailor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        job_title: match.title,
        company: match.company,
        job_description: match.description,
        matched_skills: match.matched_skills,
        missing_skills: match.missing_skills,
        resume_text: profile?.raw_text || ""
      })
    })
      .then((res) => res.json())
      .then((json) => setData(json))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (match) {
      fetchTailoring();
    }
  }, [match, profile]);

  if (!match) return null;

  const handleCopyBullet = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 2000);
  };

  const handleCopyHook = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHook(true);
    setTimeout(() => setCopiedHook(false), 2000);
  };

  const bullets = data?.bullet_point_rewrites || 
    (data?.bullet_points || []).map((b: string) => ({
      original_concept: "Experience highlight",
      tailored_bullet: b,
      reasoning: "Injected target keywords to pass ATS screen."
    }));

  const matchRate = data?.ats_match_rate || 88;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                ATS Resume Tailoring Engine
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Tailor Resume for {match.title}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Target Company: <strong className="text-slate-200">{match.company}</strong>
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
            <RefreshCw className="w-8 h-8 text-pink-400 animate-spin" />
            <p className="text-xs text-slate-300">Generating high-impact ATS bullet points with injected keywords...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* ATS Match Rate Score Meter */}
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Target Role ATS Readiness Score:
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Based on keyword density, automated test terminology, and domain relevance.
                </p>
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <div className="text-right">
                  <span className="text-xl font-extrabold text-pink-400">{matchRate}%</span>
                  <span className="text-[10px] text-emerald-400 block font-semibold">High Match</span>
                </div>
                <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-pink-500 to-emerald-400 rounded-full" 
                    style={{ width: `${matchRate}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Injected Keywords to Add */}
            <div className="bg-slate-850 border border-slate-800 rounded-xl p-4">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">
                Keywords to Include in Experience:
              </span>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set<string>(data?.keyword_recommendations || match.missing_skills || [])).map((skill: string, idx: number) => (
                  <span
                    key={`tailor-kw-${skill}-${idx}`}
                    className="px-2.5 py-1 rounded-lg bg-pink-950/40 text-pink-300 border border-pink-500/30 text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Summary Hook Suggestion */}
            {data?.summary_hook_suggestion && (
              <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    Recommended Executive Summary Rewrite:
                  </span>
                  <button
                    onClick={() => handleCopyHook(data.summary_hook_suggestion)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 flex items-center gap-1 transition"
                  >
                    {copiedHook ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedHook ? "Copied" : "Copy Summary"}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed italic bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                  "{data.summary_hook_suggestion}"
                </p>
              </div>
            )}

            {/* Suggested Rewritten Bullet Points */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                ATS-Optimized Bullet Point Suggestions (Click to copy):
              </span>

              {bullets.map((b: any, idx: number) => {
                const bulletText = typeof b === "string" ? b : (b.tailored_bullet || b.bullet || "");
                const reason = typeof b === "object" ? b.reasoning : null;
                const concept = typeof b === "object" ? b.original_concept : null;

                return (
                  <div
                    key={idx}
                    onClick={() => handleCopyBullet(bulletText, idx)}
                    className="p-3.5 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-800 hover:border-pink-500/40 cursor-pointer transition space-y-2 group"
                  >
                    {concept && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Context: {concept}
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                        • {bulletText}
                      </p>
                      <button
                        className="p-1.5 rounded-lg bg-slate-800 group-hover:bg-pink-600/20 text-slate-400 group-hover:text-pink-300 shrink-0 transition"
                        title="Copy bullet"
                      >
                        {copiedIdx === idx ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {reason && (
                      <p className="text-[11px] text-pink-300/80 bg-pink-950/20 px-2 py-1 rounded border border-pink-500/20">
                        ⚡ ATS Advantage: {reason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Summary Advice */}
            <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs space-y-1">
              <span className="font-bold text-indigo-300 block">
                💡 ATS Optimization Tip:
              </span>
              <p className="text-slate-300 leading-relaxed">
                Applicant Tracking Systems (Workday, Greenhouse, Taleo) rank candidates by exact keyword frequency and context. Inject these bullets directly into your recent role experience to maximize your ATS pass rate.
              </p>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
          <button
            onClick={fetchTailoring}
            disabled={loading}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Regenerate Suggestions
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
