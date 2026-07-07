import React, { useState } from "react";
import { useApp } from "../contexts/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Lock, Star, Trophy, Award, Sparkles, SlidersHorizontal } from "lucide-react";
export interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string;
  glowColor: string;
}

export const BADGES: Badge[] = [
  {
    id: "first_drink",
    name: "First Splash",
    desc: "Logged your first cup of water.",
    icon: "💧",
    color: "from-blue-400 to-sky-500",
    glowColor: "rgba(56, 189, 248, 0.4)",
  },
  {
    id: "streak_7",
    name: "Week on Fire",
    desc: "Maintained a 7-day hydration streak.",
    icon: "🔥",
    color: "from-orange-400 to-red-500",
    glowColor: "rgba(249, 115, 22, 0.4)",
  },
  {
    id: "streak_30",
    name: "Month of Floods",
    desc: "Maintained a 30-day hydration streak.",
    icon: "🌊",
    color: "from-indigo-400 to-blue-600",
    glowColor: "rgba(79, 70, 229, 0.4)",
  },
  {
    id: "early_bird",
    name: "Early Riser",
    desc: "Logged a drink before 8:00 AM.",
    icon: "🌅",
    color: "from-yellow-400 to-amber-500",
    glowColor: "rgba(245, 158, 11, 0.4)",
  },
  {
    id: "night_owl",
    name: "Midnight Sip",
    desc: "Logged a drink after 10:00 PM.",
    icon: "🦉",
    color: "from-purple-400 to-indigo-700",
    glowColor: "rgba(124, 58, 237, 0.4)",
  },
  {
    id: "perfect_week",
    name: "Perfect 7",
    desc: "Completed your daily goal 7 days in a row.",
    icon: "🏆",
    color: "from-emerald-400 to-teal-500",
    glowColor: "rgba(16, 185, 129, 0.4)",
  },
  {
    id: "perfect_month",
    name: "Flawless Month",
    desc: "Completed your daily goal 30 days in a row.",
    icon: "👑",
    color: "from-pink-400 to-rose-600",
    glowColor: "rgba(244, 63, 94, 0.4)",
  },
  {
    id: "drinks_100",
    name: "Hydro Legend",
    desc: "Logged 100 cups of water.",
    icon: "🛡️",
    color: "from-cyan-400 to-teal-600",
    glowColor: "rgba(6, 182, 212, 0.4)",
  },
  {
    id: "drinks_500",
    name: "Aquatic Master",
    desc: "Logged 500 cups of water.",
    icon: "🔮",
    color: "from-fuchsia-400 to-purple-600",
    glowColor: "rgba(217, 70, 239, 0.4)",
  },
  {
    id: "drinks_1000",
    name: "Hydra Lord",
    desc: "Logged 1,000 cups of water.",
    icon: "🌌",
    color: "from-violet-500 to-indigo-950",
    glowColor: "rgba(139, 92, 246, 0.4)",
  },
];

export const AchievementsList: React.FC = () => {
  const { achievements, achievementNotif, dismissAchievement } = useApp();
  const [filter, setFilter] = useState<"all" | "unlocked" | "locked">("all");

  const activeNotifBadge = BADGES.find((b: Badge) => b.id === achievementNotif);

  // Statistics calculation
  const totalBadges = BADGES.length;
  const unlockedCount = achievements.length;
  const lockedCount = totalBadges - unlockedCount;
  const progressPercent = Math.round((unlockedCount / totalBadges) * 105) > 100 
    ? Math.round((unlockedCount / totalBadges) * 100) 
    : Math.round((unlockedCount / totalBadges) * 100);

  // Filtered badges
  const filteredBadges = BADGES.filter((badge: Badge) => {
    const isUnlocked = achievements.includes(badge.id);
    if (filter === "unlocked") return isUnlocked;
    if (filter === "locked") return !isUnlocked;
    return true;
  });

  return (
    <div className="space-y-8">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-2">
            <Trophy className="text-amber-500 animate-pulse" size={28} /> HydraRoom Badges
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build consistent hydration habits and lock in legendary milestones.
          </p>
        </div>
      </div>

      {/* Premium Hydration Progress Summary Card */}
      <div className="p-6 md:p-8 glass-card rounded-3xl relative overflow-hidden border border-[#e3e3e3] dark:border-slate-800/80 shadow-xl">
        {/* Colorful background radial glows */}
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-purple-500/10 rounded-full filter blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-3 text-center lg:text-left flex-1">
            <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-bold text-amber-500 flex items-center gap-1.5 w-fit mx-auto lg:mx-0">
              <Sparkles size={12} className="animate-pulse" /> Hydration Mastery
            </span>
            <h2 className="text-2xl font-black text-slate-800 dark:text-white">
              {progressPercent === 100 
                ? "👑 Ultimate Hydra King!" 
                : progressPercent >= 60 
                ? "✨ Elite Water Master" 
                : progressPercent >= 30 
                ? "🥤 Solid Progress" 
                : "🌱 Early Hydration Explorer"}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed">
              Every glass of water builds a healthier routine. Complete all milestones to attain absolute hydration perfection.
            </p>
          </div>

          {/* Graphical Progress circle or bar metrics */}
          <div className="flex flex-col items-center lg:items-end justify-center gap-2 w-full lg:w-fit min-w-[200px]">
            <div className="flex justify-between items-baseline w-full text-xs font-bold text-slate-500 dark:text-slate-450">
              <span>Overall Progress</span>
              <span className="text-lg font-black text-slate-800 dark:text-white font-mono">{progressPercent}%</span>
            </div>
            
            {/* Animated Gradient Progress Bar */}
            <div className="w-full h-3 bg-slate-200 dark:bg-slate-800/80 rounded-full overflow-hidden border border-slate-300/30 dark:border-slate-700/30">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full"
              />
            </div>

            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 dark:text-slate-450 mt-1">
              <span className="flex items-center gap-1"><Award size={13} className="text-emerald-500" /> {unlockedCount} Unlocked</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Lock size={11} className="text-slate-400" /> {lockedCount} Locked</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs / Filtering Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900/60 p-1 rounded-xl border border-slate-200/50 dark:border-slate-850/50 w-full sm:w-auto">
          {[
            { id: "all", label: `All (${totalBadges})` },
            { id: "unlocked", label: `🏆 Unlocked (${unlockedCount})` },
            { id: "locked", label: `🔒 Locked (${lockedCount})` },
          ].map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? "bg-white dark:bg-[#1e1e1f] text-[#1a73e8] dark:text-[#8ab4f8] shadow-sm"
                    : "text-slate-600 dark:text-slate-450 hover:text-slate-800 dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        
        <div className="text-xs text-slate-450 font-semibold flex items-center gap-1">
          <SlidersHorizontal size={12} /> Filter applied
        </div>
      </div>

      {/* Badges Grid View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredBadges.map((badge) => {
            const isUnlocked = achievements.includes(badge.id);

            return (
              <motion.div
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                key={badge.id}
                whileHover={isUnlocked ? { y: -5, transition: { duration: 0.2 } } : {}}
                className={`p-6 rounded-3xl flex flex-col items-center justify-between text-center relative overflow-hidden transition-all duration-300 border ${
                  isUnlocked
                    ? "bg-gradient-to-br from-indigo-500/5 to-purple-500/5 dark:from-indigo-950/20 dark:to-purple-950/10 border-indigo-500/20 dark:border-indigo-500/10 cursor-pointer shadow-md hover:shadow-xl"
                    : "bg-slate-950/5 dark:bg-slate-900/10 border-slate-200/50 dark:border-slate-800/25 opacity-50"
                }`}
                style={{
                  boxShadow: isUnlocked ? `0 12px 30px -15px ${badge.glowColor}` : "none",
                }}
              >
                {/* Neon Glowing Border Layer for Unlocked ones */}
                {isUnlocked && (
                  <div className="absolute inset-0 border border-t-white/10 border-l-white/10 rounded-3xl pointer-events-none" />
                )}

                {/* Badge Icon Emblem */}
                <div
                  className={`w-20 h-20 rounded-2xl bg-gradient-to-tr ${
                    isUnlocked ? badge.color : "from-slate-200/60 dark:from-slate-800/80 to-slate-300/40 dark:to-slate-900/40"
                  } flex items-center justify-center text-4xl shadow-inner mb-5 relative ${
                    isUnlocked ? "animate-pulse-subtle" : ""
                  }`}
                  style={{
                    boxShadow: isUnlocked ? `0 8px 24px -6px ${badge.glowColor}` : "none"
                  }}
                >
                  {badge.icon}
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-slate-300/30 dark:bg-slate-950/60 rounded-2xl flex items-center justify-center">
                      <Lock size={18} className="text-slate-600 dark:text-slate-500" />
                    </div>
                  )}
                </div>

                {/* Title & Desc */}
                <div className="space-y-1.5 flex-1 flex flex-col justify-center mb-5">
                  <h3 className="text-sm font-black text-slate-850 dark:text-white leading-tight">
                    {badge.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-[170px] mx-auto">
                    {badge.desc}
                  </p>
                </div>

                {/* Unlock Status Button/Badge */}
                <div className="w-full pt-3 border-t border-slate-200/60 dark:border-slate-800/40">
                  {isUnlocked ? (
                    <span className="py-1 px-3 bg-emerald-500/10 rounded-full text-[10px] font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 uppercase tracking-widest mx-auto w-fit">
                      <CheckCircle2 size={10} /> Unlocked
                    </span>
                  ) : (
                    <span className="py-1 px-3 bg-slate-100 dark:bg-slate-800/60 rounded-full text-[10px] font-bold text-slate-500 dark:text-slate-450 flex items-center justify-center gap-1 uppercase tracking-widest mx-auto w-fit">
                      <Lock size={9} /> Locked
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Full Screen Celebration Overlay Modal */}
      <AnimatePresence>
        {achievementNotif && activeNotifBadge && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 dark:bg-slate-950/80 backdrop-filter backdrop-blur-md z-[9999] flex items-center justify-center p-6 select-none"
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25 } }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-white dark:bg-slate-900/90 border border-amber-500/30 p-8 rounded-3xl max-w-sm w-full text-center relative overflow-hidden shadow-2xl shadow-amber-500/10 text-slate-800 dark:text-white"
            >
              {/* Spinning background rays */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.08)_0%,transparent_70%)] pointer-events-none animate-pulse" />

              {/* Celebration Cup Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-5xl animate-bounce shadow-xl relative">
                  🏆
                  <motion.div
                    className="absolute -inset-2 rounded-full border border-amber-400/30"
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                </div>
              </div>

              <span className="text-xs font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 flex items-center justify-center gap-1.5 mb-1 animate-pulse">
                <Star size={12} fill="currentColor" /> Achievement Unlocked!
              </span>

              <h2 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight mb-3">
                {activeNotifBadge.name}
              </h2>

              <div
                className={`inline-block py-2.5 px-6 rounded-2xl bg-gradient-to-tr ${activeNotifBadge.color} text-4xl mb-4 shadow-inner`}
              >
                {activeNotifBadge.icon}
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed mb-6">
                {activeNotifBadge.desc}
              </p>

              <button
                onClick={dismissAchievement}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-900 dark:text-slate-950 font-bold rounded-xl cursor-pointer active:scale-95 transition-all shadow-lg shadow-amber-500/20"
              >
                Awesome, thank you!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
