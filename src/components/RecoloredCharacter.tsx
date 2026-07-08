import React, { useEffect, useRef } from "react";

interface RecoloredCharacterProps {
  gender: string;
  outfit: string;
  scale?: number;
  className?: string;
}

// RGB to HSL converter
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, l];
}

// HSL to RGB converter
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

// Hex to HSL helper
function hexToHsl(hex: string): [number, number, number] {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return rgbToHsl(r, g, b);
}

export const RecoloredCharacter: React.FC<RecoloredCharacterProps> = ({
  gender,
  outfit = "blue",
  scale = 1,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isFemale = (gender || "Female").toLowerCase() === "female" || (gender || "Female").toLowerCase() === "girl";

  // Load the default original boy/girl PNG character images
  const baseSrc = isFemale ? "/character-girl.png?v=2" : "/character-boy-blue.png?v=2";

  // Parse color option
  let colorId = "blue";
  if (outfit) {
    if (outfit.includes("_")) {
      colorId = outfit.split("_")[0];
    } else {
      colorId = outfit.replace("hoodie_", "");
    }
  }

  // 10 vibrant hoodie colors
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
  const targetHex = colors[colorId] || colors.blue;

  useEffect(() => {
    const img = new Image();
    img.src = baseSrc;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;

      const [targetH, targetS] = hexToHsl(targetHex);

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        if (a === 0) continue;

        const [h, s, l] = rgbToHsl(r, g, b);

        let isHoodie = false;
        if (isFemale) {
          // Girl original green hoodie is Hue between 110 and 175
          isHoodie = h >= 110 && h <= 175 && s > 0.15 && l > 0.15 && l < 0.9;
        } else {
          // Boy original blue hoodie is Hue between 175 and 235
          // Exclude the pants which are very dark (l < 0.3)
          isHoodie = h >= 175 && h <= 235 && s > 0.15 && l > 0.30 && l < 0.9;
        }

        if (isHoodie) {
          const [newR, newG, newB] = hslToRgb(targetH, targetS, l);
          data[i] = newR;
          data[i + 1] = newG;
          data[i + 2] = newB;
        }
      }

      ctx.putImageData(imgData, 0, 0);
    };
  }, [baseSrc, targetHex, isFemale]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: `${150 * scale}px`,
        height: `${200 * scale}px`,
        objectFit: "contain",
        userSelect: "none"
      }}
    />
  );
};
