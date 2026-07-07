export interface UserProfile {
  id?: number;
  name: string;
  gender: string;
  age: number;
  weight: number;
  wake_time: string;
  sleep_time: string;
  daily_goal: number;
  reminder_interval: number;
  sound_enabled: boolean;
  sound_volume: number;
  startup_enabled: boolean;
  overlay_enabled: boolean;
  theme: "light" | "dark";
  animations_enabled: boolean;
  character_outfit: string;
  language: string;
  member_since: string;
}

export interface WaterLog {
  id: number;
  amount: number;
  timestamp: string;
}

export interface ReminderLog {
  id: number;
  time: string;
  status: "Completed" | "Overdue" | "Skipped" | "Snoozed";
  water_amount: number;
  response_time: number;
}

export interface StreakInfo {
  current_streak: number;
  longest_streak: number;
  last_drink_date: string | null;
}

export interface TimerState {
  next_reminder_at: string | null;
  is_paused: boolean;
  paused_remaining_seconds: number | null;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || "https://hydrawalk.onrender.com/api";

// Returns a user-scoped localStorage key so each account's timer is independent
function timerKey(userId?: string): string {
  return `hydrawalk.timerState.v2.${userId || "guest"}`;
}

function defaultTimerState(): TimerState {
  return {
    next_reminder_at: null,
    is_paused: false,
    paused_remaining_seconds: null,
  };
}

function readTimerState(userId?: string): TimerState {
  if (typeof window === "undefined") {
    return defaultTimerState();
  }

  const raw = window.localStorage.getItem(timerKey(userId));
  if (!raw) {
    return defaultTimerState();
  }

  try {
    const parsed = JSON.parse(raw) as Partial<TimerState>;
    return {
      next_reminder_at: parsed.next_reminder_at ?? null,
      is_paused: Boolean(parsed.is_paused),
      paused_remaining_seconds:
        parsed.paused_remaining_seconds == null ? null : Number(parsed.paused_remaining_seconds),
    };
  } catch {
    return defaultTimerState();
  }
}

function writeTimerState(state: TimerState, userId?: string): TimerState {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(timerKey(userId), JSON.stringify(state));
  }
  return state;
}

async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("hydrawalk_jwt_token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `MongoDB API request failed: ${response.status}`;
    try {
      const error = await response.json();
      if (error?.error) message = error.error;
    } catch {
      // Keep the generic status message when the response is not JSON.
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export async function initDb(): Promise<void> {
  await api<{ ok: boolean }>("/health");
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const data = await api<{ user: UserProfile | null }>("/profile");
  return data.user;
}

export async function saveUserProfile(profile: Omit<UserProfile, "id">): Promise<void> {
  await api<{ user: UserProfile }>("/profile", {
    method: "PUT",
    body: JSON.stringify(profile),
  });
}

export async function logWaterIntake(amount: number): Promise<void> {
  await api<{ log: WaterLog }>("/water", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function getTodayWaterIntake(): Promise<number> {
  const data = await api<{ total: number }>("/water/today");
  return data.total;
}

export async function getTodayWaterLogs(): Promise<WaterLog[]> {
  const data = await api<{ logs: WaterLog[] }>("/water/today");
  return data.logs;
}

export async function getWaterLogsForRange(days: number): Promise<WaterLog[]> {
  const data = await api<{ logs: WaterLog[] }>(`/water/range?days=${encodeURIComponent(days)}`);
  return data.logs;
}

export async function logReminderResult(
  status: "Completed" | "Overdue" | "Skipped" | "Snoozed",
  waterAmount: number,
  responseTimeSec: number,
): Promise<void> {
  await api<{ reminder: ReminderLog }>("/reminders", {
    method: "POST",
    body: JSON.stringify({
      status,
      water_amount: waterAmount,
      response_time: responseTimeSec,
    }),
  });
}

export async function getReminderLogsForRange(days: number): Promise<ReminderLog[]> {
  const data = await api<{ reminders: ReminderLog[] }>(`/reminders/range?days=${encodeURIComponent(days)}`);
  return data.reminders;
}

export async function getTodayReminders(): Promise<ReminderLog[]> {
  const data = await api<{ reminders: ReminderLog[] }>("/reminders/today");
  return data.reminders;
}

export async function unlockAchievement(id: string): Promise<boolean> {
  const data = await api<{ unlocked: boolean }>(`/achievements/${encodeURIComponent(id)}/unlock`, {
    method: "POST",
  });
  return data.unlocked;
}

export async function getUnlockedAchievements(): Promise<string[]> {
  const data = await api<{ achievements: string[] }>("/achievements");
  return data.achievements;
}

export async function getWaterLogCount(): Promise<number> {
  const data = await api<{ count: number }>("/water/count");
  return data.count;
}

export async function getLatestWaterLog(): Promise<WaterLog | null> {
  const data = await api<{ log: WaterLog | null }>("/water/latest");
  return data.log;
}

export async function getStreakInfo(): Promise<StreakInfo> {
  const data = await api<{ streak: StreakInfo }>("/streak");
  return data.streak;
}

export async function getTimerState(userId?: string): Promise<TimerState> {
  const token = typeof window !== "undefined" ? localStorage.getItem("hydrawalk_jwt_token") : null;
  if (!token) {
    return readTimerState(userId);
  }
  try {
    const data = await api<TimerState>("/timer");
    writeTimerState(data, userId);
    return data;
  } catch (err) {
    console.warn("Failed to fetch timer from API, falling back to localStorage:", err);
    return readTimerState(userId);
  }
}

export async function saveTimerState(state: Partial<TimerState>, userId?: string): Promise<TimerState> {
  const current = readTimerState(userId);
  const hasNextReminderAt = Object.prototype.hasOwnProperty.call(state, "next_reminder_at");
  const hasIsPaused = Object.prototype.hasOwnProperty.call(state, "is_paused");
  const hasPausedRemaining = Object.prototype.hasOwnProperty.call(state, "paused_remaining_seconds");

  const updated: TimerState = {
    next_reminder_at: hasNextReminderAt ? (state.next_reminder_at ?? null) : current.next_reminder_at,
    is_paused: hasIsPaused ? Boolean(state.is_paused) : current.is_paused,
    paused_remaining_seconds: hasPausedRemaining
      ? (state.paused_remaining_seconds == null ? null : Number(state.paused_remaining_seconds))
      : current.paused_remaining_seconds,
  };

  writeTimerState(updated, userId);

  const token = typeof window !== "undefined" ? localStorage.getItem("hydrawalk_jwt_token") : null;
  if (token) {
    try {
      await api<void>("/timer", {
        method: "POST",
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.warn("Failed to sync timer to API:", err);
    }
  }

  return updated;
}

export async function resetAllUserData(): Promise<void> {
  await api<{ ok: boolean }>("/data", { method: "DELETE" });
}

export async function exportDatabaseBackup(): Promise<string> {
  const data = await api<unknown>("/backup");
  return JSON.stringify(data);
}

export async function importBackupData(jsonString: string): Promise<void> {
  const data = JSON.parse(jsonString);
  await api<{ ok: boolean }>("/backup", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  return api<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(email: string, password: string, name: string): Promise<AuthResponse> {
  return api<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export const importDatabaseBackup = importBackupData;
