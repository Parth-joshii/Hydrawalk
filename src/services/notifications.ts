import { isTauriRuntime } from "../utils/runtime";

// Dynamic audio generation using Web Audio API to create professional synth chimes
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Programmatically play a sweet, rising water-like chime
 * @param volume Volume level from 0.0 to 1.0
 */
export function playReminderSound(volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Play three quick rising tones
    const tones = [523.25, 659.25, 783.99]; // C5, E5, G5
    const durations = [0.15, 0.15, 0.3];
    const delays = [0, 0.12, 0.24];

    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + delays[idx]);

      // Soft attack, smooth decay
      gain.gain.setValueAtTime(0, now + delays[idx]);
      gain.gain.linearRampToValueAtTime(volume * 0.4, now + delays[idx] + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delays[idx] + durations[idx]);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delays[idx]);
      osc.stop(now + delays[idx] + durations[idx]);
    });
  } catch (err) {
    console.error("Failed to play reminder audio:", err);
  }
}

let reminderIntervalId: any = null;

/**
 * Start loop playing of the reminder sound until explicitly stopped
 */
export function startReminderSoundLoop(volume: number = 0.5) {
  if (reminderIntervalId !== null) return;
  playReminderSound(volume);
  reminderIntervalId = setInterval(() => {
    playReminderSound(volume);
  }, 3000);
}

/**
 * Stop loop playing of the reminder sound
 */
export function stopReminderSoundLoop() {
  if (reminderIntervalId !== null) {
    clearInterval(reminderIntervalId);
    reminderIntervalId = null;
  }
}

/**
 * Programmatically play a happy celebration chime (for completing a goal/reminder)
 * @param volume Volume level from 0.0 to 1.0
 */
export function playSuccessSound(volume: number = 0.5) {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Arpeggio of C major: C5, E5, G5, C6
    const tones = [523.25, 659.25, 783.99, 1046.5];
    const delays = [0, 0.08, 0.16, 0.24];
    const duration = 0.4;

    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle"; // Slightly warmer synth tone
      osc.frequency.setValueAtTime(freq, now + delays[idx]);

      gain.gain.setValueAtTime(0, now + delays[idx]);
      gain.gain.linearRampToValueAtTime(volume * 0.3, now + delays[idx] + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + delays[idx] + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + delays[idx]);
      osc.stop(now + delays[idx] + duration);
    });
  } catch (err) {
    console.error("Failed to play success audio:", err);
  }
}

/**
 * Send a native Windows desktop notification
 */
export async function sendNativeNotification(title: string, body: string) {
  try {
    if (isTauriRuntime()) {
      const {
        isPermissionGranted,
        requestPermission,
        sendNotification,
      } = await import("@tauri-apps/plugin-notification");

      let permissionGranted = await isPermissionGranted();
      if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === "granted";
      }

      if (permissionGranted) {
        sendNotification({
          title,
          body,
          icon: "icons/128x128.png",
        });
      }
      return;
    }

    if (!("Notification" in window)) return;

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    if (permission === "granted") {
      new Notification(title, { body });
    }
  } catch (err) {
    console.error("Failed to trigger native notification:", err);
  }
}
