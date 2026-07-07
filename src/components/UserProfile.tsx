import React, { useEffect, useState } from "react";
import { useApp } from "../contexts/AppContext";
import { getReminderLogsForRange } from "../services/db";
import { ShieldAlert, Award, Calendar, Weight, Clock, Compass } from "lucide-react";
import { BADGES } from "./AchievementsList";

export const UserProfile: React.FC = () => {
  const { user, todayIntake, achievements } = useApp();
  const [lifetimeStats, setLifetimeStats] = useState({
    totalCount: 0,
    completed: 0,
    overdue: 0,
    skipped: 0,
  });

  useEffect(() => {
    async function loadLifetimeReminders() {
      // Query 365 days of reminders to compute lifetime stats
      const logs = await getReminderLogsForRange(365);
      
      const stats = {
        totalCount: logs.length,
        completed: 0,
        overdue: 0,
        skipped: 0,
      };

      logs.forEach((log) => {
        if (log.status === "Completed") stats.completed++;
        else if (log.status === "Overdue") stats.overdue++;
        else if (log.status === "Skipped") stats.skipped++;
      });

      setLifetimeStats(stats);
    }
    loadLifetimeReminders();
  }, []);

  if (!user) return null;

  // Hydration rate math
  const complianceRate = lifetimeStats.totalCount > 0 
    ? Math.round((lifetimeStats.completed / (lifetimeStats.completed + lifetimeStats.overdue + lifetimeStats.skipped)) * 100) 
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
        {/* Soft radial background glow */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/5 rounded-full filter blur-3xl pointer-events-none" />

        {/* User Avatar */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 border border-blue-400/30 flex items-center justify-center text-4xl shadow-xl text-white select-none">
          {user.gender === "Female" ? "👧" : user.gender === "Male" ? "👦" : "🧑"}
        </div>

        {/* Text */}
        <div className="text-center sm:text-left space-y-1">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">{user.name}</h1>
          <div className="flex flex-wrap justify-center sm:justify-start gap-3 mt-1.5">
            <span className="px-3 py-1 bg-slate-800 border border-slate-700/50 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Compass size={12} className="text-slate-400" /> {user.gender}
            </span>
            <span className="px-3 py-1 bg-slate-800 border border-slate-700/50 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Calendar size={12} className="text-slate-400" /> Age {user.age}
            </span>
            <span className="px-3 py-1 bg-slate-800 border border-slate-700/50 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-1">
              <Clock size={12} className="text-slate-400" /> Member since {memberSinceDate}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Health Metrics Card & Reminders Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Column Left: Health stats table */}
        <div className="p-6 glass-card rounded-2xl flex flex-col justify-between">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Weight size={18} className="text-blue-400" /> Body Metrics
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/10">
              <span className="text-sm text-slate-400">Recorded Weight</span>
              <span className="text-sm font-bold text-white">{user.weight} kg</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/10">
              <span className="text-sm text-slate-400">Daily Hydration Target</span>
              <span className="text-sm font-bold text-blue-400">{user.daily_goal} ml / day</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/10">
              <span className="text-sm text-slate-400">Waking Schedule</span>
              <span className="text-sm font-bold text-white">{user.wake_time} - {user.sleep_time}</span>
            </div>
            <div className="flex items-center justify-between p-3.5 bg-slate-800/40 rounded-xl border border-slate-700/10">
              <span className="text-sm text-slate-400">Current Intake Today</span>
              <span className="text-sm font-bold text-emerald-400">{todayIntake} ml</span>
            </div>
          </div>
        </div>

        {/* Column Right: Lifetime Reminders stats */}
        <div className="p-6 glass-card rounded-2xl flex flex-col justify-between border-l-4 border-emerald-500">
          <div>
            <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <ShieldAlert size={18} className="text-emerald-400" /> Lifetime Reminders
            </h2>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="bg-slate-800/30 p-3 rounded-xl">
                <span className="block text-xs font-semibold text-slate-400">Completions</span>
                <span className="text-2xl font-black text-white">{lifetimeStats.completed}</span>
              </div>
              <div className="bg-slate-800/30 p-3 rounded-xl">
                <span className="block text-xs font-semibold text-slate-400">Skips</span>
                <span className="text-2xl font-black text-slate-400">{lifetimeStats.skipped}</span>
              </div>
              <div className="bg-slate-800/30 p-3 rounded-xl">
                <span className="block text-xs font-semibold text-slate-400">Overdues</span>
                <span className="text-2xl font-black text-red-400">{lifetimeStats.overdue}</span>
              </div>
              <div className="bg-slate-800/30 p-3 rounded-xl">
                <span className="block text-xs font-semibold text-slate-400">Compliance</span>
                <span className="text-2xl font-black text-emerald-400">{complianceRate}%</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Row Bottom: Badges mini-gallery preview */}
      <div className="p-6 glass-card rounded-2xl">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Award size={18} className="text-amber-500" /> Unlocked Badges Preview
        </h2>

        {achievements.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-slate-500 text-xs">
            Start logging your drinks to unlock your first trophy.
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {BADGES.map((badge) => {
              const isUnlocked = achievements.includes(badge.id);
              if (!isUnlocked) return null;

              return (
                <div
                  key={badge.id}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 border border-slate-700/50 rounded-xl"
                  title={badge.desc}
                >
                  <span className="text-xl">{badge.icon}</span>
                  <span className="text-xs font-bold text-white">{badge.name}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
