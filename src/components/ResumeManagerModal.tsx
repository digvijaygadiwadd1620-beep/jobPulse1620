import React, { useState, useEffect } from 'react';
import { ResumeProfile } from '../types';
import { SAMPLE_PROFILES } from '../data/sampleProfiles';
import { X, Layers, UploadCloud, User } from 'lucide-react';
import { ResumeProfileList } from './modals/ResumeProfileList';
import { ResumeUploadDropzone } from './modals/ResumeUploadDropzone';
import { ResumeReviewForm } from './modals/ResumeReviewForm';
import { api } from '../utils/api';

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
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'profiles' | 'upload' | 'review'>('profiles');
  const [savedProfiles, setSavedProfiles] = useState<ResumeProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState<boolean>(true);

  // Upload & parse state
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseStatusMessage, setParseStatusMessage] = useState<string>('');
  const [parseError, setParseError] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Candidate draft for review
  const [draftProfile, setDraftProfile] = useState<Partial<ResumeProfile>>(() => activeProfile || SAMPLE_PROFILES[0]);

  const loadProfiles = async () => {
    setLoadingProfiles(true);
    try {
      const data = await api.getResumes();
      if (Array.isArray(data) && data.length > 0) {
        setSavedProfiles(data);
      } else {
        setSavedProfiles(SAMPLE_PROFILES);
      }
    } catch {
      setSavedProfiles(SAMPLE_PROFILES);
    } finally {
      setLoadingProfiles(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleFileUpload = async (file: File) => {
    setUploadedFileName(file.name);
    setIsParsing(true);
    setParseError('');
    setParseStatusMessage(`Reading and parsing ${file.name}...`);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await api.parseResume({
            file_base64: base64Data,
            file_name: file.name,
            mime_type: file.type,
          });

          if (res && res.parsed) {
            setDraftProfile({
              id: `resume-${Date.now()}`,
              ...res.parsed,
            });
            setActiveTab('review');
          } else {
            setParseError('Failed to parse structured details from document.');
          }
        } catch (err: any) {
          setParseError(err.message || 'Error processing file.');
        } finally {
          setIsParsing(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsParsing(false);
      setParseError(err.message || 'Error reading file.');
    }
  };

  const handleParseText = async (text: string) => {
    setRawText(text);
    if (!text.trim()) return;
    setIsParsing(true);
    setParseError('');
    setParseStatusMessage('Parsing candidate skills from text...');

    try {
      const res = await api.parseResume({ raw_text: text });
      if (res && res.parsed) {
        setDraftProfile({
          id: `resume-${Date.now()}`,
          raw_text: text,
          ...res.parsed,
        });
        setActiveTab('review');
      } else {
        setParseError('Could not extract details from provided text.');
      }
    } catch (err: any) {
      setParseError(err.message || 'Parse error.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    await api.deleteResume(id);
    await loadProfiles();
  };

  const handleSaveDraft = async (fullProfile: ResumeProfile) => {
    setIsSaving(true);
    try {
      await onSaveProfile(fullProfile);
      await loadProfiles();
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              Candidate Resume & Skills Manager
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage profiles, upload resumes, and fine-tune keywords for the matching engine.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('profiles')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'profiles' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-3.5 h-3.5" /> Saved Profiles ({savedProfiles.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-1.5 rounded-lg font-semibold transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'upload' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" /> Upload / Parse
          </button>
          {activeTab === 'review' && (
            <button
              onClick={() => setActiveTab('review')}
              className="flex-1 py-1.5 rounded-lg font-semibold bg-indigo-600 text-white shadow-sm transition"
            >
              Review Details
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'profiles' && (
            <ResumeProfileList
              profiles={savedProfiles}
              activeProfileId={activeProfile?.id}
              loading={loadingProfiles}
              onSelectProfile={(p) => {
                onSelectProfile(p);
                onClose();
              }}
              onDeleteProfile={handleDeleteProfile}
              onNewUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'upload' && (
            <ResumeUploadDropzone
              isParsing={isParsing}
              parseStatusMessage={parseStatusMessage}
              parseError={parseError}
              uploadedFileName={uploadedFileName}
              onFileUpload={handleFileUpload}
              onPasteText={handleParseText}
              rawText={rawText}
            />
          )}

          {activeTab === 'review' && (
            <ResumeReviewForm
              profile={draftProfile}
              isSaving={isSaving}
              onSave={handleSaveDraft}
              onCancel={() => setActiveTab('profiles')}
            />
          )}
        </div>
      </div>
    </div>
  );
};
