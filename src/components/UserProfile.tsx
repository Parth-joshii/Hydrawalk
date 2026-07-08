import React, { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { getReminderLogsForRange } from "../services/db";
import { ShieldAlert, Award, Calendar, Weight, Clock, Pencil, X, Save } from "lucide-react";
import { BADGES, Badge } from "./AchievementsList";

import { RecoloredCharacter } from "./RecoloredCharacter";

export const UserProfile: React.FC = () => {
  const { user, todayIntake, achievements, updateProfile } = useApp();
  const [lifetimeStats, setLifetimeStats] = useState({
    totalCount: 0,
    completed: 0,
    overdue: 0,
    skipped: 0,
  });

  // Edit modal state
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAge, setEditAge] = useState(20);
  const [editWeight, setEditWeight] = useState(60);
  const [editGoal, setEditGoal] = useState(2500);
  const [editGender, setEditGender] = useState("Female");
  const [editWake, setEditWake] = useState("07:00");
  const [editSleep, setEditSleep] = useState("23:00");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadLifetimeReminders() {
      const logs = await getReminderLogsForRange(365);
      const stats = { totalCount: logs.length, completed: 0, overdue: 0, skipped: 0 };
      logs.forEach((log) => {
        if (log.status === "Completed") stats.completed++;
        else if (log.status === "Overdue") stats.overdue++;
        else if (log.status === "Skipped") stats.skipped++;
      });
      setLifetimeStats(stats);
    }
    loadLifetimeReminders();
  }, []);

  // Pre-fill edit form when modal opens
  const openEdit = () => {
    if (!user) return;
    setEditName(user.name || "");
    setEditAge(user.age || 20);
    setEditWeight(user.weight || 60);
    setEditGoal(user.daily_goal || 2500);
    setEditGender(user.gender || "Female");
    setEditWake(user.wake_time || "07:00");
    setEditSleep(user.sleep_time || "23:00");
    setShowEdit(true);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile({
        ...user,
        name: editName,
        age: editAge,
        weight: editWeight,
        daily_goal: editGoal,
        gender: editGender,
        wake_time: editWake,
        sleep_time: editSleep,
      });
      setShowEdit(false);
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const complianceRate =
    lifetimeStats.totalCount > 0
      ? Math.round(
          (lifetimeStats.completed /
            (lifetimeStats.completed + lifetimeStats.overdue + lifetimeStats.skipped)) *
            100
        )
      : 100;

  const memberSinceDate = new Date(user.member_since).toLocaleDateString([], {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">

      {/* Top Banner Profile Summary */}
      <div className="p-8 glass-card rounded-2xl flex flex-col sm:flex-row items-center gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none" />

        {/* Anime Girl Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-28 h-28 rounded-full border-2 border-indigo-500/40 shadow-xl overflow-hidden bg-gradient-to-br from-indigo-900/40 to-purple-900/30 flex items-end justify-center pt-2">
            <RecoloredCharacter gender={user.gender} outfit={user.character_outfit} scale={0.7} />
          </div>
          {/* Online dot */}
          <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-900 shadow" />
        </div>

        {/* Text + Edit Button */}
        <div className="text-center sm:text-left space-y-1 flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-3">
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">{user.name}</h1>
            <button
              onClick={openEdit}
              title="Edit Profile"
              className="p-2 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-600/40 hover:text-indigo-300 transition-all cursor-pointer"
            >
              <Pencil size={14} />
            </button>
          </div>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-1.5">
            <span className="px-3 py-1 bg-slate-100/50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" /> Age {user.age}
            </span>
            <span className="px-3 py-1 bg-slate-100/50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-lg text-xs font-semibold text-slate-650 dark:text-slate-300 flex items-center gap-1">
              <Clock size={12} className="text-slate-400" /> Member since {memberSinceDate}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Health Metrics + Reminders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Body Metrics */}
        <div className="p-6 glass-card rounded-2xl flex flex-col justify-between">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Weight size={18} className="text-blue-500" /> Body Metrics
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-100/40 dark:bg-slate-800/40 rounded-xl border border-slate-250/20 dark:border-slate-700/10">
              <span className="text-sm text-slate-500 dark:text-slate-400">Recorded Weight</span>
              <span className="text-sm font-bold text-slate-800 dark:text-white">{user.weight} kg</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-slate-100/40 dark:bg-slate-800/40 rounded-xl border border-slate-250/20 dark:border-slate-700/10">
              <span className="text-sm text-slate-500 dark:text-slate-400">Daily Hydration Target</span>
              <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{user.daily_goal} ml / day</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-slate-100/40 dark:bg-slate-800/40 rounded-xl border border-slate-250/20 dark:border-slate-700/10">
              <span className="text-sm text-slate-500 dark:text-slate-400">Waking Schedule</span>
              <span className="text-sm font-bold text-slate-800 dark:text-white">{user.wake_time} - {user.sleep_time}</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-slate-100/40 dark:bg-slate-800/40 rounded-xl border border-slate-250/20 dark:border-slate-700/10">
              <span className="text-sm text-slate-500 dark:text-slate-400">Current Intake Today</span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{todayIntake} ml</span>
            </div>
          </div>
        </div>

        {/* Lifetime Reminders */}
        <div className="p-6 glass-card rounded-2xl flex flex-col justify-between border-l-4 border-emerald-500">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-emerald-555" /> Lifetime Reminders
            </h2>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-slate-100/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200/40 dark:border-slate-700/20">
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Completions</span>
                <span className="text-2xl font-black text-slate-800 dark:text-white">{lifetimeStats.completed}</span>
              </div>
              <div className="bg-slate-100/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200/40 dark:border-slate-700/20">
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Skips</span>
                <span className="text-2xl font-black text-slate-655 dark:text-slate-400">{lifetimeStats.skipped}</span>
              </div>
              <div className="bg-slate-100/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200/40 dark:border-slate-700/20">
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Overdues</span>
                <span className="text-2xl font-black text-red-600 dark:text-red-400">{lifetimeStats.overdue}</span>
              </div>
              <div className="bg-slate-100/50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-200/40 dark:border-slate-700/20">
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Compliance</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{complianceRate}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Badges Preview */}
      <div className="p-6 glass-card rounded-2xl">
        <h2 className="text-lg font-bold text-slate-805 dark:text-white mb-4 flex items-center gap-2">
          <Award size={18} className="text-amber-500" /> Unlocked Badges Preview
        </h2>
        {achievements.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-slate-500 text-xs font-medium">
            Start logging your drinks to unlock your first trophy.
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {BADGES.map((badge: Badge) => {
              const isUnlocked = achievements.includes(badge.id);
              if (!isUnlocked) return null;
              return (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-100/50 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 rounded-xl"
                  title={badge.desc}
                >
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-xs font-bold text-slate-800 dark:text-white">{badge.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ---- Edit Profile Modal ---- */}
      {showEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowEdit(false)}
          />

          {/* Modal Card */}
          <div className="relative w-full max-w-md glass-panel rounded-3xl p-7 shadow-2xl z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Pencil size={16} className="text-indigo-400" /> Edit Profile
              </h2>
              <button
                onClick={() => setShowEdit(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Avatar preview in modal */}
            <div className="flex justify-center mb-5">
              <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-900/40 to-purple-900/30 flex items-end justify-center pt-2">
                <RecoloredCharacter gender={editGender} outfit={user.character_outfit} scale={0.5} />
              </div>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Full Name</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white font-semibold focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Gender</label>
                <select
                  value={editGender}
                  onChange={(e) => setEditGender(e.target.value)}
                  className="w-full py-2.5 px-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white font-semibold focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Age & Weight row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Age</label>
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={editAge}
                    onChange={(e) => setEditAge(Number(e.target.value))}
                    className="w-full py-2.5 px-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white font-semibold focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    min={20}
                    max={300}
                    value={editWeight}
                    onChange={(e) => setEditWeight(Number(e.target.value))}
                    className="w-full py-2.5 px-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white font-semibold focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Daily Goal */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Daily Goal (ml)</label>
                <input
                  type="number"
                  min={500}
                  max={6000}
                  step={100}
                  value={editGoal}
                  onChange={(e) => setEditGoal(Number(e.target.value))}
                  className="w-full py-2.5 px-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white font-semibold focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              {/* Wake / Sleep */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Wake Time</label>
                  <input
                    type="time"
                    value={editWake}
                    onChange={(e) => setEditWake(e.target.value)}
                    className="w-full py-2.5 px-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white font-semibold focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sleep Time</label>
                  <input
                    type="time"
                    value={editSleep}
                    onChange={(e) => setEditSleep(e.target.value)}
                    className="w-full py-2.5 px-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-sm text-white font-semibold focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-6 w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-500/20"
            >
              {saving ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <Save size={14} /> Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
