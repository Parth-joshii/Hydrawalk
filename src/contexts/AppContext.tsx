import React, { createContext, useContext, useState, useEffect } from "react";
import {
  initDb,
  getUserProfile,
  saveUserProfile,
  logWaterIntake,
  getTodayWaterIntake,
  getStreakInfo,
  getUnlockedAchievements,
  unlockAchievement,
  UserProfile,
  StreakInfo,
  WaterLog,
  getWaterLogsForRange,
  getTodayWaterLogs,
  getWaterLogCount,
  getLatestWaterLog
} from "../services/db";
import { playSuccessSound } from "../services/notifications";

interface AppContextType {
  user: UserProfile | null;
  isDbInitialized: boolean;
  isAuthenticated: boolean;
  streak: StreakInfo;
  todayIntake: number;
  todayLogs: WaterLog[];
  theme: "light" | "dark";
  isLoading: boolean;
  achievements: string[];
  achievementNotif: string | null;
  initializationError: string | null;
  refreshData: () => Promise<void>;
  addWater: (amount: number) => Promise<void>;
  updateProfile: (profile: Omit<UserProfile, "id">) => Promise<void>;
  setThemeMode: (mode: "light" | "dark") => Promise<void>;
  setOutfit: (outfit: string) => Promise<void>;
  dismissAchievement: () => void;
  triggerAchievementCheck: () => Promise<void>;
  login: (token: string, user: any) => Promise<void>;
  logout: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem("hydrawalk_jwt_token"));
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [streak, setStreak] = useState<StreakInfo>({ current_streak: 0, longest_streak: 0, last_drink_date: null });
  const [todayIntake, setTodayIntake] = useState(0);
  const [todayLogs, setTodayLogs] = useState<WaterLog[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">("dark");
  const [isLoading, setIsLoading] = useState(true);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [achievementNotif, setAchievementNotif] = useState<string | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(null);

  const isAuthenticated = !!token;

  const refreshData = async () => {
    if (!localStorage.getItem("hydrawalk_jwt_token")) return;
    try {
      const profile = await getUserProfile();
      setUser(profile);
      if (profile) {
        setTheme(profile.theme);
        // Apply theme to document root
        const root = window.document.documentElement;
        if (profile.theme === "dark") {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }

      const streakData = await getStreakInfo();
      setStreak(streakData);

      const intake = await getTodayWaterIntake();
      setTodayIntake(intake);

      const logs = await getTodayWaterLogs();
      setTodayLogs(logs);

      const unlocked = await getUnlockedAchievements();
      setAchievements(unlocked);
    } catch (err) {
      console.error("Failed to load global AppContext state:", err);
    }
  };

  useEffect(() => {
    async function start() {
      setIsLoading(true);
      setInitializationError(null);

      try {
        await initDb();
        setIsDbInitialized(true);
        if (token) {
          await refreshData();
        }
      } catch (err) {
        console.error("Failed to initialize local database:", err);
        setInitializationError("HydraWalk could not initialize its local database. Restart the app and try again.");
      } finally {
        setIsLoading(false);
      }
    }
    start();
  }, [token]);

  const login = async (newToken: string, _authUser: any) => {
    localStorage.setItem("hydrawalk_jwt_token", newToken);
    setToken(newToken);
    setIsLoading(true);
    try {
      await refreshData();
    } catch (err) {
      console.error("Failed to load user profile during login:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("hydrawalk_jwt_token");
    setToken(null);
    setUser(null);
    setTodayIntake(0);
    setTodayLogs([]);
    setStreak({ current_streak: 0, longest_streak: 0, last_drink_date: null });
    setAchievements([]);
  };

  const addWater = async (amount: number) => {
    if (!user) return;
    setIsLoading(true);
    await logWaterIntake(amount);
    await refreshData();
    playSuccessSound(user.sound_volume);
    await triggerAchievementCheck();
    setIsLoading(false);
  };

  const updateProfile = async (profile: Omit<UserProfile, "id">) => {
    setIsLoading(true);
    try {
      let finalOutfit = profile.character_outfit;
      const isBoy = (profile.gender || "Female").toLowerCase() === "male" || (profile.gender || "Female").toLowerCase() === "boy";
      if (isBoy && finalOutfit.includes("pink")) {
        finalOutfit = "hoodie_blue";
      }
      await saveUserProfile({ ...profile, character_outfit: finalOutfit });
      await refreshData();
    } finally {
      setIsLoading(false);
    }
  };

  const setThemeMode = async (mode: "light" | "dark") => {
    if (!user) return;
    const newProfile = { ...user, theme: mode };
    await saveUserProfile(newProfile);
    setTheme(mode);
    const root = window.document.documentElement;
    if (mode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const setOutfit = async (outfit: string) => {
    if (!user) return;
    let finalOutfit = outfit;
    const isBoy = (user.gender || "Female").toLowerCase() === "male" || (user.gender || "Female").toLowerCase() === "boy";
    if (isBoy && outfit.includes("pink")) {
      finalOutfit = "hoodie_blue";
    }
    const newProfile = { ...user, character_outfit: finalOutfit };
    await saveUserProfile(newProfile);
    setUser(newProfile);
  };

  const dismissAchievement = () => {
    setAchievementNotif(null);
  };

  const triggerAchievementCheck = async () => {
    if (!user) return;
    // 1. Check "First Drink"
    const drinkCount = await getWaterLogCount();
    if (drinkCount > 0) {
      const unlocked = await unlockAchievement("first_drink");
      if (unlocked) setAchievementNotif("first_drink");
    }

    // 2. Check Streak badges
    const currentStreak = streak.current_streak;
    if (currentStreak >= 7) {
      const unlocked = await unlockAchievement("streak_7");
      if (unlocked) setAchievementNotif("streak_7");
    }
    if (currentStreak >= 30) {
      const unlocked = await unlockAchievement("streak_30");
      if (unlocked) setAchievementNotif("streak_30");
    }

    // 3. Check Volume totals: 100/500/1000 Drinks
    if (drinkCount >= 100) {
      const unlocked = await unlockAchievement("drinks_100");
      if (unlocked) setAchievementNotif("drinks_100");
    }
    if (drinkCount >= 500) {
      const unlocked = await unlockAchievement("drinks_500");
      if (unlocked) setAchievementNotif("drinks_500");
    }
    if (drinkCount >= 1000) {
      const unlocked = await unlockAchievement("drinks_1000");
      if (unlocked) setAchievementNotif("drinks_1000");
    }

    // 4. Early Bird (drink logged before 8:00 AM local)
    // Night Owl (drink logged after 10:00 PM local)
    const latestLog = await getLatestWaterLog();
    if (latestLog) {
      const date = new Date(latestLog.timestamp);
      const hours = date.getHours();
      if (hours < 8) {
        const unlocked = await unlockAchievement("early_bird");
        if (unlocked) setAchievementNotif("early_bird");
      } else if (hours >= 22) {
        const unlocked = await unlockAchievement("night_owl");
        if (unlocked) setAchievementNotif("night_owl");
      }
    }

    // 5. Perfect Week / Month (consecutive days of goal completion)
    // We can count how many unique days in the last 7/30 days achieved goal
    // To keep it light, let's fetch water logs for range and check
    const last30Logs = await getWaterLogsForRange(30);
    const dayTotals: Record<string, number> = {};
    last30Logs.forEach((log) => {
      const day = log.timestamp.split("T")[0];
      dayTotals[day] = (dayTotals[day] || 0) + log.amount;
    });

    const dates = Object.keys(dayTotals).sort();
    
    // Check perfect week (7 days in a row of meeting goal)
    let consecutiveMet = 0;
    let perfectWeekUnlocked = false;
    let perfectMonthUnlocked = false;

    // Check if the user reached their water goal in consecutive days
    for (let i = 0; i < dates.length; i++) {
      if (dayTotals[dates[i]] >= user.daily_goal) {
        consecutiveMet++;
        if (consecutiveMet >= 7) perfectWeekUnlocked = true;
        if (consecutiveMet >= 30) perfectMonthUnlocked = true;
      } else {
        consecutiveMet = 0;
      }
    }

    if (perfectWeekUnlocked) {
      const unlocked = await unlockAchievement("perfect_week");
      if (unlocked) setAchievementNotif("perfect_week");
    }
    if (perfectMonthUnlocked) {
      const unlocked = await unlockAchievement("perfect_month");
      if (unlocked) setAchievementNotif("perfect_month");
    }

    // Update achievements state
    const unlocked = await getUnlockedAchievements();
    setAchievements(unlocked);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        isDbInitialized,
        isAuthenticated,
        streak,
        todayIntake,
        todayLogs,
        theme,
        isLoading,
        achievements,
        achievementNotif,
        initializationError,
        refreshData,
        addWater,
        updateProfile,
        setThemeMode,
        setOutfit,
        dismissAchievement,
        triggerAchievementCheck,
        login,
        logout,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
