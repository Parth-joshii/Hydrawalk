import React from "react";
import { motion, Variants } from "framer-motion";
import { AttireCharacter } from "./AttireCharacter";

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
      transition: { repeat: Infinity, duration: 1.2, ease: "easeInOut" },
    },
    smiling: {
      y: [0, -3, 0],
      transition: { repeat: Infinity, duration: 2.0, ease: "easeInOut" },
    },
    sad: {
      y: [0, 1, 0],
      transition: { repeat: Infinity, duration: 3.0, ease: "easeInOut" },
    },
    happy: {
      y: [0, -8, 0],
      transition: { repeat: Infinity, duration: 0.6, ease: "easeInOut" },
    },
    sleeping: {
      y: [0, 2, 0],
      transition: { repeat: Infinity, duration: 4.0, ease: "easeInOut" },
    },
    thinking: {
      y: [0, -2, 0],
      transition: { repeat: Infinity, duration: 2.5, ease: "easeInOut" },
    },
  };

  const renderOverlay = () => {
    switch (state) {
      case "sleeping":
        return (
          <motion.div
            style={{
              position: "absolute",
              top: `${15 * scale}px`,
              right: `${20 * scale}px`,
              color: "#a87ffb",
              fontWeight: "bold",
              fontSize: `${14 * scale}px`,
              zIndex: 10,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0, 1, 0],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
          >
            Zzz...
          </motion.div>
        );
      case "thinking":
        return (
          <motion.div
            style={{
              position: "absolute",
              top: `${10 * scale}px`,
              left: `${15 * scale}px`,
              color: "#60a5fa",
              fontWeight: "bold",
              fontSize: `${20 * scale}px`,
              zIndex: 10,
            }}
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0],
            }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            ?
          </motion.div>
        );
      case "happy":
        return (
          <motion.div
            style={{
              position: "absolute",
              top: `${5 * scale}px`,
              color: "#f472b6",
              fontSize: `${12 * scale}px`,
              zIndex: 10,
            }}
            animate={{
              y: [10, -15],
              opacity: [0, 1, 0],
            }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            ✨
          </motion.div>
        );
      default:
        return null;
    }
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
          transform: state === "sleeping" ? "rotate(5deg)" : "none",
          transition: "transform 0.5s ease",
          filter: state === "sad" ? "grayscale(0.4) brightness(0.85)" : "none",
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

        <AttireCharacter
          gender={gender}
          outfit={outfit}
          scale={scale}
        />
      </motion.div>
    </div>
  );
};
