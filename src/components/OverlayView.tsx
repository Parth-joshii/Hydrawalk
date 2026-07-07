import React, { useState, useEffect } from "react";
import { Character, CharacterState } from "./Character";
import { motion, AnimatePresence } from "framer-motion";
import { emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Droplet, Clock, Check, X, ShieldAlert } from "lucide-react";

interface ConfettiParticle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  angle: number;
  speed: number;
}

export const OverlayView: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [charState, setCharState] = useState<CharacterState>("idle");
  const [outfit, setOutfit] = useState("hoodie_blue");
  const [gender, setGender] = useState("Female");
  const [userName, setUserName] = useState("Friend");
  const [showPopup, setShowPopup] = useState(false);
  const [overdue, setOverdue] = useState(false);
  const [confetti, setConfetti] = useState<ConfettiParticle[]>([]);

  // Animation coordinates
  const [charX, setCharX] = useState(-200); // Start offscreen left
  const [isAnimating, setIsAnimating] = useState(false);

  // Set initial click-through
  useEffect(() => {
    invoke("set_overlay_click_through", { ignore: true });
  }, []);

  // Listen to Tauri events from the background reminder engine
  useEffect(() => {
    let unlistenStart: () => void;
    let unlistenOverdue: () => void;
    let unlistenDone: () => void;
    let unlistenSnooze: () => void;
    let unlistenSkip: () => void;

    async function setupListeners() {
      // 1. Start reminder event
      unlistenStart = await listen<{ name: string; outfit: string; gender?: string }>(
        "start-reminder",
        (event) => {
          setUserName(event.payload.name || "Friend");
          setOutfit(event.payload.outfit || "hoodie_blue");
          setGender(event.payload.gender || "Female");
          setVisible(true);
          setOverdue(false);
          setShowPopup(false);
          setCharState("walking");
          setCharX(-150);
          setIsAnimating(true);
        }
      );

      // 2. Overdue event
      unlistenOverdue = await listen("reminder-overdue", () => {
        setOverdue(true);
        setCharState("sad");
      });

      // 3. Action completions forwarded from main window
      unlistenDone = await listen("action-done", () => {
        handleActionResponse("done");
      });

      unlistenSnooze = await listen("action-snooze", () => {
        handleActionResponse("snooze");
      });

      unlistenSkip = await listen("action-skip", () => {
        handleActionResponse("skip");
      });
    }

    setupListeners();

    return () => {
      if (unlistenStart) unlistenStart();
      if (unlistenOverdue) unlistenOverdue();
      if (unlistenDone) unlistenDone();
      if (unlistenSnooze) unlistenSnooze();
      if (unlistenSkip) unlistenSkip();
    };
  }, []);

  // Walk in animation trigger
  useEffect(() => {
    if (isAnimating && charState === "walking" && charX < window.innerWidth - 320) {
      const interval = setInterval(() => {
        setCharX((prev) => {
          const next = prev + 5;
          const stopPoint = window.innerWidth - 300;
          if (next >= stopPoint) {
            clearInterval(interval);
            setIsAnimating(false);
            setCharState("waving");

            // Wait 1.5 seconds, then show popup and stop waving
            setTimeout(() => {
              setCharState("idle");
              setShowPopup(true);
            }, 1500);

            return stopPoint;
          }
          return next;
        });
      }, 16); // ~60fps
      return () => clearInterval(interval);
    }
  }, [isAnimating, charState, charX]);

  // Click-through toggle based on mouse hover over interactive elements
  const setInteractive = (interactive: boolean) => {
    invoke("set_overlay_click_through", { ignore: !interactive });
  };

  const handleActionResponse = async (action: "done" | "snooze" | "skip" | "close") => {
    setShowPopup(false);

    if (action === "done") {
      setCharState("happy");
      triggerConfettiBurst();

      // Celebrate for 3 seconds, then walk away
      setTimeout(() => {
        walkOut();
      }, 3000);
    } else if (action === "snooze") {
      setCharState("idle");
      setTimeout(() => {
        walkOut();
      }, 1000);
    } else if (action === "skip") {
      setCharState("sad");
      setTimeout(() => {
        walkOut();
      }, 1500);
    } else {
      // Close/ignore
      walkOut();
    }
  };

  const walkOut = () => {
    setCharState("walking");
    setIsAnimating(true);
    setInteractive(false); // Make click-through while walking away

    const interval = setInterval(() => {
      setCharX((prev) => {
        const next = prev + 5;
        if (next >= window.innerWidth + 200) {
          clearInterval(interval);
          setIsAnimating(false);
          setVisible(false);
          getCurrentWindow().hide(); // Hide the overlay window again
          return window.innerWidth + 200;
        }
        return next;
      });
    }, 16);
  };

  // Confetti logic
  const triggerConfettiBurst = () => {
    const colors = ["#60a5fa", "#3b82f6", "#2563eb", "#bfdbfe", "#93c5fd", "#f43f5e", "#10b981", "#fbbf24"];
    const particles: ConfettiParticle[] = [];

    for (let i = 0; i < 40; i++) {
      particles.push({
        id: Math.random(),
        x: window.innerWidth - 225, // Centered around the character
        y: 130,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
        angle: Math.random() * 360,
        speed: Math.random() * 8 + 4,
      });
    }

    setConfetti(particles);
  };

  // Animate confetti gravity and drag
  useEffect(() => {
    if (confetti.length > 0) {
      const interval = setInterval(() => {
        setConfetti((prev) =>
          prev
            .map((p) => {
              const rad = (p.angle * Math.PI) / 180;
              const dx = Math.cos(rad) * p.speed;
              const dy = Math.sin(rad) * p.speed + 0.15; // Gravity
              return {
                ...p,
                x: p.x + dx,
                y: p.y + dy,
                speed: p.speed * 0.96, // Drag
              };
            })
            .filter((p) => p.y < window.innerHeight && p.x > 0 && p.x < window.innerWidth)
        );
      }, 16);
      return () => clearInterval(interval);
    }
  }, [confetti]);

  // Click triggers sent back to AppContext
  const onDoneClick = () => {
    emit("overlay-done", { amount: 250 });
  };

  const onSnoozeClick = () => {
    emit("overlay-snooze");
  };

  const onSkipClick = () => {
    emit("overlay-skip");
  };

  if (!visible) return null;

  return (
    <div className="relative w-full h-full transparent-bg select-none pointer-events-none">

      {/* Dynamic Confetti Particles */}
      {confetti.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm pointer-events-none"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            transform: `rotate(${p.x * 2}deg)`,
            zIndex: 40,
          }}
        />
      ))}

      {/* Walking Character Container */}
      <div
        className="absolute bottom-0"
        style={{
          left: `${charX}px`,
          zIndex: 50,
        }}
        onMouseEnter={() => setInteractive(true)}
        onMouseLeave={() => setInteractive(false)}
      >
        <Character state={charState} outfit={outfit} scale={1.1} gender={gender} />
      </div>

      {/* Reminder Popup Bubble */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 glass-panel rounded-2xl p-5 shadow-2xl flex flex-col pointer-events-auto border border-blue-500/30"
            style={{
              right: "260px", // Just left of the character
              width: "280px",
              zIndex: 60,
            }}
            onMouseEnter={() => setInteractive(true)}
            onMouseLeave={() => setInteractive(false)}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg ${overdue ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                {overdue ? <ShieldAlert size={20} /> : <Droplet size={20} />}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  {overdue ? "Overdue Hydration!" : "Time to Drink Water"}
                </h3>
                <p className="text-xs text-slate-400">
                  {overdue ? "Your body is waiting..." : `Hi ${userName}, stay healthy!`}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              {overdue
                ? "You missed your reminder. Drinking now will recover your current streak!"
                : "Your body needs fluids to keep you energized. Drink a glass of water!"}
            </p>

            <div className="flex gap-2">
              <button
                onClick={onDoneClick}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-blue-500/20 cursor-pointer active:scale-95 transition-all"
              >
                <Check size={14} /> Done
              </button>
              <button
                onClick={onSnoozeClick}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg cursor-pointer active:scale-95 transition-all"
              >
                <Clock size={14} /> Snooze
              </button>
              <button
                onClick={onSkipClick}
                className="flex items-center justify-center p-2 bg-slate-850 hover:bg-slate-805 border border-slate-750 text-slate-400 hover:text-slate-300 rounded-lg cursor-pointer active:scale-95 transition-all"
                title="Skip reminder"
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
