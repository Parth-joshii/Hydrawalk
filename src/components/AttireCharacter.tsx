import React from "react";

interface AttireCharacterProps {
  gender: string;
  outfit: string; // e.g. "blue", "pink", "green", "dark"
  scale?: number;
  className?: string;
}

export const AttireCharacter: React.FC<AttireCharacterProps> = ({
  gender,
  outfit = "blue",
  scale = 1,
  className = ""
}) => {
  const isFemale = (gender || "Female").toLowerCase() === "female" || (gender || "Female").toLowerCase() === "girl";

  // Map 10 hoodie colors
  const colors: Record<string, string> = {
    blue: "#3b82f6",
    pink: "#ec4899",
    green: "#10b981",
    yellow: "#eab308",
    dark: "#374151",
    red: "#ef4444",
    purple: "#8b5cf6",
    orange: "#f97316",
    teal: "#14b8a6",
    indigo: "#6366f1"
  };

  // Extract color name from string (e.g. "hoodie_blue" -> "blue")
  const colorKey = outfit.replace("hoodie_", "");
  const dressColor = colors[colorKey] || colors.blue;

  const skinColor = "#fed7aa"; // Peach skin
  const pantsColor = "#334155"; // Dark Slate pants
  const hairColor = isFemale ? "#7c2d12" : "#1e293b"; // Female brown, Male dark
  const shoesColor = "#ffffff";

  // Size calculations
  const width = 145 * scale;
  const height = 200 * scale;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 140 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ userSelect: "none" }}
    >
      {/* Shadow */}
      <ellipse cx="70" cy="192" rx="32" ry="5" fill="rgba(0,0,0,0.12)" />

      {/* Legs & Shoes */}
      <rect x="52" y="130" width="12" height="55" rx="4" fill={pantsColor} />
      <rect x="76" y="130" width="12" height="55" rx="4" fill={pantsColor} />
      <path d="M46 182 h18 v10 c0 2-4 2-8 2 h-6 c-3 0-4-2-4-4 z" fill={shoesColor} stroke="#cbd5e1" strokeWidth="1" />
      <path d="M76 182 h18 v10 c0 2-4 2-8 2 h-6 c-3 0-4-2-4-4 z" fill={shoesColor} stroke="#cbd5e1" strokeWidth="1" />

      {/* Torso / Full Hoodie (Covers midriff completely, no crop-top!) */}
      <path d="M40 75 h60 c6 0 10 4 10 10 v43 c0 3-3 6-7 6 H37 c-4 0-7-3-7-6 V85 c0-6 4-10 10-10 z" fill={dressColor} />
      {/* Hoodie pocket */}
      <path d="M50 110 h40 l-4 18 H54 z" fill="rgba(255,255,255,0.18)" />
      {/* Hoodie drawstrings */}
      <line x1="64" y1="78" x2="64" y2="92" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <line x1="76" y1="78" x2="76" y2="92" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />

      {/* Arms & Hands */}
      <path d="M30 80 c-5 10-8 20-8 32 c0 4 3 6 6 4 c4-2 6-12 8-24 z" fill={dressColor} />
      <circle cx="23" cy="115" r="5" fill={skinColor} />
      <path d="M110 80 c5 10 8 20 8 32 c0 4-3 6-6 4 c-4-2-6-12-8-24 z" fill={dressColor} />
      <circle cx="117" cy="115" r="5" fill={skinColor} />

      {/* Head & Face */}
      <rect x="66" y="66" width="8" height="12" fill={skinColor} />
      <circle cx="70" cy="53" r="17" fill={skinColor} />

      {/* Eyes & smile */}
      <circle cx="64" cy="51" r="2" fill="#1e293b" />
      <circle cx="76" cy="51" r="2" fill="#1e293b" />
      <path d="M65 59 Q70 64 75 59" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />

      {/* Hair & Cap styling */}
      {isFemale ? (
        // Girls hair
        <g>
          <path d="M52 48 C 52 33 88 33 88 48 c0 5 4 10 4 15 c-4 0-4-5-8-5 c-6 0-8 6-14 6 s-8-6-14-6 c-4 0-4 5-8 5 c0-5 4-10 4-15" fill={hairColor} />
          {/* Sweet flower pin */}
          <circle cx="83" cy="42" r="3.5" fill="#f43f5e" />
          <circle cx="80" cy="40" r="2" fill="#fef08a" />
          <circle cx="86" cy="44" r="2" fill="#fef08a" />
        </g>
      ) : (
        // Boys cap and hair
        <g>
          <path d="M52 48 C 52 35 88 35 88 48 z" fill={hairColor} />
          {/* Sporty cap */}
          <path d="M52 48 C 52 36 88 36 88 48 z" fill={dressColor} />
          {/* Cap visor facing backward */}
          <path d="M84 45 c12 0 16 6 16 8 s-4 4-10 2 z" fill={dressColor} opacity="0.9" />
          <circle cx="70" cy="37" r="2" fill="#ffffff" />
        </g>
      )}
    </svg>
  );
};
