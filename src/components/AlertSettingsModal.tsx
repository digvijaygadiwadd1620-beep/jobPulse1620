import React, { useState, useEffect } from 'react';
import { AlertConfig } from '../types';
import { X, Send } from 'lucide-react';
import { TelegramSettingsSection } from './modals/TelegramSettingsSection';
import { AdzunaSettingsSection } from './modals/AdzunaSettingsSection';
import { ScannerThresholdSection } from './modals/ScannerThresholdSection';

interface AlertSettingsModalProps {
  config: AlertConfig | null;
  onSaveConfig: (updated: Partial<AlertConfig>) => void;
  onTestInAppNotification?: () => void;
  onClose: () => void;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  config,
  onSaveConfig,
  onTestInAppNotification,
  onClose,
}) => {
  const [botToken, setBotToken] = useState<string>(config?.telegram_bot_token || '');
  const [chatId, setChatId] = useState<string>(config?.telegram_chat_id || '');
  const [minScore, setMinScore] = useState<number>(config?.min_score_alert || 80);
  const [interval, setInterval] = useState<number>(config?.scan_interval_minutes || 5);
  const [autoScan, setAutoScan] = useState<boolean>(config?.auto_scan_enabled === 1);
  const [desktopNotif, setDesktopNotif] = useState<boolean>(config?.desktop_notifications === 1);
  const [adzunaAppId, setAdzunaAppId] = useState<string>(config?.adzuna_app_id || '');
  const [adzunaAppKey, setAdzunaAppKey] = useState<string>(config?.adzuna_app_key || '');

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

  const handleSave = () => {
    onSaveConfig({
      telegram_bot_token: botToken,
      telegram_chat_id: chatId,
      min_score_alert: minScore,
      scan_interval_minutes: interval,
      auto_scan_enabled: autoScan ? 1 : 0,
      desktop_notifications: desktopNotif ? 1 : 0,
      adzuna_app_id: adzunaAppId,
      adzuna_app_key: adzunaAppKey,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-750 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                <Send className="w-3 h-3" />
                Alerts & Dispatch Center
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Agent & API Integration Settings
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure job feed APIs (Adzuna), match thresholds, and Telegram alerts.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Sections */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1">
          {/* Scanner Thresholds */}
          <ScannerThresholdSection
            minScore={minScore}
            interval={interval}
            autoScan={autoScan}
            desktopNotif={desktopNotif}
            onChangeMinScore={setMinScore}
            onChangeInterval={setInterval}
            onChangeAutoScan={setAutoScan}
            onChangeDesktopNotif={setDesktopNotif}
          />

          {/* Adzuna Live Job Feed */}
          <AdzunaSettingsSection
            appId={adzunaAppId}
            appKey={adzunaAppKey}
            onChangeAppId={setAdzunaAppId}
            onChangeAppKey={setAdzunaAppKey}
          />

          {/* Telegram Alerts */}
          <TelegramSettingsSection
            botToken={botToken}
            chatId={chatId}
            onChangeToken={setBotToken}
            onChangeChatId={setChatId}
            onTestInAppNotification={onTestInAppNotification}
          />
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold transition shadow-md cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
