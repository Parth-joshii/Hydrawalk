import React, { useState, useEffect } from "react";
import { useApp } from "../contexts/AppContext";
import { motion } from "framer-motion";
import { Droplet, Award, Flame, Calendar, Clock, Sparkles, Smile, ThumbsUp, CloudSun, VolumeX } from "lucide-react";

interface DashboardProps {
  secondsRemaining: number;
  isPaused: boolean;
  overdueCount: number;
  onDrinkNow: () => void;
  onMute: () => void;
}

const MOTIVATIONAL_QUOTES = [
  "Water is life's matter and matrix, mother and medium. There is no life without water.",
  "Your body is about 60% water. Keep it replenished and stay energized!",
  "Stay hydrated, stay focused. A glass of water can boost your productivity by 14%.",
  "Don't wait until you're thirsty. Thirst is a sign that your body is already dehydrated.",
  "Hydration is key to healthy skin, sharp focus, and active joints. Keep drinking!",
  "Every drop counts. Fuel your body with the hydration it deserves.",
  "Drink water. Look good, feel good, work well.",
];

export const Dashboard: React.FC<DashboardProps> = ({
  secondsRemaining,
  isPaused,
  overdueCount,
  onDrinkNow,
  onMute,
}) => {
  const { user, todayIntake, streak, todayLogs, addWater } = useApp();
  const [greeting, setGreeting] = useState("");
  const [quote, setQuote] = useState("");
  const [completedReminders, setCompletedReminders] = useState(0);
  const [snoozedCount] = useState(0);

  // Load random quote & setup greeting
  useEffect(() => {
    const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
    setQuote(randomQuote);

    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Good Morning");
    else if (hours < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");
  }, []);

  // Calculate reminder counts from today's logs
  useEffect(() => {
    // We count how many 250ml logs exist as completed reminders (for simplicity)
    const completed = todayLogs.length;
    setCompletedReminders(completed);
  }, [todayLogs]);

  if (!user) return null;

  // Hydration math
  const progressPercent = Math.min(100, Math.round((todayIntake / user.daily_goal) * 100));
  const remainingWater = Math.max(0, user.daily_goal - todayIntake);

  // SVG Circle calculations
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  // Format timer
  const formatTimer = (sec: number) => {
    if (isPaused) return "Paused";
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${h > 0 ? h + "h " : ""}${m.toString().padStart(2, "0")}m ${s
      .toString()
      .padStart(2, "0")}s`;
  };

  // Weather-based suggestions (July = Summer/Monsoon)
  const getWeatherHydrationAdvice = () => {
    const month = new Date().getMonth(); // 0-11
    if (month >= 5 && month <= 8) {
      return {
        tip: "Summer Heat Wave",
        advice: "Temperatures are high. Your body loses fluids faster. We recommend adding 400ml to your daily goal.",
        icon: "☀️",
      };
    } else if (month >= 11 || month <= 1) {
      return {
        tip: "Dry Winter Air",
        advice: "Winter air is dry and cold. You might not feel thirsty, but hydration is still critical. Sip warm water.",
        icon: "❄️",
      };
    } else {
      return {
        tip: "Mild Pleasant Weather",
        advice: "Perfect day for active habits. Maintain your standard goal of 35ml per kg.",
        icon: "⛅",
      };
    }
  };

  const weatherAdvice = getWeatherHydrationAdvice();

  // Hydration compliance score
  const getHydrationScore = () => {
    const total = completedReminders + overdueCount;
    if (total === 0) return { label: "Excellent", color: "text-emerald-400" };
    const rate = completedReminders / total;
    if (rate >= 0.8) return { label: "Excellent", color: "text-emerald-400" };
    if (rate >= 0.6) return { label: "Good", color: "text-blue-400" };
    if (rate >= 0.4) return { label: "Average", color: "text-amber-400" };
    return { label: "Poor", color: "text-red-400" };
  };

  const score = getHydrationScore();

  return (
    <div className="space-y-6">
      {/* Top Greeting Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 glass-card rounded-2xl">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            {greeting}, <span className="gemini-text-gradient font-black">{user.name}</span>!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Sparkles size={14} className="text-[#a87ffb] animate-pulse" />
            "{quote}"
          </p>
        </div>
        <button
          onClick={onDrinkNow}
          className="self-start md:self-auto px-5 py-3 bg-gradient-to-r from-[#1a73e8] via-[#a87ffb] to-[#f472b6] text-white font-bold rounded-xl active:scale-95 transition-all cursor-pointer flex items-center gap-2 hover:opacity-90 shadow-md shadow-purple-500/10"
        >
          <Droplet size={18} /> Drink Water Now
        </button>
      </div>

      {/* Grid Layout: Circle Progress & Key Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Card: Circular Ring Progress */}
        <div className="lg:col-span-1 p-6 glass-card rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            Today's Hydration
          </h2>

          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* SVG Progress Circle */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
              <defs>
                <linearGradient id="geminiProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1a73e8" />
                  <stop offset="50%" stopColor="#a87ffb" />
                  <stop offset="100%" stopColor="#f472b6" />
                </linearGradient>
              </defs>
              <circle
                cx="100"
                cy="100"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800/60"
                strokeWidth="14"
                fill="transparent"
              />
              <motion.circle
                cx="100"
                cy="100"
                r={radius}
                stroke="url(#geminiProgressGradient)"
                strokeWidth="14"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-extrabold text-slate-800 dark:text-white">
                {progressPercent}%
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">
                Completed
              </span>
            </div>
          </div>

          <div className="w-full grid grid-cols-2 gap-4 mt-6 border-t border-slate-200/50 dark:border-slate-800/50 pt-4">
            <div className="text-center">
              <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Goal</span>
              <span className="text-lg font-bold text-slate-800 dark:text-white">{user.daily_goal} ml</span>
            </div>
            <div className="text-center border-l border-slate-200/50 dark:border-slate-800/50">
              <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Remaining</span>
              <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{remainingWater} ml</span>
            </div>
          </div>
        </div>

        {/* Center Card: Countdown and Streak Info */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card: Timer & Countdown */}
          <div className="p-6 glass-card rounded-2xl flex flex-col justify-between border-l-4 border-indigo-500">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Clock size={14} /> Upcoming Reminder
                </span>
                {isPaused && (
                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[10px] font-bold rounded-full">
                    PAUSED
                  </span>
                )}
              </div>
              <h3 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight font-mono">
                {formatTimer(secondsRemaining)}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                The desktop character walks when this hits zero.
              </p>
              {secondsRemaining === 0 && (
                <button
                  type="button"
                  onClick={onMute}
                  className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-400 border border-red-500/30 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm w-fit transition-all active:scale-98"
                >
                  <VolumeX size={14} /> Stop Alarm Sound
                </button>
              )}
            </div>
            
            <div className="mt-4 p-3 bg-blue-500/10 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 rounded-xl flex items-center gap-3">
              <span className="text-xl">💧</span>
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-white block">Current Intake</span>
                <span className="text-slate-600 dark:text-slate-300 font-semibold">{todayIntake} ml logged today</span>
              </div>
            </div>
          </div>

          {/* Card: Streak & badging */}
          <div className="p-6 glass-card rounded-2xl flex flex-col justify-between border-l-4 border-amber-500">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-widest flex items-center gap-1.5">
                <Flame size={14} /> Hydration Streaks
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 my-2">
              <div className="bg-slate-100/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/25">
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Current Streak</span>
                <span className="text-3xl font-extrabold text-slate-800 dark:text-white flex items-baseline gap-1">
                  {streak.current_streak} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">days</span>
                </span>
              </div>
              <div className="bg-slate-100/50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200/50 dark:border-slate-700/25">
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">Longest Streak</span>
                <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 flex items-baseline gap-1">
                  {streak.longest_streak} <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">days</span>
                </span>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-2">
              <Award size={14} className="text-amber-500" />
              <span>Drink daily to maintain your flame!</span>
            </div>
          </div>

          {/* Card: Hydration Score Compliance */}
          <div className="p-6 glass-card rounded-2xl flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider uppercase">
                Hydration Score
              </span>
              <h3 className={`text-3xl font-black mt-2 ${score.color}`}>
                {score.label}
              </h3>
              <p className="text-xs text-slate-550 dark:text-slate-400 mt-1">
                Based on reminder completions and overdue response rates.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div className="bg-slate-100/50 dark:bg-slate-800/30 py-2 rounded-lg">
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Done</span>
                <span className="text-sm font-bold text-slate-800 dark:text-white">{completedReminders}</span>
              </div>
              <div className="bg-slate-100/50 dark:bg-slate-800/30 py-2 rounded-lg">
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Overdue</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">{overdueCount}</span>
              </div>
              <div className="bg-slate-100/50 dark:bg-slate-800/30 py-2 rounded-lg">
                <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Snoozed</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{snoozedCount}</span>
              </div>
            </div>
          </div>

          {/* Card: Smart Weather Suggestion */}
          <div className="p-6 glass-card rounded-2xl flex flex-col justify-between border-l-4 border-[#a87ffb]">
            <div className="flex items-center gap-2">
              <CloudSun size={18} className="text-[#a87ffb]" />
              <span className="text-xs font-bold text-[#a87ffb] uppercase tracking-widest">
                Smart Suggestions
              </span>
            </div>
            
            <div className="my-2">
              <div className="flex items-center gap-1 text-sm font-bold text-slate-800 dark:text-white">
                <span>{weatherAdvice.icon}</span>
                <span>{weatherAdvice.tip}</span>
              </div>
              <p className="text-xs text-slate-550 dark:text-slate-400 mt-1.5 leading-relaxed">
                {weatherAdvice.advice}
              </p>
            </div>

            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              No internet connection required
            </div>
          </div>

        </div>
      </div>

      {/* Grid: Quick Log & Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left: Quick Log Intake */}
        <div className="p-6 glass-card rounded-2xl">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <ThumbsUp size={18} className="text-indigo-600 dark:text-indigo-400" /> Quick Add Water
          </h2>
          <p className="text-xs text-slate-550 dark:text-slate-400 mb-6">
            Quickly log custom quantities of water intake to update your daily progress.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[150, 250, 350, 500].map((amount) => (
              <button
                key={amount}
                onClick={() => addWater(amount)}
                className="py-4 px-3 bg-[#f0f4f9] dark:bg-[#2e2e2f]/50 border border-[#e3e3e3] dark:border-[#3e3e40]/70 hover:bg-[#e8f0fe] hover:border-[#1a73e8] dark:hover:bg-[#2a3b50] dark:hover:border-[#8ab4f8] text-slate-800 dark:text-slate-200 rounded-2xl font-bold transition-all flex flex-col items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm"
              >
                <span className="text-xl">🥛</span>
                <span className="text-sm">{amount} ml</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Today's Timeline */}
        <div className="p-6 glass-card rounded-2xl flex flex-col max-h-[300px]">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <Calendar size={18} className="text-indigo-650 dark:text-indigo-400" /> Today's Log Timeline
          </h2>
          
          <div className="overflow-y-auto pr-1 flex-1 space-y-3">
            {todayLogs.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-slate-500">
                <Smile size={32} className="opacity-40 mb-2" />
                <span className="text-xs">No water logged today yet. Keep going!</span>
              </div>
            ) : (
              todayLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-slate-100/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-750/30 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      💧
                    </div>
                    <div>
                      <span className="text-sm font-bold text-slate-800 dark:text-white">Drank Water</span>
                      <span className="block text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">+{log.amount} ml</span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
