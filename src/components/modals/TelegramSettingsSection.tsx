import React, { useState, useRef } from 'react';
import { Send, CheckCircle2, AlertCircle, RefreshCw, Key, Copy, Check } from 'lucide-react';
import { api } from '../../utils/api';

interface TelegramSettingsSectionProps {
  botToken: string;
  chatId: string;
  onChangeToken: (token: string) => void;
  onChangeChatId: (chatId: string) => void;
  onTestInAppNotification?: () => void;
}

export const TelegramSettingsSection: React.FC<TelegramSettingsSectionProps> = ({
  botToken,
  chatId,
  onChangeToken,
  onChangeChatId,
  onTestInAppNotification,
}) => {
  const tokenInputRef = useRef<HTMLInputElement>(null);
  const [verifyingBot, setVerifyingBot] = useState(false);
  const [botInfo, setBotInfo] = useState<{ success: boolean; message: string; username?: string } | null>(null);
  const [detectingChat, setDetectingChat] = useState(false);
  const [detectResult, setDetectResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  const handleVerifyBot = async () => {
    if (!botToken.trim()) return;
    setVerifyingBot(true);
    setBotInfo(null);
    try {
      const res = await api.saveAlertConfig({ telegram_bot_token: botToken });
      // Verify bot call
      const verifyRes = await fetch('/api/alerts/telegram/verify-bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botToken }),
      });
      const data = await verifyRes.json();
      setBotInfo(data);
    } catch (err: any) {
      setBotInfo({ success: false, message: err.message || 'Connection check failed.' });
    } finally {
      setVerifyingBot(false);
    }
  };

  const handleDetectChat = async () => {
    if (!botToken.trim()) return;
    setDetectingChat(true);
    setDetectResult(null);
    try {
      const res = await fetch('/api/alerts/telegram/detect-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: botToken }),
      });
      const data = await res.json();
      setDetectResult(data);
      if (data.chat_id) {
        onChangeChatId(String(data.chat_id));
      }
    } catch (err: any) {
      setDetectResult({ success: false, message: err.message || 'Detection failed.' });
    } finally {
      setDetectingChat(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!botToken || !chatId) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/alerts/telegram/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bot_token: botToken, chat_id: chatId }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Test send failed.' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Send className="w-4 h-4 text-sky-400" />
            Telegram Bot Dispatch Channel
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Receive instant notifications on Telegram when a match exceeds your score threshold.
          </p>
        </div>
      </div>

      <div className="space-y-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Bot Token (from @BotFather)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                ref={tokenInputRef}
                type="text"
                value={botToken}
                onChange={(e) => onChangeToken(e.target.value)}
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
            <button
              onClick={handleVerifyBot}
              disabled={verifyingBot || !botToken.trim()}
              className="px-3 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
            >
              {verifyingBot ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Verify
            </button>
          </div>
          {botInfo && (
            <p className={`text-xs mt-1.5 flex items-center gap-1 ${botInfo.success ? 'text-emerald-400' : 'text-rose-400'}`}>
              {botInfo.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {botInfo.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Chat ID / User ID
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={chatId}
              onChange={(e) => onChangeChatId(e.target.value)}
              placeholder="e.g. 987654321"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
            />
            <button
              onClick={handleDetectChat}
              disabled={detectingChat || !botToken.trim()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
            >
              {detectingChat ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              Auto-Detect
            </button>
          </div>
          {detectResult && (
            <p className={`text-xs mt-1.5 flex items-center gap-1 ${detectResult.success ? 'text-emerald-400' : 'text-amber-400'}`}>
              {detectResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              {detectResult.message}
            </p>
          )}
        </div>

        <div className="pt-2 flex items-center gap-3">
          <button
            onClick={handleSendTestMessage}
            disabled={testing || !botToken || !chatId}
            className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-300 border border-sky-500/30 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-40 cursor-pointer"
          >
            {testing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            Send Test Alert
          </button>
          {onTestInAppNotification && (
            <button
              onClick={onTestInAppNotification}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              Test In-App Toast
            </button>
          )}
        </div>
        {testResult && (
          <p className={`text-xs flex items-center gap-1 ${testResult.success ? 'text-emerald-400' : 'text-rose-400'}`}>
            {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {testResult.message}
          </p>
        )}
      </div>
    </div>
  );
};
