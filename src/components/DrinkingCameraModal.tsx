import React, { useEffect, useRef, useState } from "react";
import { Camera, X, AlertCircle, Check } from "lucide-react";
import { playSuccessSound } from "../services/notifications";
import { useApp } from "../contexts/AppContext";

interface DrinkingCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export const DrinkingCameraModal: React.FC<DrinkingCameraModalProps> = ({
  isOpen,
  onClose,
  onVerified,
}) => {
  const { user } = useApp();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Initializing camera...");
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const onVerifiedRef = useRef(onVerified);

  // Keep callback ref updated to avoid stale closures
  useEffect(() => {
    onVerifiedRef.current = onVerified;
  }, [onVerified]);

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    setProgress(0);
    setStatusText("Initializing camera...");

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: 640, height: 480 } })
      .then((mediaStream) => {
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch((err) => console.warn("Video play error:", err));
        }
        setStatusText("Ready! Take a sip to verify.");
      })
      .catch((err) => {
        console.error("Camera access failed:", err);
        setError("Could not access camera. Please allow permission or log manually.");
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isOpen]);

  // Motion analysis loop
  useEffect(() => {
    if (!stream || !isOpen) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isDone = false;

    const analyzeFrame = () => {
      if (isDone) return;
      if (video.paused || video.ended) {
        animationFrameIdRef.current = requestAnimationFrame(analyzeFrame);
        return;
      }

      try {
        // Draw video frame to small canvas for comparison
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = frameData.data;

        if (prevFrameRef.current) {
          let diff = 0;
          const prev = prevFrameRef.current;

          for (let i = 0; i < pixels.length; i += 4) {
            // Compare luminance difference
            const v1 = 0.299 * pixels[i] + 0.587 * pixels[i + 1] + 0.114 * pixels[i + 2];
            const v2 = 0.299 * prev[i] + 0.587 * prev[i + 1] + 0.114 * prev[i + 2];
            diff += Math.abs(v1 - v2);
          }

          const normalizedDiff = diff / (canvas.width * canvas.height);

          // Movement threshold: if they are moving, increase progress
          if (normalizedDiff > 12) {
            setProgress((prevProgress) => {
              const nextProgress = Math.min(100, prevProgress + 1.2);
              
              if (nextProgress >= 100 && !isDone) {
                isDone = true;
                setStatusText("Intake verified! Cheers! 💧");
                if (user?.sound_enabled) {
                  playSuccessSound(user.sound_volume);
                }
                
                // Stop camera stream immediately
                if (stream) {
                  stream.getTracks().forEach((track) => track.stop());
                }
                
                setTimeout(() => {
                  onVerifiedRef.current();
                }, 1200);
              } else if (nextProgress > 80) {
                setStatusText("Almost verified... keep drinking!");
              } else if (nextProgress > 40) {
                setStatusText("Analyzing drinking motion...");
              } else {
                setStatusText("Motion detected. Drinking verified!");
              }
              
              return nextProgress;
            });
          }
        }

        // Store current frame as previous
        prevFrameRef.current = pixels;
      } catch (e) {
        console.error("Frame analysis error:", e);
      }
      
      animationFrameIdRef.current = requestAnimationFrame(analyzeFrame);
    };

    animationFrameIdRef.current = requestAnimationFrame(analyzeFrame);

    return () => {
      isDone = true;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [stream, isOpen, user]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-filter backdrop-blur-md z-[99999] flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-400 font-black text-sm uppercase tracking-wider">
            <Camera className="animate-pulse" size={16} /> AI Hydro Detector
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Video stream content */}
        <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
          {error ? (
            <div className="p-6 text-center space-y-3">
              <AlertCircle size={40} className="text-red-500 mx-auto animate-bounce" />
              <p className="text-sm font-bold text-slate-300">{error}</p>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover scale-x-[-1]"
                muted
                playsInline
              />

              {/* Scanning HUD overlay */}
              <div className="absolute inset-0 border-[24px] border-slate-900/30 pointer-events-none" />
              <div className="absolute inset-4 border border-dashed border-indigo-500/20 pointer-events-none rounded-xl" />
              
              {/* Target brackets */}
              <div className="absolute top-6 left-6 w-5 h-5 border-t-2 border-l-2 border-indigo-400 pointer-events-none" />
              <div className="absolute top-6 right-6 w-5 h-5 border-t-2 border-r-2 border-indigo-400 pointer-events-none" />
              <div className="absolute bottom-6 left-6 w-5 h-5 border-b-2 border-l-2 border-indigo-400 pointer-events-none" />
              <div className="absolute bottom-6 right-6 w-5 h-5 border-b-2 border-r-2 border-indigo-400 pointer-events-none" />

              {/* Laser scan line */}
              {progress < 100 && (
                <div className="absolute left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent animate-scan pointer-events-none" />
              )}

              {/* Offscreen analysis canvas */}
              <canvas ref={canvasRef} width="32" height="24" className="hidden" />
            </>
          )}
        </div>

        {/* HUD control board */}
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">
              Detector Status
            </span>
            <p className="text-xs text-slate-350 font-semibold flex items-center gap-1.5">
              {progress >= 100 ? (
                <Check className="text-emerald-500 animate-bounce" size={14} />
              ) : (
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              )}
              {statusText}
            </p>
          </div>

          {/* Progress gauge */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-[10px] font-black text-slate-500">
              <span>Drinking Verification</span>
              <span className="font-mono text-xs text-white">{Math.round(progress)}%</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-850">
              <div
                style={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-100 ease-out"
              />
            </div>
          </div>

          {/* Manual / Cancel Controls */}
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                if (stream) {
                  stream.getTracks().forEach((track) => track.stop());
                }
                onVerifiedRef.current();
              }}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-500/10 cursor-pointer"
            >
              Log Manual (+250 ml)
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
