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

    // Detect background dynamically from the top-left pixel of the first frame
    let bgR = 0, bgG = 0, bgB = 0;
    let hasBgColor = false;

    const render = () => {
      if (isDestroyed) return;

      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        try {
          const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = frame.data;

          if (!hasBgColor && data.length > 0) {
            // Read corner pixel to define background key color
            bgR = data[0];
            bgG = data[1];
            bgB = data[2];
            hasBgColor = true;
          }

          // Key out background color pixels
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            const dist = Math.sqrt(
              (r - bgR) ** 2 +
              (g - bgG) ** 2 +
              (b - bgB) ** 2
            );

            if (dist < 45) { // threshold of 45
              data[i + 3] = 0; // Make pixel transparent
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
