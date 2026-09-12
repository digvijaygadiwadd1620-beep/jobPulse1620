import React, { useState } from 'react';
import { Globe2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface AdzunaSettingsSectionProps {
  appId: string;
  appKey: string;
  onChangeAppId: (id: string) => void;
  onChangeAppKey: (key: string) => void;
}

export const AdzunaSettingsSection: React.FC<AdzunaSettingsSectionProps> = ({
  appId,
  appKey,
  onChangeAppId,
  onChangeAppKey,
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/adzuna/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ app_id: appId, app_key: appKey }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setTestResult({
          success: true,
          count: data.count,
          message: `Live connection verified! Adzuna returned ${data.count} active roles.`,
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Failed to authenticate with Adzuna API.',
        });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Connection test failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/adzuna/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setSyncResult({
          success: true,
          message: `Sync complete. ${data.synced_jobs || data.count || 0} live openings imported into database.`,
        });
      } else {
        setSyncResult({
          success: false,
          message: data.error || 'Sync encountered an error.',
        });
      }
    } catch (err: any) {
      setSyncResult({ success: false, message: err.message || 'Sync failed.' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-emerald-400" />
          Adzuna Live Job Feed Integration
        </h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Connect to Adzuna API to automatically fetch live job postings for your target role and region.
        </p>
      </div>

      <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Adzuna App ID
            </label>
            <input
              type="text"
              value={appId}
              onChange={(e) => onChangeAppId(e.target.value)}
              placeholder="e.g. 78a1bc23"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Adzuna App Key
            </label>
            <input
              type="password"
              value={appKey}
              onChange={(e) => onChangeAppKey(e.target.value)}
              placeholder="••••••••••••••••••••••••••••••••"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        <div className="pt-2 flex flex-wrap gap-2">
          <button
            onClick={handleTest}
            disabled={testing || !appId.trim() || !appKey.trim()}
            className="px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
          >
            {testing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
            Test Live API
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
          >
            {syncing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            Sync Now
          </button>
        </div>

        {testResult && (
          <p className={`text-xs flex items-center gap-1 ${testResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
            {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {testResult.message}
          </p>
        )}
        {syncResult && (
          <p className={`text-xs flex items-center gap-1 ${syncResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
            {syncResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {syncResult.message}
          </p>
        )}
      </div>
    </div>
  );
};
