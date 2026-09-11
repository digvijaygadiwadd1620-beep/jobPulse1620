import React, { useState, useEffect, useRef } from "react";
import { AlertConfig } from "../types";
import { 
  X, 
  Send, 
  Bell, 
  Clock, 
  Sliders, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Globe2,
  Key,
  Check,
  Copy,
  Clipboard
} from "lucide-react";

interface AlertSettingsModalProps {
  config: AlertConfig | null;
  onSaveConfig: (updated: Partial<AlertConfig>) => void;
  onTestInAppNotification?: () => void;
  onClose: () => void;
}

const DEFAULT_BOT_TOKEN = "";

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  config,
  onSaveConfig,
  onTestInAppNotification,
  onClose
}) => {
  const [botToken, setBotToken] = useState<string>(config?.telegram_bot_token || "");
  const [chatId, setChatId] = useState<string>(config?.telegram_chat_id || "");
  const [minScore, setMinScore] = useState<number>(config?.min_score_alert || 80);
  const [interval, setInterval] = useState<number>(config?.scan_interval_minutes || 5);
  const [autoScan, setAutoScan] = useState<boolean>(config?.auto_scan_enabled === 1);
  const [desktopNotif, setDesktopNotif] = useState<boolean>(config?.desktop_notifications === 1);

  // Sync state when config changes from server
  useEffect(() => {
    if (config) {
      if (config.telegram_bot_token) setBotToken(config.telegram_bot_token);
      if (config.telegram_chat_id) setChatId(config.telegram_chat_id);
      if (config.min_score_alert !== undefined) setMinScore(config.min_score_alert);
      if (config.scan_interval_minutes !== undefined) setInterval(config.scan_interval_minutes);
      if (config.auto_scan_enabled !== undefined) setAutoScan(config.auto_scan_enabled === 1);
      if (config.desktop_notifications !== undefined) setDesktopNotif(config.desktop_notifications === 1);
      if (config.adzuna_app_id) setAdzunaAppId(config.adzuna_app_id);
      if (config.adzuna_app_key) setAdzunaAppKey(config.adzuna_app_key);
    }
  }, [config]);

  // Telegram verification & auto-detect state
  const tokenInputRef = useRef<HTMLInputElement>(null);
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [verifyingBot, setVerifyingBot] = useState<boolean>(false);
  const [botInfo, setBotInfo] = useState<{ success: boolean; message: string; username?: string } | null>(null);
  const [detectingChat, setDetectingChat] = useState<boolean>(false);
  const [detectResult, setDetectResult] = useState<{ success: boolean; message: string } | null>(null);

  // Adzuna credentials
  const [adzunaAppId, setAdzunaAppId] = useState<string>(config?.adzuna_app_id || "066adfaf");
  const [adzunaAppKey, setAdzunaAppKey] = useState<string>(config?.adzuna_app_key || "9d8303ee9e09eea727a92c1281addba8");
  const [testingAdzuna, setTestingAdzuna] = useState<boolean>(false);
  const [adzunaTestResult, setAdzunaTestResult] = useState<{ success: boolean; message: string; count?: number } | null>(null);
  const [syncingAdzuna, setSyncingAdzuna] = useState<boolean>(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const [testing, setTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestAdzuna = async () => {
    setTestingAdzuna(true);
    setAdzunaTestResult(null);
    try {
      const res = await fetch("/api/adzuna/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          app_id: adzunaAppId,
          app_key: adzunaAppKey
        })
      });
      const data = await res.json();
      if (data.status === "ok") {
        setAdzunaTestResult({
          success: true,
          count: data.count,
          message: `Live connection verified! Adzuna returned ${data.count} active roles in Pune & India.`
        });
      } else {
        setAdzunaTestResult({
          success: false,
          message: data.error || "Failed to authenticate with Adzuna API."
        });
      }
    } catch (err: any) {
      setAdzunaTestResult({
        success: false,
        message: err.message || "Network error testing Adzuna API."
      });
    } finally {
      setTestingAdzuna(false);
    }
  };

  const handleSyncAdzuna = async () => {
    setSyncingAdzuna(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/adzuna/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (data.status === "ok") {
        setSyncResult({
          success: true,
          message: `Successfully synchronized ${data.adzuna_jobs_synced || "all"} live Adzuna listings into your database!`
        });
      } else {
        setSyncResult({
          success: false,
          message: data.error || "Failed to sync Adzuna jobs."
        });
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: err.message || "Failed to trigger Adzuna sync."
      });
    } finally {
      setSyncingAdzuna(false);
    }
  };

  const cleanTelegramToken = (raw: string): string => {
    if (!raw) return "";
    // If user copied BotFather's entire message, extract the token directly
    const match = raw.match(/(\d{8,12}:[A-Za-z0-9_-]{30,50})/);
    if (match) {
      return match[1];
    }
    return raw.trim();
  };

  const handleFocusToPaste = () => {
    if (tokenInputRef.current) {
      tokenInputRef.current.focus();
      tokenInputRef.current.select();
      setPasteNotice("Input focused! Press Ctrl+V (or ⌘+V) to paste your token.");
      setTimeout(() => setPasteNotice(null), 3500);
    }
  };

  const handleVerifyBot = async () => {
    if (!botToken.trim()) {
      setBotInfo({ success: false, message: "Please provide a Telegram Bot Token." });
      return;
    }
    setVerifyingBot(true);
    setBotInfo(null);
    try {
      const res = await fetch("/api/alerts/telegram/verify-bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: botToken.trim() })
      });
      const data = await res.json();
      if (data.success && data.bot) {
        setBotInfo({
          success: true,
          message: `Active & Connected to @${data.bot.username} (${data.bot.first_name})`,
          username: data.bot.username
        });
      } else {
        setBotInfo({
          success: false,
          message: data.error || "Bot token returned 401 Unauthorized from Telegram."
        });
      }
    } catch (err: any) {
      setBotInfo({ success: false, message: err.message || "Failed to contact Telegram API." });
    } finally {
      setVerifyingBot(false);
    }
  };

  const handleDetectChatId = async () => {
    if (!botToken.trim()) {
      setDetectResult({ success: false, message: "Please enter your Telegram Bot Token first." });
      return;
    }
    setDetectingChat(true);
    setDetectResult(null);
    try {
      const res = await fetch("/api/alerts/telegram/detect-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bot_token: botToken.trim() })
      });
      const data = await res.json();
      if (data.success && data.chat_id) {
        setChatId(data.chat_id);
        setDetectResult({
          success: true,
          message: `Detected Chat ID: ${data.chat_id} (${data.first_name || data.username || "User"})`
        });
      } else {
        setDetectResult({
          success: false,
          message: data.error || "Could not detect chat ID. Ensure you sent /start to your bot in Telegram."
        });
      }
    } catch (err: any) {
      setDetectResult({ success: false, message: err.message || "Failed to contact server." });
    } finally {
      setDetectingChat(false);
    }
  };

  const handleTestTelegram = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/alerts/telegram/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bot_token: botToken,
          chat_id: chatId
        })
      });
      const data = await res.json();
      if (data.status === "ok") {
        setTestResult({
          success: true,
          message: data.message || "Test alert delivered successfully!"
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || data.message || "Failed to deliver Telegram test message."
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Network error sending Telegram test."
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      telegram_bot_token: botToken,
      telegram_chat_id: chatId,
      min_score_alert: minScore,
      scan_interval_minutes: interval,
      auto_scan_enabled: autoScan ? 1 : 0,
      desktop_notifications: desktopNotif ? 1 : 0,
      adzuna_app_id: adzunaAppId,
      adzuna_app_key: adzunaAppKey
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-lg w-full p-5 sm:p-7 shadow-2xl space-y-5 my-auto max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                <Send className="w-3 h-3" />
                Alerts & Dispatch Center
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Agent & API Integration Settings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure live job feed APIs (Adzuna) and instant notification dispatchers (Telegram).
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Autonomous 24/7 Scanning & Screen Alerts (Zero Manual Setup) */}
        <div className="bg-gradient-to-br from-indigo-950/40 via-slate-850 to-slate-850 border border-indigo-500/30 rounded-xl p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                24/7 Autonomous Scanner & Screen Alerts
              </h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              Active & Hands-Free
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Your agent continuously screens live job vacancies against your resume every {interval} minutes. When a match score reaches <strong className="text-white font-medium">{minScore}%</strong>, an instant screen toast and audio chime alert triggers automatically. <span className="text-emerald-400 font-medium">Zero manual setup required.</span>
          </p>

          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-medium text-slate-300">Minimum Score to Trigger Alert:</span>
              <span className="font-bold text-indigo-400">{minScore} / 100</span>
            </div>
            <input
              type="range"
              min={50}
              max={95}
              step={5}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block mt-0.5">
              Only roles meeting or exceeding {minScore}% match score will trigger notifications.
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Scan Interval:</label>
              <select
                value={interval}
                onChange={(e) => setInterval(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-750 text-white text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>Every 1 minute</option>
                <option value={5}>Every 5 minutes (Recommended)</option>
                <option value={15}>Every 15 minutes</option>
                <option value={30}>Every 30 minutes</option>
                <option value={60}>Every 1 hour</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Background Mode:</label>
              <button
                type="button"
                onClick={() => setAutoScan(!autoScan)}
                className={`w-full py-2 rounded-xl text-xs font-semibold transition ${
                  autoScan
                    ? "bg-emerald-600/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-750"
                }`}
              >
                {autoScan ? "Active 24/7" : "Manual Only"}
              </button>
            </div>
          </div>

          {/* Screen notifications toggle & preview test button */}
          <div className="pt-1 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-200 block">Desktop / Screen Alerts:</span>
                <span className="text-[10px] text-slate-400">In-browser system toast popup and audio chime</span>
              </div>
              <button
                type="button"
                onClick={() => setDesktopNotif(!desktopNotif)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  desktopNotif
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-400 border border-slate-750"
                }`}
              >
                {desktopNotif ? "Enabled" : "Disabled"}
              </button>
            </div>

            {onTestInAppNotification && (
              <button
                type="button"
                onClick={onTestInAppNotification}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold flex items-center justify-center gap-2 transition"
                title="Trigger a desktop popup alert to preview how notifications look and sound"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Preview Screen Alert Toast Now</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Adzuna API Integration Section */}
        <div className="bg-gradient-to-br from-emerald-950/30 via-slate-850 to-slate-850 border border-emerald-500/30 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-emerald-400" />
              Adzuna Live Job Aggregator
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
              Live Global Feed
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Direct integration with the Adzuna API to stream real-time engineering and QA vacancies across India, USA, and remote tech hubs.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">App ID:</label>
              <input
                type="text"
                value={adzunaAppId}
                onChange={(e) => setAdzunaAppId(e.target.value)}
                placeholder="e.g. 066adfaf"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-750 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">API Key:</label>
              <input
                type="password"
                value={adzunaAppKey}
                onChange={(e) => setAdzunaAppKey(e.target.value)}
                placeholder="Adzuna API Key"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-750 text-white text-xs font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleTestAdzuna}
              disabled={testingAdzuna}
              className="flex-1 py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Key className={`w-3.5 h-3.5 ${testingAdzuna ? "animate-spin" : ""}`} />
              <span>{testingAdzuna ? "Verifying..." : "Verify Adzuna API"}</span>
            </button>
            <button
              onClick={handleSyncAdzuna}
              disabled={syncingAdzuna}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-white border border-slate-700 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncingAdzuna ? "animate-spin text-emerald-400" : ""}`} />
              <span>{syncingAdzuna ? "Syncing..." : "Sync Live Jobs"}</span>
            </button>
          </div>

          {adzunaTestResult && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                adzunaTestResult.success
                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                  : "bg-rose-950/60 text-rose-300 border border-rose-500/40"
              }`}
            >
              {adzunaTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-snug">
                <strong className="block">{adzunaTestResult.success ? "Adzuna Connected" : "Connection Error"}</strong>
                <span>{adzunaTestResult.message}</span>
              </div>
            </div>
          )}

          {syncResult && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                syncResult.success
                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                  : "bg-rose-950/60 text-rose-300 border border-rose-500/40"
              }`}
            >
              {syncResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-snug">
                <strong className="block">{syncResult.success ? "Sync Complete" : "Sync Failed"}</strong>
                <span>{syncResult.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Telegram Config Section (Optional Mobile Add-on) */}
        <div className="bg-slate-850 border border-slate-800 rounded-xl p-4 space-y-3.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-sky-400" />
              Telegram Mobile Dispatcher
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 font-semibold">
              Optional Mobile Add-on
            </span>
          </div>

          <div className="p-3 rounded-xl bg-sky-950/30 border border-sky-500/20 text-sky-200 text-xs leading-relaxed space-y-1">
            <p className="font-semibold text-sky-300 flex items-center gap-1">
              <span>💡 Zero manual setup is required for computer alerts:</span>
            </p>
            <p className="text-[11px] text-slate-300">
              Desktop toast & sound alerts are already active above. You only need to configure Telegram if you want job alerts delivered to the Telegram mobile app on your phone.
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Telegram Bot Token (Optional):</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFocusToPaste}
                  className="text-[10px] text-sky-400 hover:text-sky-300 transition flex items-center gap-1 font-medium underline decoration-dotted"
                  title="Click to focus input and paste with Ctrl+V (or ⌘+V)"
                >
                  <Clipboard className="w-3 h-3" />
                  Paste (Ctrl+V)
                </button>
                {botToken && (
                  <>
                    <span className="text-[10px] text-slate-600">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setBotToken("");
                        setBotInfo(null);
                        setDetectResult(null);
                      }}
                      className="text-[10px] text-rose-400 hover:text-rose-300 transition"
                      title="Clear token"
                    >
                      Clear
                    </button>
                  </>
                )}
                <span className="text-[10px] text-slate-600">•</span>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[10px] text-slate-400 hover:text-white transition flex items-center gap-0.5"
                >
                  @BotFather
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
            {pasteNotice && (
              <div className="mb-2 px-2.5 py-1.5 rounded-lg bg-sky-950/70 border border-sky-500/40 text-[11px] text-sky-300 flex items-center gap-1.5 animate-in fade-in duration-200">
                <Check className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{pasteNotice}</span>
              </div>
            )}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={tokenInputRef}
                  type="text"
                  value={botToken}
                  onChange={(e) => {
                    setBotToken(cleanTelegramToken(e.target.value));
                    setBotInfo(null);
                    setDetectResult(null);
                  }}
                  onPaste={(e) => {
                    const text = e.clipboardData?.getData("text");
                    if (text) {
                      e.preventDefault();
                      setBotToken(cleanTelegramToken(text));
                      setBotInfo(null);
                      setDetectResult(null);
                      setPasteNotice("Token pasted successfully!");
                      setTimeout(() => setPasteNotice(null), 3000);
                    }
                  }}
                  placeholder="e.g. 8923485563:AAHAhWw04WWKmMY2i7p9U..."
                  className="w-full px-3 py-2 pr-8 rounded-xl bg-slate-900 border border-slate-750 text-white text-xs font-mono focus:outline-none focus:border-sky-500"
                />
                {botToken && (
                  <button
                    type="button"
                    onClick={() => {
                      setBotToken("");
                      setBotInfo(null);
                      setDetectResult(null);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-0.5"
                    title="Clear token"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={handleVerifyBot}
                disabled={verifyingBot || !botToken}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 text-xs font-semibold shrink-0 flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${verifyingBot ? "animate-spin text-sky-400" : ""}`} />
                <span>{verifyingBot ? "Checking..." : "Verify Token"}</span>
              </button>
            </div>
            {botInfo && (
              <div
                className={`mt-2 p-3 rounded-xl text-xs ${
                  botInfo.success
                    ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                    : "bg-amber-950/60 text-amber-200 border border-amber-500/40"
                }`}
              >
                <div className="flex items-start gap-2">
                  {botInfo.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-2">
                    <p className="font-semibold">{botInfo.message}</p>
                    {!botInfo.success && (
                      <div className="pt-2 border-t border-amber-500/20 text-[11px] text-amber-300/90 space-y-1.5">
                        <p>
                          <strong>Why Telegram returned Unauthorized:</strong> Telegram bot tokens are strictly case-sensitive. If you tapped <em>"Revoke current token"</em> or re-created the bot in @BotFather, older tokens are immediately disabled.
                        </p>
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <a
                            href="https://t.me/BotFather"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 text-[11px] font-medium transition"
                          >
                            Open @BotFather
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          <button
                            type="button"
                            onClick={handleFocusToPaste}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/30 text-[11px] font-medium transition"
                          >
                            <Clipboard className="w-3 h-3" />
                            Focus Field to Paste (Ctrl+V)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-300">Telegram Chat ID:</label>
              <div className="flex items-center gap-1 text-[10px] text-slate-400">
                <span>Numeric User ID •</span>
                <a
                  href="https://t.me/userinfobot"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-400 hover:text-sky-300 underline decoration-dotted flex items-center gap-0.5"
                  title="Send any message to @userinfobot to see your numeric Chat ID"
                >
                  Get ID via @userinfobot
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={chatId}
                onChange={(e) => {
                  setChatId(e.target.value.trim());
                  setDetectResult(null);
                }}
                placeholder="e.g. 987654321"
                className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-750 text-white text-xs font-mono focus:outline-none focus:border-sky-500"
              />
              <button
                type="button"
                onClick={handleDetectChatId}
                disabled={detectingChat || !botToken}
                className="px-3 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 text-xs font-semibold shrink-0 flex items-center gap-1.5 transition disabled:opacity-50"
                title="Detect Chat ID from /start message you sent"
              >
                <Send className={`w-3.5 h-3.5 ${detectingChat ? "animate-spin" : ""}`} />
                <span>{detectingChat ? "Reading..." : "Auto-Detect Chat ID"}</span>
              </button>
            </div>
            {detectResult && (
              <div
                className={`mt-2 p-3 rounded-xl text-xs ${
                  detectResult.success
                    ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                    : "bg-rose-950/60 text-rose-200 border border-rose-500/40"
                }`}
              >
                <div className="flex items-start gap-2">
                  {detectResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold">{detectResult.message}</p>
                    {!detectResult.success && (
                      <p className="text-[11px] text-rose-300/80">
                        💡 <strong>Quick alternative:</strong> Open{" "}
                        <a
                          href="https://t.me/userinfobot"
                          target="_blank"
                          rel="noreferrer"
                          className="text-white underline font-medium"
                        >
                          @userinfobot
                        </a>{" "}
                        in Telegram, tap Start, copy the number next to <code>Id:</code>, and paste it in the box above!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Connect Guide */}
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-750 text-slate-300 text-xs space-y-1.5">
            <div className="font-semibold text-sky-300 flex items-center gap-1.5">
              <span>Quick 2-Step Telegram Sync:</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-400">
              <li>
                In Telegram, open <strong className="text-white">@BotFather</strong> &rarr; send <code className="text-sky-300 bg-slate-800 px-1 py-0.5 rounded">/mybots</code> &rarr; select <strong className="text-white">@JobpulseAlert16bot</strong> &rarr; tap <strong className="text-white">API Token</strong> to copy the token.
              </li>
              <li>
                Paste the token above &rarr; Click <strong className="text-sky-300">Auto-Detect Chat ID</strong> (it pulls your ID from the <code className="text-slate-300">/start</code> message you sent!) &rarr; tap <strong className="text-white">Send Test Telegram Message</strong>.
              </li>
            </ol>
          </div>

          <div className="pt-1 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleTestTelegram}
              disabled={testing || !botToken || !chatId}
              className="flex-1 py-2.5 rounded-xl bg-sky-600/25 hover:bg-sky-600/40 text-sky-200 border border-sky-500/40 text-xs font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
              <span>{testing ? "Dispatching Test..." : "Send Test Telegram Message"}</span>
            </button>
            {onTestInAppNotification && (
              <button
                type="button"
                onClick={onTestInAppNotification}
                className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition shrink-0"
                title="Trigger a desktop popup alert to preview how notifications look and sound"
              >
                <Bell className="w-3.5 h-3.5 text-amber-400" />
                <span>Test Desktop Toast</span>
              </button>
            )}
          </div>

          {testResult && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${
                testResult.success
                  ? "bg-emerald-950/40 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-950/40 text-rose-300 border border-rose-500/30"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="leading-snug">
                <strong className="block">{testResult.success ? "Success" : "Notice"}</strong>
                <span>{testResult.message}</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow transition"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
