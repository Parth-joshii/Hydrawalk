import React, { useState, useEffect } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Droplet, Clock, Check, ShieldAlert } from "lucide-react";
import { ChromaKeyVideo } from "./ChromaKeyVideo";

export const OverlayView: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [userName, setUserName] = useState("Friend");
  const [showPopup, setShowPopup] = useState(false);
  const [overdue, setOverdue] = useState(false);

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
          setVisible(true);
          setOverdue(false);
          setShowPopup(true);
        }
      );

      // 2. Overdue event
      unlistenOverdue = await listen("reminder-overdue", () => {
        setOverdue(true);
      });

      // 3. Action completions forwarded from main window
      unlistenDone = await listen("action-done", () => {
        handleActionResponse();
      });

      unlistenSnooze = await listen("action-snooze", () => {
        handleActionResponse();
      });

      unlistenSkip = await listen("action-skip", () => {
        handleActionResponse();
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

  // Click-through toggle based on mouse hover over interactive elements
  const setInteractive = (interactive: boolean) => {
    invoke("set_overlay_click_through", { ignore: !interactive });
  };

  const handleActionResponse = async () => {
    setShowPopup(false);
    setVisible(false);
    try {
      await getCurrentWindow().hide();
    } catch (err) {
      console.error("Failed to hide overlay window:", err);
    }
  };

  // Click triggers sent back to AppContext
  const onDoneClick = () => {
    emit("overlay-done", { amount: 250 });
  };

  const onSnoozeClick = () => {
    emit("overlay-snooze");
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-center justify-center transparent-bg select-none pointer-events-none">
      
      {/* Centered HUD Overlay card */}
      {showPopup && (
        <div
          className="flex flex-col items-center gap-6 p-8 rounded-3xl glass-panel border border-blue-500/20 shadow-2xl pointer-events-auto"
          onMouseEnter={() => setInteractive(true)}
          onMouseLeave={() => setInteractive(false)}
          style={{
            width: "360px",
            background: "rgba(15, 23, 42, 0.75)",
            backdropFilter: "blur(12px)",
            zIndex: 100
          }}
        >
          {/* ChromaKey video player in place of avatar */}
          <div className="relative w-64 h-64 rounded-2xl overflow-hidden flex items-center justify-center bg-slate-950/20">
            <ChromaKeyVideo width={256} height={256} className="w-full h-full object-contain" />
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className={`p-1.5 rounded-lg ${overdue ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                {overdue ? <ShieldAlert size={16} /> : <Droplet size={16} />}
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                {overdue ? "Overdue Hydration!" : "Time to Drink Water"}
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              {overdue ? "Your body is waiting..." : `Hi ${userName}, stay healthy!`}
            </p>
          </div>

          <div className="flex gap-3 w-full">
            <button
              onClick={onDoneClick}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-650 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-500/10 cursor-pointer active:scale-95 transition-all"
            >
              <Check size={14} /> Done
            </button>
            <button
              onClick={onSnoozeClick}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-4 bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-350 text-xs font-semibold rounded-xl cursor-pointer active:scale-95 transition-all"
            >
              <Clock size={14} /> Snooze
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
