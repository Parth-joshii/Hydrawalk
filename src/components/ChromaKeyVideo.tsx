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
    let bgR1 = 0, bgG1 = 0, bgB1 = 0;
    let bgR2 = 0, bgG2 = 0, bgB2 = 0;
    let hasBgColors = false;

    const render = () => {
      if (isDestroyed) return;

      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = frame.data;

          if (!hasBgColors && data.length > 0) {
            // First checkerboard color at (0, 0)
            bgR1 = data[0];
            bgG1 = data[1];
            bgB1 = data[2];

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

    video.play().catch((err) => console.log("Video auto-play blocked or failed:", err));
    render();

    return () => {
      isDestroyed = true;
      cancelAnimationFrame(animationFrameId);
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
        style={{ display: "none" }}
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
