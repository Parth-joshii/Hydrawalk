import React from "react";
import { motion, Variants } from "framer-motion";

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
  outfit?: string; // 'hoodie_blue' | 'hoodie_pink' | 'hoodie_dark'
  scale?: number;
}

export const Character: React.FC<CharacterProps> = ({
  state,
  outfit = "hoodie_blue",
  scale = 1,
}) => {
  // Determine color based on outfit
  const getHoodieColor = () => {
    switch (outfit) {
      case "hoodie_pink":
        return "#f687b3"; // pastel pink
      case "hoodie_dark":
        return "#1e293b"; // sleek slate dark
      case "hoodie_blue":
      default:
        return "#60a5fa"; // soft blue
    }
  };

  const hoodieColor = getHoodieColor();
  const skinColor = "#ffd6cc";
  const hairColor = "#78350f"; // warm brown
  const jeansColor = "#1e3a8a"; // dark denim
  const shoeColor = "#f8fafc"; // white

  // Face variations based on state
  const renderFace = () => {
    const isSleeping = state === "sleeping";
    const isSad = state === "sad";
    const isSmiling = state === "smiling" || state === "happy";
    const isDrinking = state === "drinking";

    return (
      <g id="face">
        {/* Blush cheeks */}
        <circle cx="65" cy="53" r="4" fill="#f87171" opacity="0.4" />
        <circle cx="85" cy="53" r="4" fill="#f87171" opacity="0.4" />

        {/* Eyes */}
        {isSleeping ? (
          // Sleeping eyes: curved closed lines
          <g>
            <path d="M 60,50 Q 64,53 68,50" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M 82,50 Q 86,53 90,50" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        ) : isSad ? (
          // Sad/drooping eyes
          <g>
            <path d="M 60,51 Q 64,48 68,51" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 82,51 Q 86,48 90,51" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Tear drop */}
            <motion.path
              d="M 61,54 Q 60,58 62,58 Q 63,58 63,55 Z"
              fill="#60a5fa"
              animate={{ y: [0, 4, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </g>
        ) : isSmiling ? (
          // Smiling arched eyes
          <g>
            <path d="M 60,51 Q 64,46 68,51" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 82,51 Q 86,46 90,51" stroke="#1f2937" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>
        ) : (
          // Standard blinking eyes
          <g>
            <motion.ellipse
              cx="64"
              cy="50"
              rx="2.5"
              ry="3.5"
              fill="#1f2937"
              animate={{ ry: [3.5, 0.1, 3.5] }}
              transition={{ repeat: Infinity, repeatDelay: 3.5, duration: 0.2 }}
            />
            <motion.ellipse
              cx="86"
              cy="50"
              rx="2.5"
              ry="3.5"
              fill="#1f2937"
              animate={{ ry: [3.5, 0.1, 3.5] }}
              transition={{ repeat: Infinity, repeatDelay: 3.5, duration: 0.2 }}
            />
          </g>
        )}

        {/* Mouth */}
        {isDrinking ? (
          // Round open mouth for straw/drinking
          <circle cx="75" cy="59" r="2.5" fill="#991b1b" stroke="#1f2937" strokeWidth="1" />
        ) : isSad ? (
          // Curved down mouth
          <path d="M 72,61 Q 75,58 78,61" stroke="#1f2937" strokeWidth="2" fill="none" strokeLinecap="round" />
        ) : isSmiling ? (
          // Wide open happy smile
          <path d="M 71,57 Q 75,64 79,57 Z" fill="#991b1b" stroke="#1f2937" strokeWidth="1.5" strokeLinecap="round" />
        ) : (
          // Cute little smile
          <path d="M 72,58 Q 75,60 78,58" stroke="#1f2937" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        )}
      </g>
    );
  };

  // Body bobbing variants based on states
  const bodyBobVariants: Variants = {
    idle: {
      y: [0, -2, 0],
      transition: { repeat: Infinity, duration: 2, ease: "easeInOut" },
    },
    walking: {
      y: [0, -4, 0],
      transition: { repeat: Infinity, duration: 0.45, ease: "easeInOut" },
    },
    waving: {
      y: [0, -1, 0],
      transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
    },
    drinking: {
      y: [0, -1, 0],
      transition: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
    },
    happy: {
      y: [0, -15, 0],
      transition: { repeat: Infinity, duration: 0.5, ease: "easeInOut" },
    },
    sleeping: {
      y: [0, -1, 0],
      transition: { repeat: Infinity, duration: 4, ease: "easeInOut" },
    },
    thinking: {
      y: [0, -1, 0],
      transition: { repeat: Infinity, duration: 2, ease: "easeInOut" },
    },
    sad: {
      y: [0, 2, 0],
      transition: { repeat: Infinity, duration: 3, ease: "easeInOut" },
    },
  };

  // Arm animations
  const leftArmRotate = () => {
    if (state === "walking") return [20, -20, 20];
    if (state === "happy") return [-140, -140];
    return [0, 0];
  };

  const rightArmRotate = () => {
    if (state === "waving") return [-140, -100, -140]; // wave arm back and forth
    if (state === "drinking") return [-130, -125, -130]; // bring bottle to mouth
    if (state === "walking") return [-20, 20, -20]; // opposite to left arm
    if (state === "happy") return [-140, -140]; // both arms up
    if (state === "thinking") return [-100, -100]; // finger on chin
    return [0, 0];
  };

  return (
    <div
      style={{
        width: `${150 * scale}px`,
        height: `${200 * scale}px`,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* Floating details (e.g. Zzz for sleeping, ? for thinking) */}
      {state === "sleeping" && (
        <motion.div
          style={{ position: "absolute", right: "20px", top: "10px", color: "#60a5fa", fontWeight: "bold", fontSize: "14px" }}
          animate={{ y: [-5, -25], x: [0, 5], opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
        >
          Zzz
        </motion.div>
      )}
      {state === "thinking" && (
        <motion.div
          style={{ position: "absolute", right: "30px", top: "15px", color: "#f59e0b", fontSize: "20px", fontWeight: "bold" }}
          animate={{ scale: [0.8, 1.2, 0.8], rotate: [-5, 5, -5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          ?
        </motion.div>
      )}
      {state === "happy" && (
        <div style={{ position: "absolute", top: "10px", display: "flex", gap: "20px" }}>
          <motion.span animate={{ scale: [1, 1.5, 1], rotate: [0, 15, 0] }} transition={{ repeat: Infinity, duration: 0.6 }} className="text-yellow-400">⭐</motion.span>
          <motion.span animate={{ scale: [1.2, 0.8, 1.2], rotate: [0, -15, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="text-blue-400">✨</motion.span>
        </div>
      )}

      {/* SVG Character */}
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 150 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ transformOrigin: "bottom center" }}
      >
        <g id="character-group">
          {/* LEGS: Behind body */}
          {/* Left Leg */}
          <motion.g
            id="left-leg"
            style={{ transformOrigin: "63px 120px" }}
            animate={
              state === "walking"
                ? { rotate: [20, -25, 20] }
                : state === "sleeping"
                ? { rotate: [90], y: [10], x: [-15] }
                : { rotate: 0 }
            }
            transition={{
              repeat: Infinity,
              duration: state === "walking" ? 0.45 : 0.8,
              ease: "easeInOut",
            }}
          >
            {/* Jeans leg */}
            <path d="M 58,120 L 68,120 L 66,165 L 56,165 Z" fill={jeansColor} />
            {/* White Shoe */}
            <path
              d="M 54,165 C 54,161 68,161 68,165 L 68,172 L 52,172 Z"
              fill={shoeColor}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          </motion.g>

          {/* Right Leg */}
          <motion.g
            id="right-leg"
            style={{ transformOrigin: "87px 120px" }}
            animate={
              state === "walking"
                ? { rotate: [-20, 25, -20] }
                : state === "sleeping"
                ? { rotate: [90], y: [10], x: [-15] }
                : { rotate: 0 }
            }
            transition={{
              repeat: Infinity,
              duration: state === "walking" ? 0.45 : 0.8,
              ease: "easeInOut",
            }}
          >
            {/* Jeans leg */}
            <path d="M 82,120 L 92,120 L 94,165 L 84,165 Z" fill={jeansColor} />
            {/* White Shoe */}
            <path
              d="M 82,165 C 82,161 96,161 96,165 L 98,172 L 80,172 Z"
              fill={shoeColor}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          </motion.g>

          {/* TORSO & ARMS & HEAD (Bobs up/down together) */}
          <motion.g
            id="upper-body"
            variants={bodyBobVariants}
            animate={state}
          >
            {/* Back Hair */}
            <path
              d="M 45,45 Q 75,20 105,45 L 110,95 Q 75,100 40,95 Z"
              fill={hairColor}
            />

            {/* Left Arm (behind body when walking/normal, but animateable) */}
            <motion.g
              id="left-arm"
              style={{ transformOrigin: "52px 85px" }}
              animate={{ rotate: leftArmRotate() }}
              transition={{
                repeat: state === "walking" ? Infinity : 0,
                duration: 0.45,
                ease: "easeInOut",
              }}
            >
              <path
                d="M 48,83 C 35,95 32,105 32,118 C 32,122 38,122 38,118 C 38,109 41,102 52,91 Z"
                fill={hoodieColor}
              />
              {/* Hand */}
              <circle cx="33" cy="120" r="3.5" fill={skinColor} />
            </motion.g>

            {/* Torso: Hoodie */}
            <path
              d="M 50,80 Q 75,76 100,80 L 105,122 Q 75,128 45,122 Z"
              fill={hoodieColor}
            />
            {/* Hoodie pocket */}
            <path
              d="M 58,105 Q 75,112 92,105 L 88,120 Q 75,124 62,120 Z"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.5"
              opacity="0.3"
            />
            {/* Hoodie strings */}
            <path d="M 68,82 L 68,96" stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 82,82 L 82,96" stroke="#f8fafc" strokeWidth="1.5" strokeLinecap="round" />

            {/* Head (neck + face + front hair) */}
            <g id="head-group">
              {/* Neck */}
              <rect x="71" y="70" width="8" height="12" fill={skinColor} />

              {/* Face background */}
              <circle cx="75" cy="50" r="22" fill={skinColor} />

              {/* Face features (eyes, mouth, cheeks) */}
              {renderFace()}

              {/* Front Hair bangs */}
              <path
                d="M 53,35 C 55,27 95,27 97,35 C 92,34 85,38 82,41 C 78,39 72,40 68,43 C 62,39 56,36 53,35 Z"
                fill={hairColor}
              />
              {/* Hair strands framing face */}
              <path
                d="M 53,35 Q 50,55 53,70 M 97,35 Q 100,55 97,70"
                stroke={hairColor}
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              
              {/* Hoodie cap (on back of head) */}
              <path
                d="M 53,34 C 53,16 97,16 97,34 C 103,42 105,58 100,68 C 96,73 90,75 88,75 L 62,75 C 60,75 54,73 50,68 C 45,58 47,42 53,34 Z"
                fill={hoodieColor}
                opacity="0.15"
              />
            </g>

            {/* Right Arm (rendered in front of body) */}
            <motion.g
              id="right-arm"
              style={{ transformOrigin: "98px 85px" }}
              animate={{ rotate: rightArmRotate() }}
              transition={{
                repeat: state === "walking" || state === "waving" ? Infinity : 0,
                duration: state === "walking" ? 0.45 : 0.8,
                ease: "easeInOut",
              }}
            >
              {/* Normal down arm */}
              {state !== "drinking" && state !== "waving" && state !== "happy" && state !== "thinking" ? (
                <g>
                  <path
                    d="M 102,83 C 115,95 118,105 118,118 C 118,122 112,122 112,118 C 112,109 109,102 98,91 Z"
                    fill={hoodieColor}
                  />
                  {/* Hand */}
                  <circle cx="117" cy="120" r="3.5" fill={skinColor} />
                  
                  {/* Water bottle carried in hand */}
                  <g id="carried-bottle" transform="translate(115, 122)">
                    {/* Transparent plastic body */}
                    <rect x="-3" y="0" width="7" height="14" rx="1.5" fill="rgba(191, 219, 254, 0.4)" stroke="#60a5fa" strokeWidth="0.8" />
                    {/* Bottle cap */}
                    <rect x="-1.5" y="-3" width="4.0" height="3" fill="#2563eb" rx="0.5" />
                    {/* Water content (half full/empty visual) */}
                    <rect x="-2.2" y="5" width="5.4" height="8" rx="0.8" fill="#3b82f6" opacity="0.7" />
                  </g>
                </g>
              ) : state === "drinking" ? (
                // Arm raised holding bottle to mouth
                <g>
                  <path
                    d="M 98,85 Q 115,80 94,62"
                    stroke={hoodieColor}
                    strokeWidth="9.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Hand near mouth */}
                  <circle cx="94" cy="62" r="3.5" fill={skinColor} />
                  
                  {/* Bottle tilted to mouth */}
                  <g id="drinking-bottle" transform="translate(90, 60) rotate(-70)">
                    <rect x="-3" y="0" width="7" height="14" rx="1.5" fill="rgba(191, 219, 254, 0.4)" stroke="#60a5fa" strokeWidth="0.8" />
                    <rect x="-1.5" y="-3" width="4" height="3" fill="#2563eb" rx="0.5" />
                    {/* Water flowing out / empty */}
                    <rect x="-2.2" y="8" width="5.4" height="5" rx="0.8" fill="#3b82f6" opacity="0.6" />
                  </g>
                </g>
              ) : state === "thinking" ? (
                // Arm bent with finger to chin
                <g>
                  <path
                    d="M 98,85 Q 115,90 85,67"
                    stroke={hoodieColor}
                    strokeWidth="9.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx="84" cy="66" r="3.5" fill={skinColor} />
                </g>
              ) : (
                // Waving / Happy: Arm fully raised up
                <g>
                  <path
                    d="M 98,85 Q 115,65 110,40"
                    stroke={hoodieColor}
                    strokeWidth="9.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Hand */}
                  <circle cx="109" cy="38" r="3.5" fill={skinColor} />
                </g>
              )}
            </motion.g>
          </motion.g>
        </g>
      </svg>
    </div>
  );
};
