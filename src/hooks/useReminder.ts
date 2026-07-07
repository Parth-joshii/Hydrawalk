import { useState, useEffect, useRef } from "react";
import { useApp } from "../contexts/AppContext";
import { getTimerState, logReminderResult, saveTimerState, TimerState } from "../services/db";
import { startReminderSoundLoop, stopReminderSoundLoop, sendNativeNotification } from "../services/notifications";
import { isTauriRuntime } from "../utils/runtime";

export const useReminder = () => {
  const { user, addWater } = useApp();
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeReminder, setActiveReminder] = useState<boolean>(false);
  const [isOverdue, setIsOverdue] = useState<boolean>(false);
  const [overdueCount, setOverdueCount] = useState<number>(0);
  const [responseTime, setResponseTime] = useState<number>(0);
  const [isTimerReady, setIsTimerReady] = useState<boolean>(false);
  const [nextReminderAt, setNextReminderAt] = useState<string | null>(null);
  const [pausedRemainingSeconds, setPausedRemainingSeconds] = useState<number | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const overdueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const responseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const persistTimerState = async (state: Partial<TimerState>) => {
    try {
      await saveTimerState(state);
    } catch (err) {
      console.error("Failed to persist reminder timer state:", err);
    }
  };

  const scheduleNextReminder = async (seconds: number) => {
    if (!user) return;

    const nextReminderAtValue = new Date(Date.now() + seconds * 1000).toISOString();
    setSecondsRemaining(seconds);
    setNextReminderAt(nextReminderAtValue);
    setPausedRemainingSeconds(null);
    setIsPaused(false);
    await persistTimerState({
      next_reminder_at: nextReminderAtValue,
      is_paused: false,
      paused_remaining_seconds: null,
    });
  };

  const pauseCountdown = async () => {
    if (!user) return;

    const remaining = Math.max(0, secondsRemaining);
    setIsPaused(true);
    setPausedRemainingSeconds(remaining);
    setNextReminderAt(null);
    await persistTimerState({
      next_reminder_at: null,
      is_paused: true,
      paused_remaining_seconds: remaining,
    });
  };

  const resumeCountdown = async () => {
    if (!user) return;

    const remaining = pausedRemainingSeconds ?? Math.max(0, secondsRemaining);
    const nextReminderAtValue = new Date(Date.now() + remaining * 1000).toISOString();
    setIsPaused(false);
    setPausedRemainingSeconds(null);
    setNextReminderAt(nextReminderAtValue);
    await persistTimerState({
      next_reminder_at: nextReminderAtValue,
      is_paused: false,
      paused_remaining_seconds: null,
    });
  };

  const togglePause = async () => {
    if (isPaused) {
      await resumeCountdown();
    } else {
      await pauseCountdown();
    }
  };

  // Initialize timer state from MongoDB so refreshes continue the countdown.
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function hydrateTimer() {
      setIsTimerReady(false);

      try {
        const saved = await getTimerState();
        if (cancelled) return;

        if (saved.is_paused) {
          const remaining = Math.max(0, saved.paused_remaining_seconds ?? (user?.reminder_interval ?? 60) * 60);
          setIsPaused(true);
          setPausedRemainingSeconds(remaining);
          setNextReminderAt(null);
          setSecondsRemaining(remaining);
          return;
        }

        const fallbackSeconds = (user?.reminder_interval ?? 60) * 60;
        const nextReminderAtValue = saved.next_reminder_at
          ? saved.next_reminder_at
          : new Date(Date.now() + fallbackSeconds * 1000).toISOString();
        const remaining = Math.max(0, Math.ceil((new Date(nextReminderAtValue).getTime() - Date.now()) / 1000));

        setIsPaused(false);
        setPausedRemainingSeconds(null);
        setNextReminderAt(nextReminderAtValue);
        setSecondsRemaining(remaining);

        if (!saved.next_reminder_at) {
          await persistTimerState({
            next_reminder_at: nextReminderAtValue,
            is_paused: false,
            paused_remaining_seconds: null,
          });
        }
      } catch (err) {
        console.error("Failed to load reminder timer state:", err);
        const fallbackSeconds = (user?.reminder_interval ?? 60) * 60;
        const nextReminderAtValue = new Date(Date.now() + fallbackSeconds * 1000).toISOString();
        setIsPaused(false);
        setPausedRemainingSeconds(null);
        setNextReminderAt(nextReminderAtValue);
        setSecondsRemaining(fallbackSeconds);
        await persistTimerState({
          next_reminder_at: nextReminderAtValue,
          is_paused: false,
          paused_remaining_seconds: null,
        });
      } finally {
        if (!cancelled) {
          setIsTimerReady(true);
        }
      }
    }

    hydrateTimer();

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.reminder_interval]);

  useEffect(() => {
    if (!isTimerReady || isPaused || activeReminder || !user || !nextReminderAt) return;

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((new Date(nextReminderAt).getTime() - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      return remaining;
    };

    const initialRemaining = updateRemaining();
    if (initialRemaining <= 0) {
      void triggerReminder();
      return;
    }

    timerRef.current = setInterval(() => {
      const remaining = updateRemaining();
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        void triggerReminder();
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerReady, isPaused, activeReminder, user, nextReminderAt]);

  // Handle reminder trigger
  const triggerReminder = async () => {
    if (!user || activeReminder) return;
    setActiveReminder(true);
    setIsOverdue(false);
    setResponseTime(0);
    setNextReminderAt(null);
    setPausedRemainingSeconds(null);
    setSecondsRemaining(0);
    await persistTimerState({
      next_reminder_at: null,
      is_paused: false,
      paused_remaining_seconds: null,
    });

    // Play chime sound (iterative loop)
    if (user.sound_enabled) {
      startReminderSoundLoop(user.sound_volume);
    }

    // Native OS Notification
    sendNativeNotification(
      "💧 Time to Drink Water!",
      `Hi ${user.name}, your body needs hydration. Let's drink a cup of water!`
    );

    // Show transparent overlay window
    if (user.overlay_enabled && isTauriRuntime()) {
      try {
        const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        const overlay = await WebviewWindow.getByLabel("overlay");
        if (overlay) {
          await overlay.show();
          await overlay.emit("start-reminder", {
            name: user.name,
            interval: user.reminder_interval,
            outfit: user.character_outfit,
          });
        }
      } catch (err) {
        console.error("Failed to show overlay window:", err);
      }
    }

    // Start 5-minute overdue timer (300 seconds)
    if (overdueTimerRef.current) clearTimeout(overdueTimerRef.current);
    overdueTimerRef.current = setTimeout(async () => {
      setIsOverdue(true);
      setOverdueCount((prev) => prev + 1);
      await logReminderResult("Overdue", 0, 300);

      // Notify overlay of overdue state
      if (!isTauriRuntime()) return;
      try {
        const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        const overlay = await WebviewWindow.getByLabel("overlay");
        if (overlay) {
          await overlay.emit("reminder-overdue");
        }
      } catch (err) {
        console.error("Failed to emit overdue event to overlay:", err);
      }
    }, 5 * 60 * 1000);

    // Start response time timer
    if (responseTimerRef.current) clearInterval(responseTimerRef.current);
    responseTimerRef.current = setInterval(() => {
      setResponseTime((prev) => prev + 1);
    }, 1000);
  };

  // Actions from popup (Done, Snooze, Skip, Close)
  const handleDone = async (amount: number = 250) => {
    stopReminderSoundLoop();
    clearTimeout(overdueTimerRef.current!);
    clearInterval(responseTimerRef.current!);

    await addWater(amount);
    await logReminderResult("Completed", amount, responseTime);

    // Close overlay with animation
    if (isTauriRuntime()) {
      try {
        const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        const overlay = await WebviewWindow.getByLabel("overlay");
        if (overlay) {
          await overlay.emit("action-done");
          // We will hide it inside the overlay once leaving animation finishes,
          // but just to be safe, we reset local states.
        }
      } catch (err) {
        console.error(err);
      }
    }

    setActiveReminder(false);
    setIsOverdue(false);
    if (user) {
      await scheduleNextReminder(user.reminder_interval * 60);
    }
  };

  const handleSnooze = async () => {
    stopReminderSoundLoop();
    clearTimeout(overdueTimerRef.current!);
    clearInterval(responseTimerRef.current!);

    await logReminderResult("Snoozed", 0, responseTime);

    if (isTauriRuntime()) {
      try {
        const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        const overlay = await WebviewWindow.getByLabel("overlay");
        if (overlay) {
          await overlay.emit("action-snooze");
        }
      } catch (err) {
        console.error(err);
      }
    }

    setActiveReminder(false);
    setIsOverdue(false);
    if (user) {
      await scheduleNextReminder(10 * 60);
    }
  };

  const handleSkip = async () => {
    stopReminderSoundLoop();
    clearTimeout(overdueTimerRef.current!);
    clearInterval(responseTimerRef.current!);

    await logReminderResult("Skipped", 0, responseTime);

    if (isTauriRuntime()) {
      try {
        const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
        const overlay = await WebviewWindow.getByLabel("overlay");
        if (overlay) {
          await overlay.emit("action-skip");
        }
      } catch (err) {
        console.error(err);
      }
    }

    setActiveReminder(false);
    setIsOverdue(false);
    if (user) {
      await scheduleNextReminder(user.reminder_interval * 60);
    }
  };

  // Listen to system tray events
  useEffect(() => {
    let unlistenNow: () => void;
    let unlistenDrinkNow: () => void;
    let unlistenPause: () => void;
    let unlistenResume: () => void;
    let unlistenOverlayDone: () => void;
    let unlistenOverlaySnooze: () => void;
    let unlistenOverlaySkip: () => void;

    async function setupTrayListeners() {
      if (!isTauriRuntime()) return;
      const { listen } = await import("@tauri-apps/api/event");

      unlistenNow = await listen("trigger-reminder-now", () => {
        setSecondsRemaining(0);
        triggerReminder();
      });

      unlistenDrinkNow = await listen("drink-water-now", () => {
        handleDone(250);
      });

      unlistenPause = await listen("pause-reminders", () => {
        void pauseCountdown();
      });

      unlistenResume = await listen("resume-reminders", () => {
        void resumeCountdown();
      });

      // Listen for actions sent from overlay window to main window
      unlistenOverlayDone = await listen<{ amount: number }>("overlay-done", (event) => {
        handleDone(event.payload.amount);
      });

      unlistenOverlaySnooze = await listen("overlay-snooze", () => {
        handleSnooze();
      });

      unlistenOverlaySkip = await listen("overlay-skip", () => {
        handleSkip();
      });
    }

    setupTrayListeners();

    return () => {
      if (unlistenNow) unlistenNow();
      if (unlistenDrinkNow) unlistenDrinkNow();
      if (unlistenPause) unlistenPause();
      if (unlistenResume) unlistenResume();
      if (unlistenOverlayDone) unlistenOverlayDone();
      if (unlistenOverlaySnooze) unlistenOverlaySnooze();
      if (unlistenOverlaySkip) unlistenOverlaySkip();
    };
  }, [user, responseTime]);

  return {
    isTimerReady,
    secondsRemaining,
    isPaused,
    activeReminder,
    isOverdue,
    overdueCount,
    togglePause,
    handleDone,
    handleSnooze,
    handleSkip,
    triggerReminder,
    stopSound: stopReminderSoundLoop,
  };
};
