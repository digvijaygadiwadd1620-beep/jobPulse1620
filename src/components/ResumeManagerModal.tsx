import React, { useState, useEffect, useRef } from "react";
import { ResumeProfile } from "../types";
import { SAMPLE_PROFILES } from "../data/sampleProfiles";
import { 
  X, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  Plus, 
  Trash2, 
  User, 
  Briefcase, 
  Layers,
  Loader2,
  AlertTriangle,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from "lucide-react";

interface ResumeManagerModalProps {
  activeProfile: ResumeProfile | null;
  onSelectProfile: (profile: ResumeProfile) => void;
  onSaveProfile: (profile: ResumeProfile) => void;
  onClose: () => void;
}

export const ResumeManagerModal: React.FC<ResumeManagerModalProps> = ({
  activeProfile,
  onSelectProfile,
  onSaveProfile,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<"profiles" | "upload" | "review">("profiles");
  const [savedProfiles, setSavedProfiles] = useState<ResumeProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(true);

  // File upload state
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [rawText, setRawText] = useState<string>("");
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [parseStatusMessage, setParseStatusMessage] = useState<string>("");
  const [parseError, setParseError] = useState<string>("");
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string>("");

  // Track if a new resume was parsed in the current session to avoid stale sync overwrites
  const hasParsedNewResumeRef = useRef<boolean>(false);
  const lastSyncedProfileIdRef = useRef<string | null>(activeProfile?.id || null);

  // Extracted / Editable Profile State
  const [profileId, setProfileId] = useState<string>(activeProfile?.id || `resume-${Date.now()}`);
  const [name, setName] = useState<string>(activeProfile?.name || "Candidate Profile");
  const [title, setTitle] = useState<string>(activeProfile?.target_title || "QA Test Engineer");
  const [domain, setDomain] = useState<string>(activeProfile?.domain || "healthcare");
  const [experience, setExperience] = useState<number>(activeProfile?.years_experience || 4);
  const [email, setEmail] = useState<string>(activeProfile?.email || "");
  const [phone, setPhone] = useState<string>(activeProfile?.phone || "");
  const [skills, setSkills] = useState<string[]>(activeProfile?.skills || ["selenium", "java", "cypress", "postman", "healthcare", "hl7", "hipaa"]);
  const [executiveSummary, setExecutiveSummary] = useState<string>(activeProfile?.executive_summary || "");
  const [highlights, setHighlights] = useState<string[]>(activeProfile?.experience_highlights || []);
  const [newSkill, setNewSkill] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Fetch real saved profiles from SQLite database
  const loadSavedProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const res = await fetch("/api/resumes");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSavedProfiles(data);
          return;
        }
      }
      // If none yet or error, fallback to samples
      setSavedProfiles(SAMPLE_PROFILES);
    } catch (err) {
      console.warn("Could not fetch resumes, fallback to sample profiles:", err);
      setSavedProfiles(SAMPLE_PROFILES);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    loadSavedProfiles();
  }, []);

  // Sync with activeProfile when provided (only if user hasn't just parsed a new document in this session)
  useEffect(() => {
    if (activeProfile && !hasParsedNewResumeRef.current) {
      if (lastSyncedProfileIdRef.current !== activeProfile.id) {
        lastSyncedProfileIdRef.current = activeProfile.id;
        setProfileId(activeProfile.id);
        setName(activeProfile.name);
        setTitle(activeProfile.target_title);
        setDomain(activeProfile.domain || "healthcare");
        setExperience(activeProfile.years_experience || 4);
        setEmail(activeProfile.email || "");
        setPhone(activeProfile.phone || "");
        setSkills(Array.from(new Set((activeProfile.skills || []).map((s: string) => s.toLowerCase().trim()).filter(Boolean))));
        setRawText(activeProfile.raw_text || "");
        if (activeProfile.executive_summary) {
          setExecutiveSummary(activeProfile.executive_summary);
        }
        if (activeProfile.experience_highlights) {
          setHighlights(activeProfile.experience_highlights);
        }
      }
    }
  }, [activeProfile]);

  // Deep parse helper that calls server endpoint
  const executeDeepParse = async (payload: {
    raw_text?: string;
    file_base64?: string;
    file_name?: string;
    mime_type?: string;
  }) => {
    setIsParsing(true);
    setParseError("");
    setParseSuccessMsg("");
    setParseStatusMessage("Extracting text and running deep AI analysis on candidate resume...");

    try {
      const res = await fetch("/api/resume/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error during parsing (HTTP ${res.status})`);
      }

      const data = await res.json();
      const extracted = data.profile;

      if (!extracted) {
        throw new Error("No structured profile could be parsed from the document.");
      }

      // Flag that a new resume document has been parsed
      hasParsedNewResumeRef.current = true;
      lastSyncedProfileIdRef.current = null;

      const parsedCandidateName = extracted.name || (uploadedFileName ? uploadedFileName.replace(/\.[^/.]+$/, "") : "Candidate Profile");
      const parsedTargetTitle = extracted.target_title || "Software Engineer";
      const parsedDomain = extracted.domain || "general";
      const parsedExperience = extracted.years_experience !== undefined ? Number(extracted.years_experience) : 4;
      const parsedSkills: string[] = Array.isArray(extracted.skills) && extracted.skills.length > 0
        ? Array.from<string>(new Set(extracted.skills.map((s: string) => String(s).toLowerCase().trim()).filter(Boolean)))
        : ["engineering"];

      // Populate extracted state deeply and completely
      const newId = `resume-${Date.now()}`;
      setProfileId(newId);
      setName(parsedCandidateName);
      setTitle(parsedTargetTitle);
      setDomain(parsedDomain);
      setExperience(parsedExperience);
      setEmail(extracted.email || "");
      setPhone(extracted.phone || "");
      setSkills(parsedSkills);
      setExecutiveSummary(extracted.executive_summary || "");
      if (Array.isArray(extracted.experience_highlights) && extracted.experience_highlights.length > 0) {
        setHighlights(extracted.experience_highlights);
      }
      if (data.raw_text) {
        setRawText(data.raw_text);
      }

      setParseStatusMessage(`Saving & fetching live real-time jobs for ${parsedCandidateName}...`);

      const newProfile: ResumeProfile = {
        id: newId,
        name: parsedCandidateName,
        target_title: parsedTargetTitle,
        domain: parsedDomain,
        years_experience: parsedExperience,
        email: extracted.email || undefined,
        phone: extracted.phone || undefined,
        skills: parsedSkills,
        raw_text: data.raw_text || rawText || "",
        executive_summary: extracted.executive_summary || undefined,
        experience_highlights: extracted.experience_highlights || undefined,
        is_active: 1
      };

      // Automatically save and activate profile in SQLite database so user doesn't get stuck
      try {
        await fetch("/api/resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newProfile)
        });
        onSaveProfile(newProfile);
        onSelectProfile(newProfile);
        await loadSavedProfiles();
      } catch (saveErr) {
        console.warn("Auto-save notice:", saveErr);
        onSaveProfile(newProfile);
        onSelectProfile(newProfile);
      }

      setParseSuccessMsg(`Extracted ${parsedSkills.length} skills & synced real-time jobs for ${parsedCandidateName}!`);
      // Transition to Review & Edit Skills tab
      setActiveTab("review");
    } catch (err: any) {
      console.error("Deep parse error:", err);
      setParseError(err.message || "Failed to deeply parse resume.");
    } finally {
      setIsParsing(false);
      setParseStatusMessage("");
    }
  };

  // Unified file processing for click upload and drag-and-drop
  const processResumeFile = (file: File) => {
    setUploadedFileName(file.name);
    setParseError("");

    const reader = new FileReader();
    reader.onload = () => {
      const base64Data = reader.result as string;
      executeDeepParse({
        file_base64: base64Data,
        file_name: file.name,
        mime_type: file.type || "application/pdf"
      });
    };
    reader.onerror = () => {
      setParseError("Could not read uploaded file. Please try selecting a different file or paste the text.");
    };

    reader.readAsDataURL(file);
  };

  // Handle file upload (converts to base64 and posts to parser)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processResumeFile(file);
    // Clear input value so selecting the same or another file always fires onChange
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processResumeFile(file);
    }
  };

  // Handle raw text parse button
  const handleTextParse = () => {
    if (!rawText.trim()) {
      setParseError("Please paste resume text before parsing.");
      return;
    }
    executeDeepParse({ raw_text: rawText.trim() });
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim().toLowerCase();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  // Save profile to database and activate immediately
  const handleSaveAndActivate = async () => {
    setIsSaving(true);
    const newProfile: ResumeProfile = {
      id: profileId || `resume-${Date.now()}`,
      name: name.trim() || "Candidate",
      target_title: title.trim() || "QA Test Engineer",
      domain: domain.trim() || "healthcare",
      years_experience: Number(experience) || 4,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      skills,
      raw_text: rawText || "",
      executive_summary: executiveSummary || undefined,
      experience_highlights: highlights.length > 0 ? highlights : undefined,
      is_active: 1
    };

    try {
      // Save permanently to SQLite backend
      const res = await fetch("/api/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProfile)
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      hasParsedNewResumeRef.current = false;
      onSaveProfile(newProfile);
      onSelectProfile(newProfile);
      await loadSavedProfiles();
      onClose();
    } catch (err: any) {
      console.error("Failed to save and activate resume:", err);
      hasParsedNewResumeRef.current = false;
      // Still apply to client so user is not blocked
      onSaveProfile(newProfile);
      onSelectProfile(newProfile);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  // Activate an existing saved profile from the list
  const handleActivateSaved = async (prof: ResumeProfile) => {
    try {
      hasParsedNewResumeRef.current = false;
      await fetch(`/api/resumes/${prof.id}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      onSelectProfile(prof);
      await loadSavedProfiles();
      onClose();
    } catch (err) {
      console.error("Failed to activate profile:", err);
      hasParsedNewResumeRef.current = false;
      onSelectProfile(prof);
      onClose();
    }
  };

  // Delete a saved profile
  const handleDeleteSaved = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/resumes/${id}`, {
        method: "DELETE"
      });
      await loadSavedProfiles();
    } catch (err) {
      console.error("Failed to delete profile:", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div 
        id="resume-manager-modal-card"
        className="bg-slate-900 border border-slate-750 rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Resume & Profile Intelligence
              </span>
              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Deep AI Extraction
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Candidate Resume & Profile Manager
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              The 24/7 background agent matches and scores all live job feeds against the active resume profile.
            </p>
          </div>

          <button
            id="close-resume-modal-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          {[
            { id: "profiles", label: `Saved Profiles (${savedProfiles.length})` },
            { id: "upload", label: "Upload & Deep Parse" },
            { id: "review", label: "Review & Refine Skills" }
          ].map((tab) => (
            <button
              key={tab.id}
              id={`tab-resume-${tab.id}`}
              onClick={() => setActiveTab(tab.id as any)}
              className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg transition ${
                activeTab === tab.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Status / Feedback Banners */}
        {parseSuccessMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-emerald-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">{parseSuccessMsg}</span>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-sm"
              >
                View Live Jobs Now
              </button>
            </div>
          </div>
        )}

        {parseError && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{parseError}</span>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Tab 1: Saved Profiles in Database */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "profiles" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Select any profile to activate it and trigger real-time TF-IDF job scoring:
              </p>
              <button
                onClick={loadSavedProfiles}
                className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition"
                title="Refresh saved profiles"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
            </div>

            {loadingProfiles ? (
              <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                Loading saved resumes...
              </div>
            ) : savedProfiles.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs bg-slate-850 rounded-xl border border-slate-800">
                No candidate resumes found. Upload a resume or paste text to get started!
              </div>
            ) : (
              <div className="space-y-2.5">
                {savedProfiles.map((prof, idx) => {
                  const isActive =
                    (prof.is_active === 1) ||
                    activeProfile?.id === prof.id ||
                    activeProfile?.name === prof.name;

                  return (
                    <div
                      key={`${prof.id}-${idx}`}
                      id={`profile-card-${prof.id}`}
                      onClick={() => handleActivateSaved(prof)}
                      className={`p-4 rounded-xl border transition cursor-pointer flex items-start justify-between gap-4 ${
                        isActive
                          ? "bg-indigo-950/50 border-indigo-500 shadow-md ring-1 ring-indigo-500/30"
                          : "bg-slate-850 hover:bg-slate-800 border-slate-800"
                      }`}
                    >
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-white truncate">{prof.name}</h4>
                          {isActive ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              Active Profile
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                              Inactive
                            </span>
                          )}
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {prof.domain || "general"}
                          </span>
                        </div>

                        <p className="text-xs text-indigo-300 font-medium truncate">
                          {prof.target_title} {prof.years_experience ? `• ${prof.years_experience} yrs exp` : ""}
                        </p>

                        <div className="flex flex-wrap gap-1 mt-2">
                          {Array.from(new Set(prof.skills || [])).slice(0, 8).map((s, idx) => (
                            <span
                              key={`${prof.id}-skill-${s}-${idx}`}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                            >
                              {s}
                            </span>
                          ))}
                          {prof.skills.length > 8 && (
                            <span className="text-[10px] text-slate-400 self-center">
                              +{prof.skills.length - 8} more
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          id={`activate-profile-${prof.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivateSaved(prof);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                            isActive
                              ? "bg-indigo-600 text-white shadow"
                              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                          }`}
                        >
                          {isActive ? "Active" : "Activate"}
                        </button>

                        {!isActive && (
                          <button
                            id={`delete-profile-${prof.id}`}
                            onClick={(e) => handleDeleteSaved(prof.id, e)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                            title="Delete profile"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-2">
              <button
                id="btn-goto-upload-tab"
                onClick={() => setActiveTab("upload")}
                className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 bg-slate-850/40 hover:bg-slate-800/60 transition"
              >
                <Plus className="w-4 h-4 text-indigo-400" />
                Upload or Add a New Resume
              </button>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Tab 2: Upload Resume File or Paste Text */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "upload" && (
          <div className="space-y-4">
            {/* File drop zone */}
            <div 
              id="resume-drop-zone"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition ${
                isDragOver 
                  ? "border-indigo-400 bg-indigo-950/40 scale-[1.01]" 
                  : "border-slate-750 hover:border-indigo-500 bg-slate-850/50"
              }`}
            >
              <UploadCloud className={`w-10 h-10 mx-auto mb-3 transition ${isDragOver ? "text-indigo-300 animate-bounce" : "text-indigo-400"}`} />
              <h4 className="text-sm font-bold text-white">
                {isDragOver ? "Drop Resume Document Here" : "Upload Candidate Resume Document"}
              </h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-4">
                Drag & drop or browse. Supports <strong className="text-slate-200">PDF, DOCX, DOC, TXT</strong>. Deep ATS parsing extracts full technical competencies, target job roles, domain specialties, and employment history.
              </p>

              <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer shadow-lg shadow-indigo-600/20 transition">
                <span>Select Resume File</span>
                <input
                  id="resume-file-input"
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={handleFileUpload}
                  disabled={isParsing}
                  className="hidden"
                />
              </label>

              {isParsing && (
                <div className="mt-4 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-xs flex items-center justify-center gap-2 animate-pulse">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  <span>{parseStatusMessage || "Deep parsing document with AI ATS Engine..."}</span>
                </div>
              )}

              {uploadedFileName && !isParsing && (
                <p className="text-xs text-emerald-400 font-semibold mt-3 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  Processed: {uploadedFileName}
                </p>
              )}
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-800"></div>
              <span className="flex-shrink mx-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Or Paste Resume Content
              </span>
              <div className="flex-grow border-t border-slate-800"></div>
            </div>

            {/* Plain text area */}
            <div className="space-y-2">
              <textarea
                id="resume-raw-text-textarea"
                rows={6}
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder="Paste full plain text resume (including contact info, experience summary, technical skills, and employment history) to extract candidate profile..."
                className="w-full p-3.5 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs focus:outline-none focus:border-indigo-500 font-mono leading-relaxed"
              />

              <div className="flex gap-2">
                <button
                  id="btn-deep-parse-text"
                  type="button"
                  onClick={handleTextParse}
                  disabled={isParsing || !rawText.trim()}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow transition flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isParsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Parsing Resume...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-indigo-200" />
                      Deep Parse Resume with AI ATS Engine
                    </>
                  )}
                </button>

                <button
                  id="btn-skip-to-manual-edit"
                  type="button"
                  onClick={() => setActiveTab("review")}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition"
                >
                  Manual Form
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* Tab 3: Review & Refine Skills */}
        {/* ------------------------------------------------------------- */}
        {activeTab === "review" && (
          <div className="space-y-4">
            {/* Primary Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Candidate Full Name:
                </label>
                <input
                  id="input-candidate-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Digvijay Gadiwadd"
                  className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                  Target / Current Role Title:
                </label>
                <input
                  id="input-target-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Senior QA Test Automation Engineer"
                  className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Primary Domain Specialization:
                </label>
                <select
                  id="select-domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="healthcare">Healthcare IT (HL7, HIPAA, FHIR, EHR, Clinical)</option>
                  <option value="fintech">Fintech & Banking (Payments, Security, Trading)</option>
                  <option value="fullstack">Full Stack Software Engineering</option>
                  <option value="cloud_devops">Cloud Infrastructure & DevOps / SRE</option>
                  <option value="ecommerce">E-Commerce & Retail Tech</option>
                  <option value="general">General Technology & Software QA</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Years of Experience:
                </label>
                <input
                  id="input-years-experience"
                  type="number"
                  min={0}
                  max={35}
                  value={experience}
                  onChange={(e) => setExperience(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-indigo-400" />
                  Email Address:
                </label>
                <input
                  id="input-candidate-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. digvijaygadiwadd1620@gmail.com"
                  className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  Phone Number:
                </label>
                <input
                  id="input-candidate-phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  className="w-full px-3 py-2 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Executive Summary if available */}
            {executiveSummary && (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Parsed Executive Summary:
                </label>
                <textarea
                  rows={2}
                  value={executiveSummary}
                  onChange={(e) => setExecutiveSummary(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Skills Tags Manager */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Technical Skills & Competencies ({skills.length}):
                </label>
                <span className="text-[11px] text-slate-400">
                  Used by TF-IDF & Keyword bonus matchers
                </span>
              </div>

              <div className="flex gap-2 mb-2">
                <input
                  id="input-add-new-skill"
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddSkill())}
                  placeholder="Add a new skill (e.g. Playwright, GraphQL, Jenkins) and press Enter..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-850 border border-slate-750 text-white text-xs focus:outline-none focus:border-indigo-500"
                />
                <button
                  id="btn-add-skill-chip"
                  type="button"
                  onClick={handleAddSkill}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center gap-1 shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Skill
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-slate-850 border border-slate-800 max-h-40 overflow-y-auto">
                {Array.from(new Set<string>(skills)).map((s, idx) => (
                  <span
                    key={`editor-skill-${s}-${idx}`}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-750 hover:border-slate-600 transition"
                  >
                    <span>{s}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(s)}
                      className="text-slate-400 hover:text-rose-400 transition"
                      title={`Remove ${s}`}
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab("upload")}
                className="text-xs text-slate-400 hover:text-slate-200 transition"
              >
                Back to Upload
              </button>

              <button
                id="btn-save-activate-resume"
                type="button"
                onClick={handleSaveAndActivate}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold shadow-lg shadow-indigo-600/25 transition flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving & Re-scoring Feed...
                  </>
                ) : (
                  <>
                    <span>Save & Run Instant Matching</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
