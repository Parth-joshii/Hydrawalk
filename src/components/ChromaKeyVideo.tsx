import React, { useEffect, useRef } from "react";

interface ChromaKeyVideoProps {
  className?: string;
  width?: number;
  height?: number;
}

export const ChromaKeyVideo: React.FC<ChromaKeyVideoProps> = ({
  className,
  width = 300,
  height = 300,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    let isDestroyed = false;
    let animationFrameId: number;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    // Detect background checkerboard colors dynamically
    // Default fallback values: typical gray transparency checkers (e.g. RGB 204 and RGB 255)
    let bgR1 = 204, bgG1 = 204, bgB1 = 204;
    let bgR2 = 255, bgG2 = 255, bgB2 = 255;
    let hasBgColors = false;

    const render = () => {
      if (isDestroyed) return;

      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = frame.data;

          if (!hasBgColors && data.length > 0) {
            const r0 = data[0];
            const g0 = data[1];
            const b0 = data[2];

            // Only sample if the video has loaded actual colored pixels (not just pure black 0,0,0 loading frame)
            if (r0 > 5 || g0 > 5 || b0 > 5) {
              // First checkerboard color at (0, 0)
              bgR1 = r0;
              bgG1 = g0;
              bgB1 = b0;

              // Scan the first row of pixels to locate the second checkerboard color
              bgR2 = bgR1;
              bgG2 = bgG1;
              bgB2 = bgB1;
              for (let x = 1; x < 60; x++) {
                const idx = x * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                const dist = Math.sqrt(
                  (r - bgR1) ** 2 +
                  (g - bgG1) ** 2 +
                  (b - bgB1) ** 2
                );
                if (dist > 15) { // found second color of transparency grid
                  bgR2 = r;
                  bgG2 = g;
                  bgB2 = b;
                  break;
                }
              }
              hasBgColors = true;
            }
          }

          // Key out background checkerboard pixels
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const dist1 = Math.sqrt(
              (r - bgR1) ** 2 +
              (g - bgG1) ** 2 +
              (b - bgB1) ** 2
            );

            const dist2 = Math.sqrt(
              (r - bgR2) ** 2 +
              (g - bgG2) ** 2 +
              (b - bgB2) ** 2
            );

            // Also check if it's general grayscale matching the grid shades (e.g. R ~ G ~ B)
            const maxVal = Math.max(r, g, b);
            const minVal = Math.min(r, g, b);
            const isGrayscale = (maxVal - minVal) < 12;
            const brightness = (r + g + b) / 3;

            // If it matches either checkerboard color or is a gray matching grid range
            if (dist1 < 35 || dist2 < 35 || (isGrayscale && brightness > 90 && brightness < 225)) {
              data[i + 3] = 0; // Make transparent
            }
          }
          ctx.putImageData(frame, 0, 0);
        } catch (e) {
          // Ignore canvas read errors if video is loading
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    const handleInteraction = () => {
      if (video.paused) {
        video.play().catch((err) => console.log("Interaction play failed:", err));
      }
    };
    
    window.addEventListener("click", handleInteraction);
    window.addEventListener("touchstart", handleInteraction);

    video.play().catch((err) => console.log("Video auto-play blocked or failed:", err));
    render();

    return () => {
      isDestroyed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
    };
  }, []);

  return (
    <div className="relative flex items-center justify-center overflow-hidden">
      {/* Hidden source video element */}
      <video
        ref={videoRef}
        src="/reminder_video.mp4"
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
        }}
      />
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={className}
      />
    </div>
  );
};
