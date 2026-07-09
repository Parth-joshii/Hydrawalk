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
let alarmAudio: HTMLAudioElement | null = null;
let currentAudioSrc: string | null = null;
let alarmIntervalId: any = null;

// Tone 2: Retro Arcade Synthesizer
function playRetroArcade(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 523.25, 783.99, 659.25, 1046.50];
  const delay = 0.08;
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(freq, now + idx * delay);
    
    gain.gain.setValueAtTime(0, now + idx * delay);
    gain.gain.linearRampToValueAtTime(volume * 0.15, now + idx * delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * delay + 0.15);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now + idx * delay);
    osc.stop(now + idx * delay + 0.16);
  });
}

// Tone 3: Zen Tibetan Singing Bowl Synthesizer
function playZenBowl(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc1.type = "sine";
  osc1.frequency.setValueAtTime(144, now); // Deep low
  
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(288, now); // Sweet harmonic
  
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(volume * 0.35, now + 0.5); // Warm slow attack
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8); // Long slow decay
  
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(ctx.destination);
  
  osc1.start(now);
  osc2.start(now);
  
  osc1.stop(now + 3.0);
  osc2.stop(now + 3.0);
}

// Tone 4: Forest Bird Chirp Synthesizer
function playForestBird(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const chirps = [
    { start: 0, end: 0.1, f1: 850, f2: 1250 },
    { start: 0.12, end: 0.22, f1: 950, f2: 1350 },
    { start: 0.24, end: 0.34, f1: 1050, f2: 1550 },
  ];
  
  chirps.forEach((chirp) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(chirp.f1, now + chirp.start);
    osc.frequency.exponentialRampToValueAtTime(chirp.f2, now + chirp.end);
    
    gain.gain.setValueAtTime(0, now + chirp.start);
    gain.gain.linearRampToValueAtTime(volume * 0.25, now + chirp.start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + chirp.end);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now + chirp.start);
    osc.stop(now + chirp.end);
  });
}

// Tone 5: Digital Alarm Beep Synthesizer
function playDigitalBeep(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const beeps = [0, 0.2, 0.4];
  
  beeps.forEach((start) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(880, now + start);
    
    filter.type = "bandpass";
    filter.frequency.value = 880;
    filter.Q.value = 3.0;
    
    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(volume * 0.2, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.12);
    
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(now + start);
    osc.stop(now + start + 0.13);
  });
}

// Tone 1: Original Rising Water Chime
function playOriginalChime(ctx: AudioContext, volume: number) {
  const now = ctx.currentTime;
  const tones = [523.25, 659.25, 783.99]; // C5, E5, G5
  const durations = [0.15, 0.15, 0.3];
  const delays = [0, 0.12, 0.24];

  tones.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(freq, now + delays[idx]);

    gain.gain.setValueAtTime(0, now + delays[idx]);
    gain.gain.linearRampToValueAtTime(volume * 0.4, now + delays[idx] + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + delays[idx] + durations[idx]);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now + delays[idx]);
    osc.stop(now + delays[idx] + durations[idx]);
  });
}

/**
 * Play the alarm sound (loaded file, or programmatic synthesizers)
 * @param volume Volume level from 0.0 to 1.0
 * @param loop Whether to loop the alarm continuously
 * @param customSoundUrl Custom Base64 string or URL path of the user's uploaded sound
 * @param tone Tone type selection ('default' | 'original' | 'retro' | 'zen' | 'bird' | 'digital')
 */
export function playReminderSound(
  volume: number = 0.5,
  loop: boolean = false,
  customSoundUrl?: string | null,
  tone: string = "default"
) {
  try {
    if (typeof window === "undefined") return;
    
    // Stop any existing synthesized loops before playing a new one
    if (alarmIntervalId) {
      clearInterval(alarmIntervalId);
      alarmIntervalId = null;
    }
    
    if (tone === "default" || !tone) {
      // Classic Alarm Track (alarm.mp3)
      const audioSrc = customSoundUrl || "/alarm.mp3";
      
      if (!alarmAudio || currentAudioSrc !== audioSrc) {
        if (alarmAudio) {
          alarmAudio.pause();
        }
        alarmAudio = new Audio(audioSrc);
        currentAudioSrc = audioSrc;
      }
      
      alarmAudio.volume = volume;
      alarmAudio.loop = loop;
      
      if (alarmAudio.paused) {
        alarmAudio.play().catch((err) => {
          console.warn("Audio playback blocked or interrupted:", err);
        });
      }
    } else {
      // Synthesized audio context sounds
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      
      // Stop traditional audio player if playing
      if (alarmAudio) {
        alarmAudio.pause();
      }
      
      const playToneOnce = () => {
        if (tone === "original") playOriginalChime(ctx, volume);
        else if (tone === "retro") playRetroArcade(ctx, volume);
        else if (tone === "zen") playZenBowl(ctx, volume);
        else if (tone === "bird") playForestBird(ctx, volume);
        else if (tone === "digital") playDigitalBeep(ctx, volume);
      };
      
      playToneOnce();
      
      if (loop) {
        let intervalMs = 2000;
        if (tone === "original") intervalMs = 3000;
        else if (tone === "zen") intervalMs = 4000;
        else if (tone === "retro") intervalMs = 1500;
        else if (tone === "bird") intervalMs = 2000;
        else if (tone === "digital") intervalMs = 1200;
        
        alarmIntervalId = setInterval(() => {
          try {
            playToneOnce();
          } catch (err) {
            console.warn("Async tone playback error:", err);
            if (alarmIntervalId) {
              clearInterval(alarmIntervalId);
              alarmIntervalId = null;
            }
          }
        }, intervalMs);
      }
    }
  } catch (err) {
    console.error("Failed to play reminder audio:", err);
  }
}

let activeNotifications: any[] = [];

/**
 * Start loop playing of the reminder sound until explicitly stopped
 */
export function startReminderSoundLoop(
  volume: number = 0.5,
  customSoundUrl?: string | null,
  tone: string = "default"
) {
  playReminderSound(volume, true, customSoundUrl, tone);
}

/**
 * Stop loop playing of the reminder sound and dismiss all active OS notifications
 */
export function stopReminderSoundLoop() {
  try {
    if (alarmAudio) {
      alarmAudio.pause();
      alarmAudio.currentTime = 0;
    }
    if (alarmIntervalId) {
      clearInterval(alarmIntervalId);
      alarmIntervalId = null;
    }
    // Dismiss all active OS notifications
    activeNotifications.forEach((n) => {
      try {
        n.close();
      } catch (err) {
        // Ignore close errors
      }
    });
    activeNotifications = [];
  } catch (err) {
    console.error("Failed to stop alarm audio:", err);
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
    // Keep track of web notifications
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        let permission = Notification.permission;
        if (permission === "default") {
          permission = await Notification.requestPermission();
        }
        if (permission === "granted") {
          const n = new Notification(title, { body, icon: "icons/128x128.png" });
          activeNotifications.push(n);
        }
      } catch (err) {
        console.warn("HTML5 Notification not supported or blocked in this context:", err);
      }
    }

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
  } catch (err) {
    console.error("Failed to trigger native notification:", err);
  }
}
