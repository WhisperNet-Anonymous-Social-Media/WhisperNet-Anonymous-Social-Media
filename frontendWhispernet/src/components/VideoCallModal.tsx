import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff, PhoneCall, ShieldCheck, Loader2 } from "lucide-react";

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
  if (!ctx) return () => { };

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
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const localCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const remoteCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [blur, setBlur] = useState(20);
  const [localReady, setLocalReady] = useState(false);
  const [remoteReady, setRemoteReady] = useState(false);
  const displayName = useMemo(() => contact || "Unknown", [contact]);
  const isVoiceOnly = mode === "voice";

  // Reset state on open
  useEffect(() => {
    if (!open) {
      setLocalReady(false);
      setRemoteReady(false);
      return;
    }
    setBlur(20);
  }, [open]);

  // Gradual unblur logic (Social feature)
  useEffect(() => {
    if (!open || remoteStream === null) return;
    const interval = setInterval(() => {
      setBlur((prev) => Math.max(0, prev - 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [open, remoteStream]);

  // Handle Local Stream
  useEffect(() => {
    if (!localVideoRef.current || !localStream) return;
    localVideoRef.current.srcObject = localStream;
    localVideoRef.current.muted = true; // Essential to prevent feedback loop

    localVideoRef.current.onloadedmetadata = () => {
      setLocalReady(true);
      localVideoRef.current?.play().catch(console.error);
    };
  }, [localStream]);

  // Handle Remote Stream (Video & Audio)
  useEffect(() => {
    if (!remoteStream) return;

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.onloadedmetadata = () => {
        setRemoteReady(true);
        remoteVideoRef.current?.play().catch(console.error);
      };
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(console.error);
    }
  }, [remoteStream]);

  // Canvas Drawing Logic
  useEffect(() => {
    if (isVoiceOnly || !open || !localVideoRef.current || !localCanvasRef.current || !localReady) return;
    let active = true;
    const stopLocal = drawVideoToCanvas(localVideoRef.current, localCanvasRef.current, blur, () => active);
    return () => { active = false; stopLocal(); };
  }, [open, blur, localReady, isVoiceOnly]);

  useEffect(() => {
    if (isVoiceOnly || !open || !remoteVideoRef.current || !remoteCanvasRef.current || !remoteReady) return;
    let active = true;
    const stopRemote = drawVideoToCanvas(remoteVideoRef.current, remoteCanvasRef.current, blur, () => active);
    return () => { active = false; stopRemote(); };
  }, [open, blur, remoteReady, isVoiceOnly]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-full">
              <ShieldCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                {isVoiceOnly ? "Secure Audio" : "Secure Video"}
              </p>
              <h3 className="text-lg font-semibold text-slate-100">
                {isIncoming && !remoteStream ? `Incoming from ${displayName}` : `Chatting with ${displayName}`}
              </h3>
            </div>
          </div>
          {!isVoiceOnly && remoteStream && (
            <div className="text-xs font-mono text-blue-300 bg-blue-950/40 border border-blue-500/30 px-3 py-1 rounded-full animate-pulse">
              Privacy Blur: {blur}px
            </div>
          )}
        </div>

        {/* Video/Voice Grid */}
        <div className="grid md:grid-cols-2 gap-4 p-6 bg-slate-950 flex-grow">
          {/* Local Participant */}
          <div className="relative rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 aspect-video md:aspect-auto min-h-[200px]">
            {isVoiceOnly ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-800 animate-pulse" />
                <span className="text-slate-400 text-sm font-medium">Your Audio Active</span>
              </div>
            ) : (
              <>
                <canvas ref={localCanvasRef} className="w-full h-full object-cover scale-x-[-1]" />
                {!localReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
                  </div>
                )}
              </>
            )}
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white border border-white/10">
              You (Local)
            </div>
          </div>

          {/* Remote Participant */}
          <div className="relative rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 aspect-video md:aspect-auto min-h-[200px]">
            {!remoteStream ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-6 text-center">
                <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <PhoneCall className="w-8 h-8 text-blue-500 animate-bounce" />
                </div>
                <p className="text-slate-300 font-medium">
                  {isIncoming ? "Waiting for you to join..." : "Connecting to peer..."}
                </p>
              </div>
            ) : isVoiceOnly ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 animate-ping opacity-50" />
                </div>
                <span className="text-emerald-400 text-sm font-medium">Connected</span>
              </div>
            ) : (
              <>
                <canvas ref={remoteCanvasRef} className="w-full h-full object-cover" />
                {!remoteReady && (
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  </div>
                )}
              </>
            )}
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white border border-white/10">
              {displayName}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-6 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-4">
          {isIncoming && !remoteStream && (
            <Button
              onClick={onAnswer}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-8 h-12 shadow-lg shadow-emerald-900/20 transition-all active:scale-95"
            >
              <PhoneCall className="w-5 h-5 mr-2" />
              Answer Call
            </Button>
          )}

          <Button
            onClick={onEnd}
            variant="destructive"
            size="lg"
            className="rounded-full px-8 h-12 shadow-lg shadow-red-900/20 transition-all active:scale-95"
          >
            <PhoneOff className="w-5 h-5 mr-2" />
            {isIncoming && !remoteStream ? "Decline" : "End Call"}
          </Button>

          {onMinimize && (
            <Button onClick={onMinimize} variant="ghost" className="text-slate-400 hover:text-white">
              Minimize
            </Button>
          )}
        </div>

        {/* Media Engines (Hidden) */}
        <video ref={localVideoRef} muted playsInline autoPlay className="hidden" />
        <video ref={remoteVideoRef} playsInline autoPlay className="hidden" />
        <audio ref={remoteAudioRef} autoPlay className="hidden" />
      </div>
    </div>
  );
};