import React from "react";
import { motion, Variants } from "framer-motion";
import { getAvatarUrl } from "../utils/avatar";

export type CharacterState =
  | "idle"
  | "walking"
  | "waving"
  | "drinking"
  | "smiling"
  | "sad"
  | "happy"
  | "sleeping"
  | "thinking";

interface CharacterProps {
  state: CharacterState;
  outfit?: string;
  scale?: number;
  gender?: string; // 'Female' | 'Male' | 'Other'
}

export const Character: React.FC<CharacterProps> = ({
  state,
  outfit = "0_blue",
  scale = 1,
  gender = "Female",
}) => {
  const characterImage = getAvatarUrl(gender, outfit);
  const width = 150 * scale;
  const height = 200 * scale;

  // Body bob variants per state
  const bodyBobVariants: Variants = {
    idle: {
      y: [0, -3, 0],
      transition: { repeat: Infinity, duration: 2.2, ease: "easeInOut" },
    },
    walking: {
      y: [0, -6, 0],
      transition: { repeat: Infinity, duration: 0.45, ease: "easeInOut" },
    },
    waving: {
      y: [0, -2, 0],
      transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
    },
    drinking: {
      y: [0, -2, 0],
      transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
    },
    happy: {
      y: [0, -18, 0],
      transition: { repeat: Infinity, duration: 0.5, ease: "easeInOut" },
    },
    sleeping: {
      y: [0, -1, 0],
      rotate: [0, 2, 0],
      transition: { repeat: Infinity, duration: 4, ease: "easeInOut" },
    },
    thinking: {
      y: [0, -2, 0],
      transition: { repeat: Infinity, duration: 2, ease: "easeInOut" },
    },
    sad: {
      y: [0, 3, 0],
      transition: { repeat: Infinity, duration: 3, ease: "easeInOut" },
    },
    smiling: {
      y: [0, -3, 0],
      transition: { repeat: Infinity, duration: 2, ease: "easeInOut" },
    },
  };

  // Overlay emoji / expression on top of the image
  const renderOverlay = () => {
    if (state === "sleeping") {
      return (
        <motion.div
          style={{
            position: "absolute",
            right: "5px",
            top: "5px",
            color: "#60a5fa",
            fontWeight: "bold",
            fontSize: `${14 * scale}px`,
            pointerEvents: "none",
          }}
          animate={{ y: [-4, -22], x: [0, 4], opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
        >
          Zzz
        </motion.div>
      );
    }
    if (state === "thinking") {
      return (
        <motion.div
          style={{
            position: "absolute",
            right: "8px",
            top: "10px",
            color: "#f59e0b",
            fontSize: `${20 * scale}px`,
            fontWeight: "bold",
            pointerEvents: "none",
          }}
          animate={{ scale: [0.8, 1.2, 0.8], rotate: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          ?
        </motion.div>
      );
    }
    if (state === "happy") {
      return (
        <div
          style={{
            position: "absolute",
            top: "5px",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: "14px",
            pointerEvents: "none",
          }}
        >
          <motion.span
            animate={{ scale: [1, 1.5, 1], rotate: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 0.6 }}
            style={{ fontSize: `${14 * scale}px` }}
          >
            ⭐
          </motion.span>
          <motion.span
            animate={{ scale: [1.2, 0.8, 1.2], rotate: [0, -15, 0] }}
            transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
            style={{ fontSize: `${14 * scale}px` }}
          >
            ✨
          </motion.span>
        </div>
      );
    }
    if (state === "sad") {
      return (
        <motion.div
          style={{
            position: "absolute",
            top: "30%",
            left: "30%",
            color: "#60a5fa",
            fontSize: `${12 * scale}px`,
            pointerEvents: "none",
          }}
          animate={{ y: [0, 10, 0], opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          💧
        </motion.div>
      );
    }
    if (state === "drinking") {
      return (
        <motion.div
          style={{
            position: "absolute",
            bottom: "30%",
            right: "5px",
            fontSize: `${16 * scale}px`,
            pointerEvents: "none",
          }}
          animate={{ rotate: [-10, 10, -10], y: [0, -2, 0] }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          🧋
        </motion.div>
      );
    }
    if (state === "waving") {
      return (
        <motion.div
          style={{
            position: "absolute",
            top: "25%",
            right: "-5px",
            fontSize: `${18 * scale}px`,
            pointerEvents: "none",
          }}
          animate={{ rotate: [-20, 20, -20] }}
          transition={{ repeat: Infinity, duration: 0.5 }}
        >
          👋
        </motion.div>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        width: `${width}px`,
        height: `${height}px`,
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-end",
        position: "relative",
      }}
    >
      {/* State overlays (Zzz, ?, stars, etc.) */}
      {renderOverlay()}

      {/* Animated girl image */}
      <motion.div
        variants={bodyBobVariants}
        animate={state}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* Walking leg shadow flicker */}
        {state === "walking" && (
          <motion.div
            style={{
              position: "absolute",
              bottom: "0px",
              left: "50%",
              transform: "translateX(-50%)",
              width: `${60 * scale}px`,
              height: `${8 * scale}px`,
              borderRadius: "50%",
              background: "rgba(0,0,0,0.12)",
              filter: "blur(3px)",
            }}
            animate={{ scaleX: [1, 0.7, 1], opacity: [0.5, 0.3, 0.5] }}
            transition={{ repeat: Infinity, duration: 0.45, ease: "easeInOut" }}
          />
        )}

        <img
          src={characterImage}
          alt="HydraWalk Character"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            objectPosition: "bottom",
            userSelect: "none",
            // Slight tilt when sleeping
            transform: state === "sleeping" ? "rotate(5deg)" : "none",
            transition: "transform 0.5s ease",
            // Mirror/flip for walking direction
            filter: state === "sad" ? "grayscale(0.4) brightness(0.85)" : "none",
          }}
        />
      </motion.div>
    </div>
  );
};
