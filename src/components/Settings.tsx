import React, { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { resetAllUserData, exportDatabaseBackup, importDatabaseBackup } from "../services/db";
import { setAutostart } from "../services/autostart";
import { playReminderSound } from "../services/notifications";
import { Character } from "./Character";
import {
  Volume2,
  Moon,
  Sun,
  Trash2,
  Settings as SettingsIcon,
  FolderUp,
  FolderDown,
} from "lucide-react";

export const Settings: React.FC<{ onResetTimer?: () => Promise<void> }> = ({ onResetTimer }) => {
  const { user, theme, setThemeMode, setOutfit, updateProfile, refreshData } = useApp();
  const [backupText, setBackupText] = useState("");
  const [showBackupArea, setShowBackupArea] = useState<"export" | "import" | null>(null);
  const [successMsg, setSuccessMsg] = useState("");
  const [resetConfirm, setResetConfirm] = useState(false);
  const [customInterval, setCustomInterval] = useState<number | "">(
    user && ![30, 45, 60, 90, 120].includes(user.reminder_interval) ? user.reminder_interval : ""
  );

  if (!user) return null;

  const handleToggle = async (name: keyof typeof user) => {
    const nextValue = !user[name];
    const newProfile = { ...user, [name]: nextValue };
    
    // Autostart integration
    if (name === "startup_enabled") {
      try {
        await setAutostart(Boolean(nextValue));
      } catch (err) {
        console.error(err);
      }
    }

    await updateProfile(newProfile);
  };

  const handleIntervalChange = async (interval: number) => {
    const newProfile = { ...user, reminder_interval: interval };
    await updateProfile(newProfile);
    if ([30, 45, 60, 90, 120].includes(interval)) {
      setCustomInterval("");
    } else {
      setCustomInterval(interval);
    }
  };

  const handleVolumeChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    const newProfile = { ...user, sound_volume: vol };
    await updateProfile(newProfile);
  };

  const testVolume = () => {
    playReminderSound(user.sound_volume, false, user.custom_sound, user.alarm_tone || "default");
  };

  const handleToneChange = async (tone: string) => {
    const newProfile = { ...user, alarm_tone: tone };
    await updateProfile(newProfile);
    playReminderSound(user.sound_volume, false, user.custom_sound, tone);
  };

  const handleCustomSoundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert("Please choose an audio file smaller than 1.5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        const newProfile = { ...user, custom_sound: base64 };
        await updateProfile(newProfile);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetSound = async () => {
    const newProfile = { ...user, custom_sound: null };
    await updateProfile(newProfile);
  };

  const handleExport = async () => {
    try {
      const backup = await exportDatabaseBackup();
      setBackupText(backup);
      setShowBackupArea("export");
      navigator.clipboard.writeText(backup);
      showTemporaryMessage("Backup copied to clipboard!");
    } catch (err) {
      console.error(err);
    }
  };

  const handleImport = async () => {
    if (!backupText.trim()) return;
    try {
      await importDatabaseBackup(backupText);
      await refreshData();
      showTemporaryMessage("Backup imported successfully!");
      setShowBackupArea(null);
      setBackupText("");
    } catch (err) {
      alert("Failed to import backup. Please check that the data is valid.");
    }
  };

  const handleResetData = async () => {
    if (!resetConfirm) {
      setResetConfirm(true);
      return;
    }
    await resetAllUserData();
    await refreshData();
    setResetConfirm(false);
    showTemporaryMessage("All data cleared successfully.");
  };

  const showTemporaryMessage = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">System Settings</h1>
        <p className="text-sm text-slate-400 mt-1">
          Customize reminders, character visuals, and data options.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold animate-pulse">
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* General Settings */}
        <div className="p-6 glass-card rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <SettingsIcon size={18} className="text-blue-400" /> Reminder Preferences
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-2">
              Reminder Interval
            </label>
            <div className="grid grid-cols-5 gap-2">
              {[30, 45, 60, 90, 120].map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => handleIntervalChange(interval)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    user.reminder_interval === interval
                      ? "bg-blue-600 text-white shadow-md shadow-blue-500/15"
                      : "bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  {interval}m
                </button>
              ))}
            </div>

            {/* Custom Interval Option */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Or custom:</span>
                <div className="relative flex-1 max-w-[120px]">
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={customInterval || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setCustomInterval(isNaN(val) ? "" : val);
                      if (val > 0 && val <= 1440) {
                        handleIntervalChange(val);
                      }
                    }}
                    className="w-full pl-3 pr-8 py-1.5 bg-slate-850 dark:bg-slate-800/80 border border-slate-700/80 text-white font-bold rounded-xl text-xs focus:border-blue-500/70 focus:outline-none"
                    placeholder="Minutes"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-slate-405">
                    min
                  </span>
                </div>
              </div>

              {onResetTimer && (
                <button
                  type="button"
                  onClick={async () => {
                    await onResetTimer();
                    showTemporaryMessage("Reminder timer reset successfully!");
                  }}
                  className="px-3 py-1.5 bg-blue-650/10 hover:bg-blue-650/20 border border-blue-500/25 hover:border-blue-500/50 text-blue-400 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  title="Reset the active countdown timer back to the selected interval"
                >
                  ⚡ Reset Timer
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white block">Launch on Startup</span>
                <span className="text-xs text-slate-400">Launch HydraWalk when Windows boots.</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("startup_enabled")}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                  user.startup_enabled ? "bg-blue-500" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    user.startup_enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white block">Overlay Animations</span>
                <span className="text-xs text-slate-400">Show the walking girl on the desktop.</span>
              </div>
              <button
                type="button"
                onClick={() => handleToggle("overlay_enabled")}
                className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                  user.overlay_enabled ? "bg-blue-500" : "bg-slate-700"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                    user.overlay_enabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white block">Dark Mode</span>
                <span className="text-xs text-slate-400">Toggle application visual theme.</span>
              </div>
              <button
                type="button"
                onClick={() => setThemeMode(theme === "dark" ? "light" : "dark")}
                className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold rounded-lg text-slate-200 transition-all cursor-pointer"
              >
                {theme === "dark" ? <Moon size={12} /> : <Sun size={12} />}
                {theme === "dark" ? "Dark" : "Light"}
              </button>
            </div>
          </div>
        </div>

        {/* Sound settings */}
        <div className="p-6 glass-card rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
            <Volume2 size={18} className="text-blue-400" /> Audio & Sound
          </h2>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-semibold text-white block">Enable Audio Alerts</span>
              <span className="text-xs text-slate-400">Play a pleasant chime when reminding.</span>
            </div>
            <button
              type="button"
              onClick={() => handleToggle("sound_enabled")}
              className={`w-11 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                user.sound_enabled ? "bg-blue-500" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                  user.sound_enabled ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {user.sound_enabled && (
            <div className="space-y-4 pt-2">
              
              {/* Ringtone Selector */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase block">
                  Select Ringtone
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-2">
                  {[
                    { id: "default", label: "🔔 Classic Alarm" },
                    { id: "original", label: "💧 Original Chime" },
                    { id: "retro", label: "👾 Retro Arcade" },
                    { id: "zen", label: "🧘 Zen Bowl" },
                    { id: "bird", label: "🐦 Forest Bird" },
                    { id: "digital", label: "⚡ Sci-Fi Beep" },
                  ].map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => handleToneChange(tone.id)}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer border ${
                        (user.alarm_tone || "default") === tone.id
                          ? "bg-blue-500/10 border-blue-500 text-blue-400"
                          : "bg-slate-800 border-slate-700/60 text-slate-350 hover:border-slate-600"
                      }`}
                    >
                      <span>{tone.label}</span>
                      {(user.alarm_tone || "default") === tone.id && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-400 uppercase">Volume ({Math.round(user.sound_volume * 100)}%)</span>
                  <button
                    onClick={testVolume}
                    className="px-2.5 py-1 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-[10px] uppercase transition-all cursor-pointer"
                  >
                    Test Chime
                  </button>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={user.sound_volume}
                  onChange={handleVolumeChange}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Custom Sound Upload */}
              <div className="pt-4 border-t border-slate-800/60 space-y-2.5">
                <span className="text-xs font-semibold text-slate-405 uppercase block">
                  Alarm Sound Track
                </span>
                
                {user.custom_sound ? (
                  <div className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-indigo-550/20 rounded-xl">
                    <span className="text-xs text-indigo-400 font-bold flex items-center gap-1.5">
                      🎵 Custom sound active
                    </span>
                    <button
                      type="button"
                      onClick={handleResetSound}
                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 text-red-400 font-bold rounded-lg text-[10px] uppercase transition-all cursor-pointer"
                    >
                      Use Default
                    </button>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">
                    Currently playing: <span className="font-bold text-slate-400">alarm.mp3 (default)</span>
                  </div>
                )}

                <div className="relative">
                  <input
                    type="file"
                    id="custom-sound-file"
                    accept="audio/*"
                    onChange={handleCustomSoundUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="custom-sound-file"
                    className="w-full py-2.5 px-4 bg-slate-800 border border-slate-700/60 hover:bg-slate-700/80 text-slate-200 hover:text-white font-bold rounded-xl text-xs cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-98"
                  >
                    📁 Upload Custom Sound (.mp3, .wav)
                  </label>
                </div>
                <p className="text-[10px] text-slate-500 leading-normal">
                  Supported formats: MP3, WAV (Max 1.5MB). Your sound will sync securely to your cloud profile!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Character Visual Customization */}
        <div className="p-6 glass-card rounded-2xl space-y-4 md:col-span-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🚶‍♀️ Companion Character Visuals
          </h2>
          <p className="text-xs text-slate-400">
            Pick a character outfit that updates the desktop overlay and profile visuals.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-8 pt-2">
            {/* Live Character Preview */}
            <div className="w-40 h-48 bg-slate-950/20 border border-slate-800/40 rounded-2xl flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.05)_0%,transparent_80%)] pointer-events-none" />
              <Character state="idle" outfit={user.character_outfit} scale={1.1} gender={user.gender} />
            </div>

            {/* Customizer */}
            <div className="flex-1 space-y-4 w-full">
              <label className="block text-xs font-semibold text-slate-400 uppercase">
                Choose Hoodie Color
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: "hoodie_blue", label: "Sky Blue", color: "bg-blue-400" },
                  { id: "hoodie_pink", label: "Sweet Pink", color: "bg-pink-400" },
                  { id: "hoodie_dark", label: "Sleek Dark", color: "bg-slate-700" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setOutfit(item.id)}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 cursor-pointer transition-all ${
                      user.character_outfit === item.id
                        ? "bg-slate-800 border-blue-500 shadow-md shadow-blue-500/10"
                        : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full ${item.color} shadow-inner`} />
                    <span className="text-[10px] font-bold text-white">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Data & Backup */}
        <div className="p-6 glass-card rounded-2xl space-y-4 md:col-span-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🔒 Data Backup & Recovery
          </h2>
          <p className="text-xs text-slate-400">
            Export database metrics to share logs, or restore a prior backup.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={handleExport}
              className="px-4 py-2.5 bg-slate-800 border border-slate-750 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <FolderDown size={14} /> Export Backup
            </button>
            <button
              onClick={() => setShowBackupArea(showBackupArea === "import" ? null : "import")}
              className="px-4 py-2.5 bg-slate-800 border border-slate-750 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
            >
              <FolderUp size={14} /> Import Backup
            </button>
            <button
              onClick={handleResetData}
              className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-all ${
                resetConfirm
                  ? "bg-red-600 hover:bg-red-500 text-white"
                  : "bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20"
              }`}
            >
              <Trash2 size={14} /> {resetConfirm ? "Click Again to Confirm" : "Clear All Data"}
            </button>
          </div>

          {/* Backup Import/Export Textarea */}
          {showBackupArea && (
            <div className="pt-4 space-y-3">
              <label className="block text-xs font-semibold text-slate-400 uppercase">
                {showBackupArea === "export" ? "Copy Backup Key" : "Paste Backup Key"}
              </label>
              <textarea
                value={backupText}
                onChange={(e) => setBackupText(e.target.value)}
                placeholder="Paste backup JSON here..."
                readOnly={showBackupArea === "export"}
                className="w-full h-24 bg-slate-950/30 border border-slate-800 rounded-xl p-3 text-slate-300 text-xs font-mono focus:outline-none focus:border-blue-500"
              />
              {showBackupArea === "import" && (
                <button
                  onClick={handleImport}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Restore Database
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
