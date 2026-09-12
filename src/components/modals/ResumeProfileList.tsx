import React from 'react';
import { ResumeProfile } from '../../types';
import { User, Briefcase, Trash2, CheckCircle2, RefreshCw } from 'lucide-react';

interface ResumeProfileListProps {
  profiles: ResumeProfile[];
  activeProfileId?: string;
  loading: boolean;
  onSelectProfile: (profile: ResumeProfile) => void;
  onDeleteProfile: (id: string) => void;
  onNewUpload: () => void;
}

export const ResumeProfileList: React.FC<ResumeProfileListProps> = ({
  profiles,
  activeProfileId,
  loading,
  onSelectProfile,
  onDeleteProfile,
  onNewUpload,
}) => {
  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
        <span className="text-xs">Loading saved candidate profiles...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">Stored Candidate Profiles ({profiles.length})</h3>
          <p className="text-xs text-slate-400">Select any candidate profile to activate for TF-IDF matching and alerts.</p>
        </div>
        <button
          onClick={onNewUpload}
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
        >
          + Upload New Resume
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto pr-1">
        {profiles.map((p) => {
          const isActive = p.id === activeProfileId || p.is_active === 1;
          return (
            <div
              key={p.id}
              className={`p-4 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isActive
                  ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-bold text-white">{p.name}</span>
                  {isActive && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Active
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500" />
                    {p.target_title}
                  </span>
                  <span>•</span>
                  <span className="capitalize text-slate-300">{p.domain || 'Tech'}</span>
                  <span>•</span>
                  <span>{p.years_experience || 3}+ yrs</span>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(p.skills || []).slice(0, 5).map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 bg-slate-800 text-slate-300 rounded text-[10px] font-medium">
                      {s}
                    </span>
                  ))}
                  {(p.skills || []).length > 5 && (
                    <span className="text-[10px] text-slate-500 self-center">
                      +{(p.skills || []).length - 5} more
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                {!isActive ? (
                  <button
                    onClick={() => onSelectProfile(p)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    Activate Profile
                  </button>
                ) : (
                  <button
                    onClick={() => onSelectProfile(p)}
                    className="px-3 py-1.5 bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold cursor-default"
                  >
                    Current Profile
                  </button>
                )}
                {profiles.length > 1 && (
                  <button
                    onClick={() => onDeleteProfile(p.id)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
                    title="Delete profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
