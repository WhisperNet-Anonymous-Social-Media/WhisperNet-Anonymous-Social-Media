import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff, PhoneCall } from "lucide-react";

interface VideoCallModalProps {
  open: boolean;
  isIncoming: boolean;
  mode?: "voice" | "video";
  contact?: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onAnswer: () => void;
  onEnd: () => void;
  onMinimize?: () => void;
}

function drawVideoToCanvas(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  blurPx: number,
  isActive: () => boolean
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};

  let frameId = 0;
  const render = () => {
    if (!isActive()) return;
    if (video.videoWidth > 0 && video.videoHeight > 0) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.filter = `blur(${blurPx}px)`;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.filter = "none";
    }
    frameId = requestAnimationFrame(render);
  };

  frameId = requestAnimationFrame(render);
  return () => cancelAnimationFrame(frameId);
}

export const VideoCallModal: React.FC<VideoCallModalProps> = ({
  open,
  isIncoming,
  mode = "video",
  contact,
  localStream,
  remoteStream,
  onAnswer,
  onEnd,
  onMinimize,
}) => {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const remoteCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [blur, setBlur] = useState(20);
  const [localReady, setLocalReady] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const displayName = useMemo(() => contact || "Unknown", [contact]);
  const isVoiceOnly = mode === "voice";

  useEffect(() => {
    if (!open) return;
    setBlur(20);
    setLocalReady(false);
    setRemoteReady(false);
  }, [open]);

  // Reduce blur by 1px every 5 seconds.
  useEffect(() => {
    if (!open) return;
    const interval = setInterval(() => {
      setBlur((prev) => Math.max(0, prev - 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [open]);

  useEffect(() => {
    if (!localVideoRef.current || !localStream) return;
    localVideoRef.current.srcObject = localStream;
    localVideoRef.current.muted = true;
    localVideoRef.current.onloadedmetadata = () => {
      setLocalReady(true);
      localVideoRef.current?.play().catch(() => {});
    };
    localVideoRef.current.play().catch(() => {});
  }, [localStream]);

  useEffect(() => {
    if (!remoteVideoRef.current || !remoteStream) return;
    remoteVideoRef.current.srcObject = remoteStream;
    remoteVideoRef.current.onloadedmetadata = () => {
      setRemoteReady(true);
      remoteVideoRef.current?.play().catch(() => {});
    };
    remoteVideoRef.current.play().catch(() => {});
  }, [remoteStream]);

  useEffect(() => {
    if (isVoiceOnly) return;
    if (!open || !localVideoRef.current || !localCanvasRef.current || !localReady) return;
    let active = true;
    const stopLocal = drawVideoToCanvas(localVideoRef.current, localCanvasRef.current, blur, () => active);
    return () => {
      active = false;
      stopLocal();
    };
  }, [open, blur, localReady, isVoiceOnly]);

  useEffect(() => {
    if (isVoiceOnly) return;
    if (!open || !remoteVideoRef.current || !remoteCanvasRef.current || !remoteReady) return;
    let active = true;
    const stopRemote = drawVideoToCanvas(remoteVideoRef.current, remoteCanvasRef.current, blur, () => active);
    return () => {
      active = false;
      stopRemote();
    };
  }, [open, blur, remoteReady, isVoiceOnly]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-5xl rounded-3xl border border-slate-700 bg-slate-900/95 shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">{isVoiceOnly ? "Encrypted Voice Call" : "Encrypted Video Call"}</p>
            <h3 className="text-lg font-semibold text-slate-100">
              {isIncoming ? `Incoming call from ${displayName}` : `Call with ${displayName}`}
            </h3>
          </div>
          <div className="text-xs text-blue-300 bg-blue-950/35 border border-blue-500/40 px-3 py-1 rounded-full">
            Blur: {blur}px
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 p-4 bg-slate-950">
          <div className="rounded-2xl border border-slate-700 overflow-hidden bg-slate-900 relative min-h-[240px]">
            {isVoiceOnly ? (
              <div className="absolute inset-0 grid place-items-center text-slate-300 text-sm">Voice call in progress</div>
            ) : (
              <>
                <canvas ref={localCanvasRef} className="w-full h-full object-cover" />
                {!localReady && (
                  <div className="absolute inset-0 grid place-items-center text-xs text-slate-500">Starting camera...</div>
                )}
              </>
            )}
            <span className="absolute bottom-2 left-2 text-xs bg-slate-900/90 text-slate-300 px-2 py-1 rounded border border-slate-700">
              You
            </span>
          </div>
          <div className="rounded-2xl border border-slate-700 overflow-hidden bg-slate-900 relative min-h-[240px]">
            {isVoiceOnly ? (
              <div className="absolute inset-0 grid place-items-center text-slate-300 text-sm">Connected to {displayName}</div>
            ) : (
              <>
                <canvas ref={remoteCanvasRef} className="w-full h-full object-cover" />
                {!remoteReady && (
                  <div className="absolute inset-0 grid place-items-center text-xs text-slate-500">Waiting for remote video...</div>
                )}
              </>
            )}
            <span className="absolute bottom-2 left-2 text-xs bg-slate-900/90 text-slate-300 px-2 py-1 rounded border border-slate-700">
              {displayName}
            </span>
          </div>
        </div>

        <div className="px-4 pb-4 flex items-center justify-center gap-3">
          {onMinimize && (
            <Button onClick={onMinimize} variant="secondary">
              Minimize
            </Button>
          )}
          {isIncoming && (
            <Button onClick={onAnswer} className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <PhoneCall className="w-4 h-4 mr-2" />
              Answer
            </Button>
          )}
          <Button onClick={onEnd} variant="destructive">
            <PhoneOff className="w-4 h-4 mr-2" />
            End Call
          </Button>
        </div>
      </div>

      {/* Hidden video elements used as canvas sources */}
      <video ref={localVideoRef} muted playsInline autoPlay className="hidden" />
      <video ref={remoteVideoRef} playsInline autoPlay className="hidden" />
    </div>
  );
};
