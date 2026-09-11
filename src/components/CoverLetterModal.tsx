import React, { useState, useEffect } from "react";
import { JobMatch, ResumeProfile } from "../types";
import { 
  X, 
  Sparkles, 
  Copy, 
  Check, 
  Download, 
  FileText, 
  RefreshCw,
  Building2
} from "lucide-react";

interface CoverLetterModalProps {
  match: JobMatch | null;
  profile: ResumeProfile | null;
  onClose: () => void;
}

export const CoverLetterModal: React.FC<CoverLetterModalProps> = ({
  match,
  profile,
  onClose
}) => {
  const [tone, setTone] = useState<string>("Professional & Results-Driven");
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const generateCoverLetter = async (selectedTone = tone) => {
    if (!match) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          job_title: match.title,
          company: match.company,
          location: match.location,
          job_description: match.description,
          resume_name: profile?.name || "Digvijay Gadiwadd",
          resume_text: profile?.raw_text || "",
          skills: profile?.skills || match.matched_skills,
          tone: selectedTone
        })
      });
      const data = await res.json();
      setContent(data.cover_letter || "Failed to generate cover letter.");
    } catch (err) {
      console.error(err);
      setContent("Error generating cover letter. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (match) {
      generateCoverLetter();
    }
  }, [match]);

  if (!match) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `Cover_Letter_${match.company.replace(/\s+/g, "_")}_${match.title.replace(/\s+/g, "_")}.txt`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                AI Cover Letter Studio
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Tailored Cover Letter for {match.company}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Role: <strong className="text-slate-200">{match.title}</strong> in {match.location}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tone Selector & Regenerate */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-850 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400">Tone:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Professional & Results-Driven",
                "Passionate & High-Energy",
                "Technical & Engineering Depth"
              ].map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTone(t);
                    generateCoverLetter(t);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition ${
                    tone === t
                      ? "bg-indigo-600 text-white border-indigo-500"
                      : "bg-slate-900 text-slate-300 border-slate-750 hover:bg-slate-800"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => generateCoverLetter(tone)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loading ? "animate-spin" : ""}`} />
            <span>Regenerate</span>
          </button>
        </div>

        {/* Text Area / Content */}
        <div className="relative">
          {loading ? (
            <div className="h-80 flex flex-col items-center justify-center bg-slate-850 rounded-xl border border-slate-800 space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
              <p className="text-xs text-slate-300 font-medium">Crafting tailored cover letter with Gemini 3.8 Flash...</p>
            </div>
          ) : (
            <textarea
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-4 rounded-xl bg-slate-850 border border-slate-750 text-slate-100 text-xs sm:text-sm font-sans leading-relaxed focus:outline-none focus:border-indigo-500 shadow-inner"
              placeholder="Your cover letter will appear here..."
            />
          )}
        </div>

        {/* Footer Actions: Copy, Download, Word count */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400">
            {content.split(/\s+/).filter(Boolean).length} words • Editable text
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-400" />
                  <span>Copy to Clipboard</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow transition"
            >
              <Download className="w-4 h-4" />
              <span>Download (.txt)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
