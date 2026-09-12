import React, { useState } from 'react';
import { ResumeProfile } from '../../types';
import { User, Briefcase, Plus, X, Sparkles, CheckCircle2 } from 'lucide-react';

interface ResumeReviewFormProps {
  profile: Partial<ResumeProfile>;
  isSaving: boolean;
  onSave: (profile: ResumeProfile) => void;
  onCancel: () => void;
}

export const ResumeReviewForm: React.FC<ResumeReviewFormProps> = ({
  profile,
  isSaving,
  onSave,
  onCancel,
}) => {
  const [name, setName] = useState(profile.name || '');
  const [targetTitle, setTargetTitle] = useState(profile.target_title || '');
  const [domain, setDomain] = useState(profile.domain || 'healthcare');
  const [yearsExperience, setYearsExperience] = useState(profile.years_experience || 4);
  const [email, setEmail] = useState(profile.email || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [skills, setSkills] = useState<string[]>(profile.skills || []);
  const [newSkill, setNewSkill] = useState('');
  const [executiveSummary, setExecutiveSummary] = useState(profile.executive_summary || '');

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim().toLowerCase())) {
      setSkills([...skills, newSkill.trim().toLowerCase()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: profile.id || `resume-${Date.now()}`,
      name,
      target_title: targetTitle,
      domain,
      years_experience: yearsExperience,
      email,
      phone,
      skills,
      raw_text: profile.raw_text || '',
      executive_summary: executiveSummary,
      experience_highlights: profile.experience_highlights,
      is_active: 1,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Candidate Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Target Job Title</label>
          <input
            type="text"
            required
            value={targetTitle}
            onChange={(e) => setTargetTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Domain Focus</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g. Healthcare, Fintech, Cloud"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Years of Experience</label>
          <input
            type="number"
            min="0"
            max="40"
            value={yearsExperience}
            onChange={(e) => setYearsExperience(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="candidate@example.com"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Skills */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">
          Extracted Skills & Competencies ({skills.length})
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
            placeholder="Add skill (e.g. Playwright, SQL)..."
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
          {skills.map((skill) => (
            <span
              key={skill}
              className="px-2.5 py-1 rounded-lg bg-indigo-950/40 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center gap-1.5"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleRemoveSkill(skill)}
                className="hover:text-rose-400 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Executive Summary */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1">Professional Summary</label>
        <textarea
          rows={3}
          value={executiveSummary}
          onChange={(e) => setExecutiveSummary(e.target.value)}
          placeholder="Brief professional profile summary..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-y"
        />
      </div>

      <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save & Activate Profile'}
        </button>
      </div>
    </form>
  );
};
