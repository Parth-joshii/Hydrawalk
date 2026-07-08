import React, { useState, useEffect, Suspense, lazy } from "react";
import { AppProvider, useApp } from "./contexts/AppContext";
import { useReminder } from "./hooks/useReminder";
import { FirstTimeSetup } from "./components/FirstTimeSetup";
import { Dashboard } from "./components/Dashboard";
import { Statistics } from "./components/Statistics";
import { AchievementsList } from "./components/AchievementsList";
import { UserProfile } from "./components/UserProfile";
import { Settings as SettingsView } from "./components/Settings";
import { isTauriRuntime } from "./utils/runtime";
import { Home, BarChart3, Trophy, User as UserIcon, Settings, Play, Pause, Flame, LogOut } from "lucide-react";
import { LoginView } from "./components/LoginView";
import { DrinkingCameraModal } from "./components/DrinkingCameraModal";
import { ChromaKeyVideo } from "./components/ChromaKeyVideo";

// Lazy-load the desktop overlay to prevent Tauri API crashes in Vercel web environments
const OverlayView = lazy(() => import("./components/OverlayView").then((m) => ({ default: m.OverlayView })));

// The inner main application container
const MainAppContent: React.FC = () => {
  const { user, todayIntake, streak, isDbInitialized, isLoading, initializationError, isAuthenticated, login, logout } = useApp();
  const [activeTab, setActiveTab] = useState<"dashboard" | "stats" | "achievements" | "profile" | "settings">("dashboard");
  const [showCamera, setShowCamera] = useState(false);

  // Run the background reminder hook inside the main window
  const {
    isTimerReady,
    secondsRemaining,
    isPaused,
    overdueCount,
    activeReminder,
    togglePause,
    handleDone,
    handleSnooze,
    triggerReminder,
    resetTimer,
    dismissReminder,
    stopSound,
  } = useReminder();

  // Listen to menu navigation events emitted from system tray
  useEffect(() => {
    let unlistenNavigate: () => void;

    async function setupTrayNavigation() {
      if (!isTauriRuntime()) return;
      const { listen } = await import("@tauri-apps/api/event");

      unlistenNavigate = await listen<string>("navigate-to", (event) => {
        const tab = event.payload;
        if (tab === "settings" || tab === "statistics") {
          setActiveTab(tab === "settings" ? "settings" : "stats");
        }
      });
    }

    setupTrayNavigation();

    return () => {
      if (unlistenNavigate) unlistenNavigate();
    };
  }, []);

  if (initializationError) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-transparent text-slate-800 dark:text-slate-350 p-6">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">HydraWalk Could Not Start</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">{initializationError}</p>
        </div>
      </div>
    );
  }

  if (!isDbInitialized || (isLoading && !user)) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-transparent text-slate-500 dark:text-slate-400">
        <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-4" />
        <span className="text-xs font-semibold uppercase tracking-widest">Preparing HydraWalk...</span>
      </div>
    );
  }

  if (!isTimerReady && user) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-transparent text-slate-500 dark:text-slate-400">
        <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-4" />
        <span className="text-xs font-semibold uppercase tracking-widest">Syncing timer...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView onAuthSuccess={login} />;
  }

  // If no user exists, display the onboarding wizard
  if (!user) {
    return <FirstTimeSetup />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-[#f8fafd] dark:bg-[#0c0d0e] text-slate-900 dark:text-slate-100 selection:bg-blue-500/30 overflow-hidden font-sans relative">

      {/* Animated glowing backdrop blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="glow-blob animate-blob-1 w-[350px] h-[350px] bg-blue-400/15 dark:bg-blue-600/5 top-1/4 left-1/4" />
        <div className="glow-blob animate-blob-2 w-[400px] h-[400px] bg-purple-300/20 dark:bg-purple-900/5 bottom-1/4 right-1/4" />
      </div>

      {/* Mobile Sticky Top Header */}
      <header className="flex md:hidden items-center justify-between px-5 py-3.5 bg-white dark:bg-[#131314] border-b border-[#e3e3e3] dark:border-slate-800/80 sticky top-0 z-40 relative">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-650 flex items-center justify-center text-lg shadow-md shadow-blue-500/25">
            💧
          </div>
          <div>
            <h2 className="text-sm font-black tracking-tight text-slate-850 dark:text-white leading-none">HydraWalk</h2>
            <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest mt-0.5 block">
              AI Hydration
            </span>
          </div>
        </div>

        {/* Mobile Profile Avatar Trigger */}
        <div
          onClick={() => setActiveTab("profile")}
          className="flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
        >
          <div className="w-8 h-8 rounded-full border border-indigo-500/30 overflow-hidden bg-slate-100 dark:bg-slate-900 flex items-center justify-center">
            <img
              src={user.gender === "Male" ? "/character-boy.png" : "/character-girl.png"}
              alt="avatar"
              className="w-full h-full object-cover object-top scale-110"
            />
          </div>
        </div>
      </header>

      {/* Sidebar Navigation Panel (Hidden on Mobile) */}
      <aside className="hidden md:flex w-64 bg-white dark:bg-[#1e1e1f] border-r border-[#e3e3e3] dark:border-[#2e2e2f] flex-col justify-between p-6 relative z-10 shrink-0">
        <div className="space-y-8">

          {/* Logo Brand Title */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-xl shadow-lg shadow-blue-500/20">
              💧
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-880 dark:text-white leading-none">HydraWalk</h2>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1 block">
                AI Hydration
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard", icon: <Home size={18} /> },
              { id: "stats", label: "Statistics", icon: <BarChart3 size={18} /> },
              { id: "achievements", label: "Achievements", icon: <Trophy size={18} /> },
              { id: "profile", label: "User Profile", icon: <UserIcon size={18} /> },
              { id: "settings", label: "Settings", icon: <Settings size={18} /> },
            ].map((link) => (
              <button
                key={link.id}
                onClick={() => setActiveTab(link.id as any)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-sm font-bold tracking-wide transition-all cursor-pointer ${activeTab === link.id
                    ? "bg-[#e8f0fe] text-[#1a73e8] dark:bg-[#004a77]/30 dark:text-[#c2e7ff]"
                    : "text-slate-600 dark:text-slate-400 hover:bg-[#f0f4f9] dark:hover:bg-[#2e2e2f]/50"
                  }`}
              >
                {link.icon}
                {link.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Sidebar Footer Info Card */}
        <div className="space-y-4 pt-6 border-t border-[#e3e3e3] dark:border-slate-800/80">
          <div className="bg-[#f0f4f9]/50 dark:bg-slate-950/40 border border-[#e3e3e3] dark:border-slate-800/60 p-4 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
              <span>Goal Progress</span>
              <span className="font-bold text-slate-800 dark:text-white">
                {Math.round((todayIntake / user.daily_goal) * 100)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (todayIntake / user.daily_goal) * 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-slate-500 dark:text-slate-400 pt-1">
              <span className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                <Flame size={12} className="text-amber-500" fill="currentColor" /> {streak.current_streak}d streak
              </span>
              <span className="text-slate-700 dark:text-slate-300 font-bold">{todayIntake} ml</span>
            </div>
          </div>

          <div className="space-y-2">
            {/* Quick Pause/Resume Reminders button */}
            <button
              onClick={() => togglePause()}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${isPaused
                  ? "bg-amber-500/10 border-amber-500/25 text-amber-500 hover:bg-amber-500/20"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350"
                }`}
            >
              {isPaused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
              {isPaused ? "Resume Reminders" : "Pause Reminders"}
            </button>

            {/* Logout button */}
            <button
              onClick={logout}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all border border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut size={12} />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content Window Container */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        <main className="flex-1 overflow-y-auto bg-transparent p-4 md:p-8 relative z-10">
          <div className="max-w-5xl mx-auto">
            {activeTab === "dashboard" && (
              <Dashboard
                secondsRemaining={secondsRemaining}
                isPaused={isPaused}
                overdueCount={overdueCount}
                onDrinkNow={handleDone}
                onMute={stopSound}
                onTestReminder={triggerReminder}
              />
            )}
            {activeTab === "stats" && <Statistics />}
            {activeTab === "achievements" && <AchievementsList />}
            {activeTab === "profile" && <UserProfile />}
            {activeTab === "settings" && <SettingsView onResetTimer={resetTimer} />}
          </div>
        </main>

        {/* Mobile Bottom Navigation Bar (Hidden on Desktop) */}
        <nav className="flex md:hidden items-center justify-around bg-white/95 dark:bg-[#131314]/95 backdrop-blur-md border-t border-[#e3e3e3] dark:border-slate-800/80 px-4 py-2 sticky bottom-0 z-40 shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
          {[
            { id: "dashboard", icon: <Home size={18} />, label: "Home" },
            { id: "stats", icon: <BarChart3 size={18} />, label: "Stats" },
            { id: "achievements", icon: <Trophy size={18} />, label: "Badges" },
            { id: "profile", icon: <UserIcon size={18} />, label: "Profile" },
            { id: "settings", icon: <Settings size={18} />, label: "Settings" },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all cursor-pointer ${isActive
                    ? "text-[#1a73e8] font-black dark:text-[#8ab4f8]"
                    : "text-slate-500 dark:text-slate-400 font-bold"
                  }`}
              >
                <span className={`${isActive ? "scale-110" : "scale-100"} transition-all`}>
                  {tab.icon}
                </span>
                <span className="text-[9px] tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Web-based Reminder Modal Overlay */}
      {activeReminder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel p-8 rounded-3xl relative z-10 shadow-2xl text-center flex flex-col items-center">
            {/* Soft background glow */}
            <div className="absolute right-0 top-0 w-48 h-48 bg-blue-500/10 rounded-full filter blur-3xl pointer-events-none" />

            {/* Glowing Drop Header */}
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 via-indigo-500 to-purple-600 flex items-center justify-center text-3xl shadow-lg shadow-indigo-500/25 mb-4 animate-bounce">
              💧
            </div>

            <h2 className="text-2xl font-black text-white tracking-tight mb-1">
              Time to Hydrate, <span className="gemini-text-gradient">{user.name}</span>!
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              Keep your cycle going and stay energized.
            </p>

            {/* Animated Character Preview */}
            <div className="w-48 h-48 bg-slate-900/40 border border-slate-800/40 rounded-3xl flex items-center justify-center relative overflow-hidden mb-6">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_75%)]" />
              <ChromaKeyVideo width={192} height={192} className="w-full h-full object-contain" />
            </div>

            {/* Buttons */}
            <div className="w-full space-y-3">
              <button
                onClick={() => {
                  dismissReminder();
                  setShowCamera(true);
                }}
                className="w-full py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:opacity-90 active:scale-98 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-500/20 cursor-pointer transition-all"
              >
                I Drank Water (+250 ml)
              </button>

              <button
                onClick={handleSnooze}
                className="w-full py-2.5 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 text-slate-300 font-bold rounded-xl text-xs cursor-pointer active:scale-98 transition-all"
              >
                Snooze (2 Min)
              </button>
            </div>
          </div>
        </div>
      )}

      <DrinkingCameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onVerified={async () => {
          setShowCamera(false);
          await handleDone(250);
        }}
      />
    </div>
  );
};

// Main routing selector: loads overlay window or main window
function App() {
  const [label, setLabel] = useState<string>("");

  useEffect(() => {
    if (!isTauriRuntime()) {
      setLabel("main");
      return;
    }

    // Dynamic import of Tauri window API to determine label
    import("@tauri-apps/api/window")
      .then((mod) => {
        setLabel(mod.getCurrentWindow().label);
      })
      .catch((err) => {
        console.error("Failed to load window label, default to main:", err);
        setLabel("main");
      });
  }, []);

  if (label === "overlay") {
    return (
      <Suspense fallback={<div style={{ backgroundColor: "transparent", width: "100%", height: "100%" }} />}>
        <OverlayView />
      </Suspense>
    );
  }

  if (label === "main") {
    return (
      <AppProvider>
        <MainAppContent />
      </AppProvider>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-slate-400">
      <div className="w-12 h-12 rounded-full border-2 border-blue-500 border-t-transparent animate-spin mb-4" />
      <span className="text-xs font-semibold uppercase tracking-widest">Loading HydraWalk...</span>
    </div>
  );
}

export default App;

