import React from "react";

interface AttireCharacterProps {
  gender: string;
  outfit: string; // format: "colorId_hairStyleIndex_hairColorId_accessoryId_themeIndex"
  scale?: number;
  className?: string;
}

export const AttireCharacter: React.FC<AttireCharacterProps> = ({
  gender,
  outfit = "blue_0_black_none_0",
  scale = 1,
  className = ""
}) => {
  const isFemale = (gender || "Female").toLowerCase() === "female" || (gender || "Female").toLowerCase() === "girl";

  // 1. Parse custom traits with robust legacy fallback
  let colorId = "blue";
  let hairStyleIndex = 0;
  let hairColorId = "black";
  let accessoryId = "none";
  let themeIndex = 0; // 0: Classic, 1: Ninja, 2: School Uniform, 3: Cyberpunk, 4: Neko Cat-Ear

  if (outfit) {
    if (outfit.includes("_")) {
      const parts = outfit.split("_");
      if (parts.length >= 4) {
        colorId = parts[0];
        hairStyleIndex = parseInt(parts[1], 10) || 0;
        hairColorId = parts[2];
        accessoryId = parts[3];
        if (parts.length === 5) {
          themeIndex = parseInt(parts[4], 10) || 0;
        }
      } else if (parts.length === 2) {
        hairStyleIndex = parseInt(parts[0], 10) || 0;
        colorId = parts[1];
      } else {
        colorId = parts[1] || "blue";
      }
    } else {
      colorId = outfit;
    }
  }

  // Sanitise color
  colorId = colorId.replace("hoodie_", "");

  // Hoodie Dress Colors (10 choices)
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
  const dressColor = colors[colorId] || colors.blue;

  // Hair Colors
  const hairColors: Record<string, string> = {
    black: "#1e293b",
    brown: "#7c2d12",
    blonde: "#eab308",
    red: "#b91c1c"
  };
  const hairColor = hairColors[hairColorId] || hairColors.black;

  const skinColor = "#fed7aa"; // Peach skin
  const pantsColor = themeIndex === 2 ? "#1e293b" : "#334155"; // School pants are dark
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
      {/* Ground Shadow */}
      <ellipse cx="70" cy="192" rx="32" ry="5" fill="rgba(0,0,0,0.12)" />

      {/* Neko Tail (Theme 4) */}
      {themeIndex === 4 && (
        <path d="M96 128 c14 4 20 18 16 28 c-3 8-10 12-16 8 s-8-12 0-18" stroke={hairColor} strokeWidth="5.5" fill="none" strokeLinecap="round" />
      )}

      {/* Legs & Shoes */}
      <rect x="52" y="130" width="12" height="55" rx="4" fill={pantsColor} />
      <rect x="76" y="130" width="12" height="55" rx="4" fill={pantsColor} />
      <path d="M46 182 h18 v10 c0 2-4 2-8 2 h-6 c-3 0-4-2-4-4 z" fill={shoesColor} stroke="#cbd5e1" strokeWidth="1" />
      <path d="M76 182 h18 v10 c0 2-4 2-8 2 h-6 c-3 0-4-2-4-4 z" fill={shoesColor} stroke="#cbd5e1" strokeWidth="1" />

      {/* Torso / Outfit Layer based on Theme */}
      {themeIndex === 1 ? (
        // Theme 1: Shinobi Ninja
        <g>
          {/* Underlayer */}
          <path d="M42 75 h56 v52 H42 z" fill="#1e293b" />
          {/* Sash wraps */}
          <path d="M42 78 l56 30 M98 78 l-56 30" stroke={dressColor} strokeWidth="11" strokeLinecap="round" />
          {/* Obi Sash Belt */}
          <rect x="40" y="118" width="60" height="9" rx="2" fill="#ef4444" />
        </g>
      ) : themeIndex === 2 ? (
        // Theme 2: School Uniform
        isFemale ? (
          // Girls Sailor Outfit
          <g>
            <path d="M42 75 h56 v40 H42 z" fill="#ffffff" />
            {/* Pleated Skirt */}
            <path d="M40 115 h60 l4 20 H36 z" fill={dressColor} />
            {/* Sailor blue collar */}
            <path d="M42 75 l28 18 l28-18 H84 l-14 10 l-14-10 z" fill={dressColor} />
            {/* Red bow */}
            <path d="M68 84 l5 8 l-5 3 l-5-3 z M63 84 l-6 4 l1 3 z M77 84 l6 4 l-1 3 z" fill="#ef4444" />
          </g>
        ) : (
          // Boys Black Blazer (Gakuran)
          <g>
            <path d="M40 75 h60 c6 0 10 4 10 10 v43 c0 3-3 6-7 6 H37 c-4 0-7-3-7-6 V85 c0-6 4-10 10-10 z" fill="#1e293b" />
            {/* Golden buttons and lining */}
            <rect x="68" y="75" width="4" height="56" fill="#fbbf24" />
            <circle cx="63" cy="86" r="2.5" fill="#fbbf24" />
            <circle cx="63" cy="98" r="2.5" fill="#fbbf24" />
            <circle cx="63" cy="110" r="2.5" fill="#fbbf24" />
            <circle cx="63" cy="122" r="2.5" fill="#fbbf24" />
          </g>
        )
      ) : themeIndex === 3 ? (
        // Theme 3: Cyberpunk Neon
        <g>
          {/* Cyber armor plate */}
          <path d="M40 75 h60 c6 0 10 4 10 10 v43 c0 3-3 6-7 6 H37 c-4 0-7-3-7-6 V85 c0-6 4-10 10-10 z" fill="#1f2937" />
          {/* Glowing neon lines */}
          <path d="M46 82 h48 M46 98 h48 M46 114 h48" stroke={dressColor} strokeWidth="3.5" strokeLinecap="round" opacity="0.95" />
          {/* Shoulder pads */}
          <path d="M34 76 h16 v8 H34 z" fill={dressColor} />
          <path d="M90 76 h16 v8 H90 z" fill={dressColor} />
        </g>
      ) : (
        // Theme 0 & 4: Classic Hoodie / Cat-Ear Hoodie
        <g>
          {/* Hoodie Back-Hood Collar */}
          <path d="M46 72 C 46 63 94 63 94 72 z" fill={dressColor} opacity="0.85" />
          {/* Torso / Full Hoodie */}
          <path d="M40 75 h60 c6 0 10 4 10 10 v43 c0 3-3 6-7 6 H37 c-4 0-7-3-7-6 V85 c0-6 4-10 10-10 z" fill={dressColor} />
          
          {/* Whisker Print for Neko (Theme 4) */}
          {themeIndex === 4 ? (
            <g stroke="#1e293b" strokeWidth="2" strokeLinecap="round">
              <line x1="56" y1="105" x2="62" y2="105" />
              <line x1="56" y1="109" x2="60" y2="111" />
              <line x1="78" y1="105" x2="84" y2="105" />
              <line x1="80" y1="111" x2="84" y2="109" />
              <circle cx="70" cy="107" r="3" fill="#ef4444" stroke="none" /> {/* pink nose logo */}
            </g>
          ) : (
            // Classic Hoodie Pocket & Strings
            <g>
              <path d="M50 110 h40 l-4 18 H54 z" fill="rgba(255,255,255,0.18)" />
              <line x1="64" y1="78" x2="64" y2="92" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
              <line x1="76" y1="78" x2="76" y2="92" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            </g>
          )}
        </g>
      )}

      {/* Gold Chain (Signature look for Boy!) */}
      {!isFemale && themeIndex === 0 && (
        <path d="M56 82 Q70 94 84 82" stroke="#f59e0b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      )}

      {/* Arms & Hands */}
      <path d="M30 80 c-5 10-8 20-8 32 c0 4 3 6 6 4 c4-2 6-12 8-24 z" fill={themeIndex === 2 && !isFemale ? "#1e293b" : themeIndex === 3 ? "#1f2937" : dressColor} />
      <circle cx="23" cy="115" r="5" fill={skinColor} />
      {/* Robot metallic arm for Cyberpunk */}
      {themeIndex === 3 ? (
        <g>
          <path d="M110 80 c5 10 8 20 8 32 c0 4-3 6-6 4 c-4-2-6-12-8-24 z" fill="#9ca3af" />
          <circle cx="117" cy="115" r="5" fill="#e5e7eb" />
          <path d="M112 85 l5 24" stroke={dressColor} strokeWidth="1.5" />
        </g>
      ) : (
        <g>
          <path d="M110 80 c5 10 8 20 8 32 c0 4-3 6-6 4 c-4-2-6-12-8-24 z" fill={themeIndex === 2 && !isFemale ? "#1e293b" : dressColor} />
          <circle cx="117" cy="115" r="5" fill={skinColor} />
        </g>
      )}

      {/* Head & Neck */}
      <rect x="66" y="66" width="8" height="12" fill={skinColor} />
      <circle cx="70" cy="53" r="17" fill={skinColor} />

      {/* Cute Anime Glossy Eyes */}
      <g fill="#1e293b">
        <ellipse cx="64" cy="51" rx="2.5" ry="3.5" />
        <circle cx="64.8" cy="49.8" r="0.8" fill="#ffffff" />
        <ellipse cx="76" cy="51" rx="2.5" ry="3.5" />
        <circle cx="76.8" cy="49.8" r="0.8" fill="#ffffff" />
      </g>

      {/* Soft Pink Cheek Blush */}
      <ellipse cx="58" cy="55" rx="3.5" ry="1.5" fill="#f43f5e" opacity="0.25" />
      <ellipse cx="82" cy="55" rx="3.5" ry="1.5" fill="#f43f5e" opacity="0.25" />

      {/* Smile */}
      <path d="M65 59 Q70 64 75 59" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />

      {/* Furry Neko Cat Ears (Theme 4) */}
      {themeIndex === 4 && (
        <g fill={hairColor}>
          {/* Left Cat Ear */}
          <path d="M48 38 l9-13 l5 13 z" />
          <path d="M50 38 l6-9 l3 9 z" fill="#fda4af" />
          {/* Right Cat Ear */}
          <path d="M92 38 l-9-13 l-5 13 z" />
          <path d="M90 38 l-6-9 l-3 9 z" fill="#fda4af" />
        </g>
      )}

      {/* Hair styling (Boy vs Girl) */}
      {isFemale ? (
        // Girls Hair styles (0: Long, 1: Bob, 2: Ponytail, 3: Curly, 4: Bun, 5: Braids)
        hairStyleIndex === 1 ? (
          // Bob cut
          <path d="M50 48 C 50 32 90 32 90 48 v15 H82 V55 H58 v8 H50 z" fill={hairColor} />
        ) : hairStyleIndex === 2 ? (
          // Ponytail
          <g>
            <path d="M53 50 C 53 34 87 34 87 50 z" fill={hairColor} />
            <path d="M85 50 c10 0 15 8 12 18 c-2 8-8 10-8 10 s2-8-4-15" fill={hairColor} />
            <circle cx="85" cy="50" r="3" fill="#ef4444" />
          </g>
        ) : hairStyleIndex === 3 ? (
          // Curly locks
          <path d="M53 46 C 53 30 87 30 87 46 c0 10 8 18 8 28 c0 10-6 15-8 22 c-2-5-4-15-4-24 c0-10-8-12-8-12 s0 12-8 12 c-4 0-4 10-4 24 c0 9-2 19-4 24 c-2-7-8-12-8-22 c0-10 8-18 8-28" fill={hairColor} />
        ) : hairStyleIndex === 4 ? (
          // Updo Bun
          <g>
            <path d="M53 50 C 53 34 87 34 87 50 z" fill={hairColor} />
            <circle cx="70" cy="31" r="8" fill={hairColor} />
          </g>
        ) : hairStyleIndex === 5 ? (
          // Braids
          <g>
            <path d="M53 50 C 53 34 87 34 87 50 z" fill={hairColor} />
            <path d="M52 54 c-4 8 2 16-2 24 c-2 4-6 6-4 8 s4-6 4-10" fill={hairColor} />
            <path d="M88 54 c4 8-2 16 2 24 c2 4 6 6 4 8 s-4-6-4-10" fill={hairColor} />
          </g>
        ) : (
          // Default: Long straight hair (with flower pin)
          <g>
            <path d="M52 48 C 52 33 88 33 88 48 c0 5 4 10 4 15 c-4 0-4-5-8-5 c-6 0-8 6-14 6 s-8-6-14-6 c-4 0-4 5-8 5 c0-5 4-10 4-15" fill={hairColor} />
            <circle cx="83" cy="42" r="3" fill="#f43f5e" />
            <circle cx="80" cy="40" r="1.5" fill="#fef08a" />
            <circle cx="86" cy="44" r="1.5" fill="#fef08a" />
          </g>
        )
      ) : (
        // Boys Hair styles (0: Short, 1: Spiky, 2: Curly top, 3: Shag, 4: Parted, 5: Crop)
        hairStyleIndex === 1 ? (
          // Spiky
          <path d="M52 46 l6-8 l6 6 l6-8 l6 8 l6-8 l6 8 C 88 48 88 54 88 54 H52 z" fill={hairColor} />
        ) : hairStyleIndex === 2 ? (
          // Curly top
          <g fill={hairColor}>
            <path d="M53 48 C 53 34 87 34 87 48 z" />
            <circle cx="58" cy="40" r="4" />
            <circle cx="66" cy="38" r="5" />
            <circle cx="74" cy="38" r="5" />
            <circle cx="82" cy="40" r="4" />
          </g>
        ) : hairStyleIndex === 3 ? (
          // Shag
          <path d="M52 48 C 52 34 88 34 88 48 c0 8 4 10 4 14 H50 c0-4 2-10 2-14" fill={hairColor} />
        ) : hairStyleIndex === 4 ? (
          // Parted
          <path d="M52 48 C 52 34 88 34 88 48 c-4 0-6 4-18 4 s-14-4-18-4" fill={hairColor} />
        ) : hairStyleIndex === 5 ? (
          // Crop
          <path d="M54 48 C 54 38 86 38 86 48 H54" fill={hairColor} />
        ) : (
          // Default: Short
          <path d="M53 48 C 53 34 87 34 87 48 c0 4 2 6 2 8 H51 c0-2 2-4 2-8" fill={hairColor} />
        )
      )}

      {/* Shinobi Forehead Headband (Theme 1) */}
      {themeIndex === 1 && (
        <g>
          {/* Band */}
          <rect x="53" y="44" width="34" height="6" fill="#1e293b" />
          {/* Metal plate */}
          <rect x="64" y="44" width="12" height="6" fill="#cbd5e1" />
          {/* Hidden leaf village dot */}
          <circle cx="70" cy="47" r="1.5" fill="#1e293b" />
        </g>
      )}

      {/* Cyber Visor (Theme 3) */}
      {themeIndex === 3 && (
        <rect x="54" y="46" width="32" height="7" rx="2.5" fill={dressColor} opacity="0.85" stroke="#ffffff" strokeWidth="1" />
      )}

      {/* Accessories (glasses, headphones, cap, beanie) */}
      {accessoryId === "glasses" && (
        <g stroke="#334155" strokeWidth="2">
          <circle cx="64" cy="51" r="5" fill="none" />
          <circle cx="76" cy="51" r="5" fill="none" />
          <line x1="69" y1="51" x2="71" y2="51" />
        </g>
      )}

      {accessoryId === "headphones" && (
        <g fill="#ef4444" stroke="#1e293b" strokeWidth="1.5">
          <path d="M54 48 A 18 18 0 0 1 86 48" fill="none" stroke="#ef4444" strokeWidth="3" />
          <rect x="50" y="44" width="5" height="12" rx="2" />
          <rect x="85" y="44" width="5" height="12" rx="2" />
        </g>
      )}

      {accessoryId === "cap" && (
        <g fill={dressColor}>
          <path d="M52 46 C 52 34 88 34 88 46 z" />
          <path d="M84 45 c8 0 12 4 12 6 s-3 3-8 1 z" />
        </g>
      )}

      {accessoryId === "beanie" && (
        <g>
          <path d="M52 48 C 52 32 88 32 88 48 v4 H52 z" fill="#ef4444" />
          <circle cx="70" cy="30" r="5" fill="#ffffff" stroke="#ef4444" strokeWidth="1" />
        </g>
      )}
    </svg>
  );
};
