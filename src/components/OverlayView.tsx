import React, { useState, useEffect } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { ChromaKeyVideo } from "./ChromaKeyVideo";

export const OverlayView: React.FC = () => {
  const [visible, setVisible] = useState(false);

  // Set initial click-through
  useEffect(() => {
    invoke("set_overlay_click_through", { ignore: true });
  }, []);

  // Listen to Tauri events from the background reminder engine
  useEffect(() => {
    let unlistenStart: () => void;
    let unlistenDone: () => void;
    let unlistenSnooze: () => void;
    let unlistenSkip: () => void;

    async function setupListeners() {
      // 1. Start reminder event
      unlistenStart = await listen(
        "start-reminder",
        () => {
          setVisible(true);
        }
      );

      // 2. Action completions forwarded from main window
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

  if (!visible) return null;

  return (
    <div className="fixed inset-0 w-screen h-screen flex items-end justify-start p-10 transparent-bg select-none pointer-events-none">
      <div
        className="pointer-events-auto cursor-pointer active:scale-95 transition-all"
        onMouseEnter={() => setInteractive(true)}
        onMouseLeave={() => setInteractive(false)}
        onClick={onDoneClick}
        style={{ zIndex: 100 }}
        title="Click to drink water"
      >
        {/* ChromaKey video player displayed at the bottom left without card */}
        <ChromaKeyVideo width={320} height={320} className="w-full h-full object-contain" />
      </div>
    </div>
  );
};
