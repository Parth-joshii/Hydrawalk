import React from "react";

interface AttireCharacterProps {
  gender: string;
  outfit: string; // format: "styleIndex_colorId"
  scale?: number;
  className?: string;
}

export const AttireCharacter: React.FC<AttireCharacterProps> = ({
  gender,
  outfit,
  scale = 1,
  className = ""
}) => {
  let styleIndex = 0;
  let colorId = "blue";
  
  if (outfit && outfit.includes("_")) {
    const parts = outfit.split("_");
    styleIndex = parseInt(parts[0], 10) || 0;
    colorId = parts[1] || "blue";
  } else {
    // Legacy support
    if (outfit === "hoodie_pink") colorId = "pink";
    else if (outfit === "hoodie_dark") colorId = "dark";
    else colorId = "blue";
  }

  const isFemale = (gender || "male").toLowerCase() === "female" || (gender || "male").toLowerCase() === "girl";

  // Dress Colors
  const colors: Record<string, string> = {
    blue: "#3b82f6",
    pink: "#ec4899",
    green: "#10b981",
    yellow: "#f59e0b",
    dark: "#374151"
  };
  const dressColor = colors[colorId] || "#3b82f6";
  const skinColor = "#fed7aa"; // Sweet peach tan
  const pantsColor = styleIndex % 3 === 0 ? "#334155" : styleIndex % 3 === 1 ? "#475569" : "#1e293b";
  const hairColor = styleIndex % 4 === 0 ? "#451a03" : styleIndex % 4 === 1 ? "#172554" : styleIndex % 4 === 2 ? "#b45309" : "#1e293b";
  const shoesColor = styleIndex % 2 === 0 ? "#ef4444" : "#ffffff";

  // Size calculations
  const width = 140 * scale;
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
      {/* 1. Shadow Underneath */}
      <ellipse cx="70" cy="192" rx="35" ry="5" fill="rgba(0,0,0,0.1)" />

      {/* 2. Legs & Shoes (Full Attire) */}
      {/* Left Leg */}
      <rect x="52" y="130" width="12" height="55" rx="4" fill={pantsColor} />
      {/* Right Leg */}
      <rect x="76" y="130" width="12" height="55" rx="4" fill={pantsColor} />

      {/* Left Shoe */}
      <path d="M46 182 h18 v10 c0 2-4 2-8 2 h-6 c-3 0-4-2-4-4 z" fill={shoesColor} stroke="#cbd5e1" strokeWidth="1" />
      {/* Right Shoe */}
      <path d="M76 182 h18 v10 c0 2-4 2-8 2 h-6 c-3 0-4-2-4-4 z" fill={shoesColor} stroke="#cbd5e1" strokeWidth="1" />

      {/* 3. Torso / Dress (Color applied directly to clothes) */}
      {styleIndex === 4 ? (
        // Suit/Blazer style
        <g>
          <path d="M42 75 h56 l4 55 H38 z" fill={dressColor} />
          {/* Shirt V collar */}
          <path d="M60 75 l10 20 l10-20 z" fill="#ffffff" />
          {/* Tie */}
          <path d="M68 82 l2 15 l-2 2 l-2-2 z" fill="#ef4444" />
        </g>
      ) : styleIndex === 8 ? (
        // Vest style
        <path d="M48 75 h44 l4 55 H44 z" fill={dressColor} />
      ) : (
        // Hoodie style (Default/Other)
        <g>
          {/* Main hoodie body */}
          <path d="M40 75 h60 c6 0 10 4 10 10 v40 c0 4-4 8-8 8 H38 c-4 0-8-4-8-8 V85 c0-6 4-10 10-10 z" fill={dressColor} />
          {/* Hoodie pocket */}
          <path d="M50 110 h40 l-4 18 H54 z" fill="rgba(255,255,255,0.15)" />
          {/* Hoodie drawstrings */}
          <line x1="65" y1="78" x2="65" y2="92" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
          <line x1="75" y1="78" x2="75" y2="92" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}

      {/* 4. Arms & Hands */}
      {/* Left Arm */}
      <path d="M30 80 c-5 10-8 20-8 32 c0 4 3 6 6 4 c4-2 6-12 8-24 z" fill={dressColor} />
      <circle cx="23" cy="115" r="5" fill={skinColor} />
      {/* Right Arm */}
      {styleIndex === 3 ? (
        // Waving/Active arm pose
        <g>
          <path d="M110 80 c5-10 12-18 20-22 c3-2 6 1 4 4 c-4 6-12 16-16 24 z" fill={dressColor} />
          <circle cx="132" cy="58" r="5" fill={skinColor} />
        </g>
      ) : (
        // Normal side arm pose
        <g>
          <path d="M110 80 c5 10 8 20 8 32 c0 4-3 6-6 4 c-4-2-6-12-8-24 z" fill={dressColor} />
          <circle cx="117" cy="115" r="5" fill={skinColor} />
        </g>
      )}

      {/* 5. Head & Neck */}
      <rect x="66" y="66" width="8" height="12" fill={skinColor} />
      <circle cx="70" cy="53" r="17" fill={skinColor} />

      {/* Eyes */}
      <circle cx="64" cy="51" r="2" fill="#1e293b" />
      <circle cx="76" cy="51" r="2" fill="#1e293b" />
      
      {/* Mouth */}
      {styleIndex === 5 ? (
        // Cool smile
        <path d="M66 59 Q70 63 74 59" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
      ) : (
        // Happy grin
        <path d="M65 59 Q70 64 75 59" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
      )}

      {/* Glasses Accessory */}
      {styleIndex === 9 && (
        <g stroke="#334155" strokeWidth="2">
          <circle cx="64" cy="51" r="5" fill="none" />
          <circle cx="76" cy="51" r="5" fill="none" />
          <line x1="69" y1="51" x2="71" y2="51" />
        </g>
      )}

      {/* Headphones Accessory */}
      {styleIndex === 12 && (
        <g fill="#ef4444" stroke="#1e293b" strokeWidth="1.5">
          {/* Band */}
          <path d="M54 48 A 18 18 0 0 1 86 48" fill="none" stroke="#ef4444" strokeWidth="3" />
          {/* Ear pads */}
          <rect x="50" y="44" width="5" height="12" rx="2" />
          <rect x="85" y="44" width="5" height="12" rx="2" />
        </g>
      )}

      {/* 6. Hair (Varies for Boys vs Girls across 15 styles) */}
      {isFemale ? (
        // Girls Hair Designs
        styleIndex === 1 ? (
          // Bob hair
          <path d="M50 48 C 50 32 90 32 90 48 v15 H82 V55 H58 v8 H50 z" fill={hairColor} />
        ) : styleIndex === 2 ? (
          // Ponytail
          <g>
            <path d="M53 50 C 53 34 87 34 87 50 z" fill={hairColor} />
            <path d="M85 50 c10 0 15 8 12 18 c-2 8-8 10-8 10 s2-8-4-15" fill={hairColor} />
            <circle cx="85" cy="50" r="3" fill="#ef4444" /> {/* Hair tie */}
          </g>
        ) : styleIndex === 3 ? (
          // Long curly locks
          <path d="M53 46 C 53 30 87 30 87 46 c0 10 8 18 8 28 c0 10-6 15-8 22 c-2-5-4-15-4-24 c0-10-8-12-8-12 s0 12-8 12 c-4 0-4 10-4 24 c0 9-2 19-4 24 c-2-7-8-12-8-22 c0-10 8-18 8-28" fill={hairColor} />
        ) : styleIndex === 4 ? (
          // Updo Bun
          <g>
            <path d="M53 50 C 53 34 87 34 87 50 z" fill={hairColor} />
            <circle cx="70" cy="31" r="8" fill={hairColor} />
          </g>
        ) : styleIndex === 6 ? (
          // Cute braids
          <g>
            <path d="M53 50 C 53 34 87 34 87 50 z" fill={hairColor} />
            {/* Left braid */}
            <path d="M52 54 c-4 8 2 16-2 24 c-2 4-6 6-4 8 s4-6 4-10" fill={hairColor} />
            {/* Right braid */}
            <path d="M88 54 c4 8-2 16 2 24 c2 4 6 6 4 8 s-4-6-4-10" fill={hairColor} />
          </g>
        ) : (
          // Default Girl Short-Mid Hair
          <path d="M52 48 C 52 33 88 33 88 48 c0 5 4 10 4 15 c-4 0-4-5-8-5 c-6 0-8 6-14 6 s-8-6-14-6 c-4 0-4 5-8 5 c0-5 4-10 4-15" fill={hairColor} />
        )
      ) : (
        // Boys Hair Designs
        styleIndex === 1 ? (
          // Spiky hair
          <path d="M52 46 l6-8 l6 6 l6-8 l6 8 l6-8 l6 8 C 88 48 88 54 88 54 H52 z" fill={hairColor} />
        ) : styleIndex === 2 ? (
          // Curly top
          <g fill={hairColor}>
            <path d="M53 48 C 53 34 87 34 87 48 z" />
            <circle cx="58" cy="40" r="4" />
            <circle cx="66" cy="38" r="5" />
            <circle cx="74" cy="38" r="5" />
            <circle cx="82" cy="40" r="4" />
          </g>
        ) : styleIndex === 5 ? (
          // Cool Cap
          <g>
            <path d="M52 48 C 52 35 88 35 88 48 z" fill={hairColor} />
            {/* Cap brim */}
            <path d="M48 42 h36 v6 H48 z" fill={dressColor} />
            <path d="M38 48 h16 v4 H38 z" fill={dressColor} />
          </g>
        ) : styleIndex === 7 ? (
          // Beanie
          <path d="M52 50 C 52 34 88 34 88 50 v4 H52 z" fill="#f43f5e" />
        ) : (
          // Default Boy Short Hair
          <path d="M53 48 C 53 34 87 34 87 48 c0 4 2 6 2 8 H51 c0-2 2-4 2-8" fill={hairColor} />
        )
      )}

      {/* Backpack Accessory */}
      {styleIndex === 14 && (
        <g>
          {/* Strap outlines on shoulders */}
          <path d="M42 78 c-2 4-2 15 2 20" stroke="#b45309" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M98 78 c2 4 2 15-2 20" stroke="#b45309" strokeWidth="3.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
};
