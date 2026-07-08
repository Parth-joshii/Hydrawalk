import React, { useEffect, useRef } from "react";

interface RecoloredCharacterProps {
  gender: string;
  outfit: string; // format: "colorId_accessoryId_headId"
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

// Darken/lighten hex colors for realistic vector shadows
function adjustBrightness(hex: string, percent: number): string {
  const cleanHex = hex.replace("#", "");
  let r = parseInt(cleanHex.substring(0, 2), 16);
  let g = parseInt(cleanHex.substring(2, 4), 16);
  let b = parseInt(cleanHex.substring(4, 6), 16);

  r = Math.max(0, Math.min(255, r + (r * percent) / 100));
  g = Math.max(0, Math.min(255, g + (g * percent) / 100));
  b = Math.max(0, Math.min(255, b + (b * percent) / 100));

  const rs = Math.round(r).toString(16).padStart(2, "0");
  const gs = Math.round(g).toString(16).padStart(2, "0");
  const bs = Math.round(b).toString(16).padStart(2, "0");
  return `#${rs}${gs}${bs}`;
}

export const RecoloredCharacter: React.FC<RecoloredCharacterProps> = ({
  gender,
  outfit = "blue_none_none",
  scale = 1,
  className = ""
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isFemale = (gender || "Female").toLowerCase() === "female" || (gender || "Female").toLowerCase() === "girl";

  // Load the default original boy/girl PNG character images
  const baseSrc = isFemale ? "/character-girl.png?v=3" : "/character-boy-blue.png?v=3";

  // Parse customization options securely
  let colorId = "blue";
  let accessoryId = "none";
  let headId = "none";

  if (outfit) {
    if (outfit.includes("_")) {
      const parts = outfit.split("_");
      colorId = parts[0] || "blue";
      accessoryId = parts[1] || "none";
      headId = parts[2] || "none";
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

        // Sniff pixel coordinates
        const pixelIdx = i / 4;
        const pxY = pixelIdx / canvas.width;

        // Chroma-key out the solid white JPEG background
        // Preserve white shoes located at the bottom (Y > 78%)
        if (r > 248 && g > 248 && b > 248 && pxY < canvas.height * 0.78) {
          data[i + 3] = 0; // Set transparency to 0
          continue;
        }

        const [h, s, l] = rgbToHsl(r, g, b);

        let isHoodie = false;
        if (isFemale) {
          isHoodie = h >= 110 && h <= 175 && s > 0.15 && l > 0.15 && l < 0.9;
        } else {
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

      // 1. Cover midriff with a clean hoodie cloth block first for boy
      if (!isFemale) {
        const startX = canvas.width * 0.408;
        const endX = canvas.width * 0.592;
        const startY = canvas.height * 0.52;
        const endY = canvas.height * 0.665;

        const grad = ctx.createLinearGradient(startX, startY, endX, startY);
        grad.addColorStop(0, targetHex);
        grad.addColorStop(0.3, targetHex);
        grad.addColorStop(1, adjustBrightness(targetHex, -18));

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(startX, startY - 1);
        ctx.lineTo(endX, startY - 1);
        ctx.lineTo(endX - 3, endY);
        ctx.lineTo(startX + 3, endY);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = adjustBrightness(targetHex, -35);
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(startX + 3, endY - 1);
        ctx.lineTo(endX - 3, endY - 1);
        ctx.stroke();
      }

      // 2. Define Precise Scaled Facial Coordinates (based on 1024x1024 dimensions)
      const eyeY = isFemale ? canvas.height * 0.255 : canvas.height * 0.255;
      const headY = isFemale ? canvas.height * 0.08 : canvas.height * 0.08;
      const scaleFactor = canvas.width / 500; // dynamic scale factor based on natural width

      // 3. Render Sunglasses / Glasses overlay options
      if (accessoryId !== "none") {
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (accessoryId === "sunglasses") {
          // Cool Black Sunglasses
          ctx.fillStyle = "rgba(15, 23, 42, 0.95)";
          ctx.strokeStyle = "#334155";
          ctx.lineWidth = 2 * scaleFactor;

          // Left Lens
          ctx.beginPath();
          ctx.arc(canvas.width * 0.44, eyeY, 13 * scaleFactor, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Right Lens
          ctx.beginPath();
          ctx.arc(canvas.width * 0.56, eyeY, 13 * scaleFactor, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Bridge
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 3 * scaleFactor;
          ctx.beginPath();
          ctx.moveTo(canvas.width * 0.46, eyeY - 3 * scaleFactor);
          ctx.lineTo(canvas.width * 0.54, eyeY - 3 * scaleFactor);
          ctx.stroke();

          // Light reflection glint
          ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
          ctx.beginPath();
          ctx.ellipse(canvas.width * 0.42, eyeY - 4 * scaleFactor, 3 * scaleFactor, 6 * scaleFactor, Math.PI / 4, 0, Math.PI * 2);
          ctx.ellipse(canvas.width * 0.54, eyeY - 4 * scaleFactor, 3 * scaleFactor, 6 * scaleFactor, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (accessoryId === "round") {
          // Retro Round Glasses
          ctx.strokeStyle = "#64748b"; // Dark steel frame
          ctx.lineWidth = 2.5 * scaleFactor;

          // Left Lens
          ctx.beginPath();
          ctx.arc(canvas.width * 0.44, eyeY, 14 * scaleFactor, 0, Math.PI * 2);
          ctx.stroke();

          // Right Lens
          ctx.beginPath();
          ctx.arc(canvas.width * 0.56, eyeY, 14 * scaleFactor, 0, Math.PI * 2);
          ctx.stroke();

          // Bridge
          ctx.beginPath();
          ctx.moveTo(canvas.width * 0.47, eyeY - 2 * scaleFactor);
          ctx.lineTo(canvas.width * 0.53, eyeY - 2 * scaleFactor);
          ctx.stroke();
        } else if (accessoryId === "aviators") {
          // Gold Aviators
          ctx.strokeStyle = "#fbbf24"; // Gold metal frame
          ctx.fillStyle = "rgba(251, 191, 36, 0.35)"; // Amber gradient tint
          ctx.lineWidth = 2 * scaleFactor;

          // Left Aviator lens shape
          ctx.beginPath();
          ctx.moveTo(canvas.width * 0.39, eyeY - 9 * scaleFactor);
          ctx.lineTo(canvas.width * 0.49, eyeY - 9 * scaleFactor);
          ctx.lineTo(canvas.width * 0.48, eyeY + 11 * scaleFactor);
          ctx.lineTo(canvas.width * 0.41, eyeY + 9 * scaleFactor);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Right Aviator lens shape
          ctx.beginPath();
          ctx.moveTo(canvas.width * 0.51, eyeY - 9 * scaleFactor);
          ctx.lineTo(canvas.width * 0.61, eyeY - 9 * scaleFactor);
          ctx.lineTo(canvas.width * 0.59, eyeY + 11 * scaleFactor);
          ctx.lineTo(canvas.width * 0.52, eyeY + 9 * scaleFactor);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Double Bridge
          ctx.beginPath();
          ctx.moveTo(canvas.width * 0.48, eyeY - 7 * scaleFactor);
          ctx.lineTo(canvas.width * 0.52, eyeY - 7 * scaleFactor);
          ctx.moveTo(canvas.width * 0.48, eyeY - 3 * scaleFactor);
          ctx.lineTo(canvas.width * 0.52, eyeY - 3 * scaleFactor);
          ctx.stroke();
        } else if (accessoryId === "cyberpunk") {
          // Cyan Cyberpunk Visor
          ctx.fillStyle = "rgba(6, 182, 212, 0.82)";
          ctx.strokeStyle = "#22d3ee";
          ctx.lineWidth = 2 * scaleFactor;

          ctx.beginPath();
          // Draw visor plate
          ctx.roundRect(canvas.width * 0.37, eyeY - 11 * scaleFactor, canvas.width * 0.26, 22 * scaleFactor, 5 * scaleFactor);
          ctx.fill();
          ctx.stroke();

          // Laser neon scanning beam lines
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.5 * scaleFactor;
          ctx.beginPath();
          ctx.moveTo(canvas.width * 0.39, eyeY);
          ctx.lineTo(canvas.width * 0.61, eyeY);
          ctx.stroke();
        }
      }

      // 4. Render Head Accessories
      if (headId !== "none") {
        if (headId === "crown") {
          // Golden Royal Crown
          ctx.fillStyle = "#fbbf24";
          ctx.strokeStyle = "#b45309";
          ctx.lineWidth = 2 * scaleFactor;

          ctx.beginPath();
          ctx.moveTo(canvas.width * 0.43, headY);
          ctx.lineTo(canvas.width * 0.41, headY - 18 * scaleFactor);
          ctx.lineTo(canvas.width * 0.46, headY - 7 * scaleFactor);
          ctx.lineTo(canvas.width * 0.50, headY - 24 * scaleFactor); // Center Peak
          ctx.lineTo(canvas.width * 0.54, headY - 7 * scaleFactor);
          ctx.lineTo(canvas.width * 0.59, headY - 18 * scaleFactor);
          ctx.lineTo(canvas.width * 0.57, headY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Royal Ruby & Sapphire Jewels
          ctx.fillStyle = "#ef4444";
          ctx.beginPath(); ctx.arc(canvas.width * 0.41, headY - 19 * scaleFactor, 3 * scaleFactor, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = "#3b82f6";
          ctx.beginPath(); ctx.arc(canvas.width * 0.50, headY - 25 * scaleFactor, 3.5 * scaleFactor, 0, Math.PI*2); ctx.fill();
          ctx.fillStyle = "#ef4444";
          ctx.beginPath(); ctx.arc(canvas.width * 0.59, headY - 19 * scaleFactor, 3 * scaleFactor, 0, Math.PI*2); ctx.fill();
        } else if (headId === "flower") {
          // Flower Headband
          const drawFlower = (cx: number, cy: number, r: number, color: string) => {
            ctx.fillStyle = color;
            for (let j = 0; j < 5; j++) {
              const angle = (j * Math.PI * 2) / 5;
              const px = cx + Math.cos(angle) * r;
              const py = cy + Math.sin(angle) * r;
              ctx.beginPath();
              ctx.arc(px, py, r * 0.65, 0, Math.PI * 2);
              ctx.fill();
            }
            ctx.fillStyle = "#fef08a"; // Gold center
            ctx.beginPath(); ctx.arc(cx, cy, r * 0.4, 0, Math.PI * 2); ctx.fill();
          };

          drawFlower(canvas.width * 0.45, headY - 4 * scaleFactor, 7 * scaleFactor, "#f43f5e"); // Pink-Red Rose
          drawFlower(canvas.width * 0.50, headY - 7 * scaleFactor, 8.5 * scaleFactor, "#ffffff"); // White Daisy
          drawFlower(canvas.width * 0.55, headY - 4 * scaleFactor, 7 * scaleFactor, "#60a5fa"); // Sky Orchid
        } else if (headId === "catears") {
          // Furry Neko Cat Ears
          const hairBaseColor = "#475569"; // Slate gray ears

          // Left Ear
          ctx.fillStyle = hairBaseColor;
          ctx.beginPath();
          ctx.moveTo(canvas.width * 0.41, headY - 2 * scaleFactor);
          ctx.lineTo(canvas.width * 0.36, headY - 21 * scaleFactor);
          ctx.lineTo(canvas.width * 0.45, headY - 9 * scaleFactor);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#fda4af"; // inner pink ear skin
          ctx.beginPath();
          ctx.moveTo(canvas.width * 0.40, headY - 3 * scaleFactor);
          ctx.lineTo(canvas.width * 0.37, headY - 17 * scaleFactor);
          ctx.lineTo(canvas.width * 0.43, headY - 8 * scaleFactor);
          ctx.closePath();
          ctx.fill();

          // Right Ear
          ctx.fillStyle = hairBaseColor;
          ctx.beginPath();
          ctx.moveTo(canvas.width * 0.59, headY - 2 * scaleFactor);
          ctx.lineTo(canvas.width * 0.64, headY - 21 * scaleFactor);
          ctx.lineTo(canvas.width * 0.55, headY - 9 * scaleFactor);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = "#fda4af";
          ctx.beginPath();
          ctx.moveTo(canvas.width * 0.60, headY - 3 * scaleFactor);
          ctx.lineTo(canvas.width * 0.63, headY - 17 * scaleFactor);
          ctx.lineTo(canvas.width * 0.57, headY - 8 * scaleFactor);
          ctx.closePath();
          ctx.fill();
        }
      }
    };
  }, [baseSrc, targetHex, isFemale, accessoryId, headId]);

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
