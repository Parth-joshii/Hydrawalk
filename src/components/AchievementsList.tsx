import React from "react";
import { useApp } from "../contexts/AppContext";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Lock, Star } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  color: string; // Tailwind class
  glowColor: string; // Shadow hex color
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

  const activeNotifBadge = BADGES.find((b) => b.id === achievementNotif);

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Achievements</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Unlock achievements by establishing healthy hydration routines.
          </p>
        </div>
        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300">
          {achievements.length} / {BADGES.length} Badges Unlocked
        </div>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {BADGES.map((badge) => {
          const isUnlocked = achievements.includes(badge.id);

          return (
            <motion.div
              key={badge.id}
              whileHover={isUnlocked ? { scale: 1.03 } : {}}
              className={`p-6 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-300 ${
                isUnlocked
                  ? "bg-white dark:bg-[#1e1e1f] border border-[#e3e3e3] dark:border-[#2e2e2f] cursor-pointer shadow-lg"
                  : "bg-white/40 dark:bg-[#1e1e1f]/45 border border-[#e3e3e3]/50 dark:border-[#2e2e2f]/50 opacity-60"
              }`}
              style={{
                boxShadow: isUnlocked ? `0 10px 30px -10px ${badge.glowColor}` : "none",
              }}
            >
              {/* Badge Icon Emblem */}
              <div
                className={`w-16 h-16 rounded-full bg-gradient-to-tr ${
                  isUnlocked ? badge.color : "from-slate-200 dark:from-slate-800 to-slate-300 dark:to-slate-900"
                } flex items-center justify-center text-3xl shadow-inner mb-4 relative`}
              >
                {badge.icon}
                {!isUnlocked && (
                  <div className="absolute inset-0 bg-slate-300/40 dark:bg-slate-950/70 rounded-full flex items-center justify-center">
                    <Lock size={16} className="text-slate-650 dark:text-slate-500" />
                  </div>
                )}
              </div>

              {/* Title & Desc */}
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-1.5">{badge.name}</h3>
              <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed max-w-[150px]">
                {badge.desc}
              </p>

              {/* Unlock Date / Status */}
              <div className="mt-4 flex items-center gap-1">
                {isUnlocked ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 uppercase tracking-wider">
                    <CheckCircle2 size={10} /> Unlocked
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                    Locked
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
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
