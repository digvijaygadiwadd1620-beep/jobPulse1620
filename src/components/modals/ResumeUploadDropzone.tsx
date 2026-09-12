import React, { useRef } from 'react';
import { UploadCloud, FileText, Loader2, AlertTriangle, Sparkles } from 'lucide-react';

interface ResumeUploadDropzoneProps {
  isParsing: boolean;
  parseStatusMessage: string;
  parseError: string;
  uploadedFileName: string;
  onFileUpload: (file: File) => void;
  onPasteText: (text: string) => void;
  rawText: string;
}

export const ResumeUploadDropzone: React.FC<ResumeUploadDropzoneProps> = ({
  isParsing,
  parseStatusMessage,
  parseError,
  uploadedFileName,
  onFileUpload,
  onPasteText,
  rawText,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h3 className="text-base font-bold text-white">Upload or Paste Resume</h3>
        <p className="text-xs text-slate-400">
          Upload a PDF or DOCX file, or paste raw text. The parser extracts skills, experience, and domain focus.
        </p>
      </div>

      {/* File Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
          isDragOver
            ? 'border-indigo-500 bg-indigo-950/30'
            : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              onFileUpload(e.target.files[0]);
            }
          }}
        />

        {isParsing ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
            <p className="text-xs font-semibold text-slate-200">{parseStatusMessage || 'Parsing resume...'}</p>
          </div>
        ) : (
          <>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {uploadedFileName ? (
                  <span className="text-indigo-400 flex items-center justify-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" />
                    {uploadedFileName}
                  </span>
                ) : (
                  'Click to upload or drag & drop resume'
                )}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">Supports PDF, DOCX, and TXT</p>
            </div>
          </>
        )}
      </div>

      {parseError && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2 text-xs text-rose-300">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {/* Or Paste Raw Text */}
      <div className="space-y-1.5 pt-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-300">Or Paste Resume Text</label>
          <span className="text-[11px] text-slate-500">{rawText ? `${rawText.length} characters` : 'Optional'}</span>
        </div>
        <textarea
          value={rawText}
          onChange={(e) => onPasteText(e.target.value)}
          placeholder="Paste full resume text or markdown here..."
          rows={5}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono resize-y"
        />
      </div>
    </div>
  );
};
