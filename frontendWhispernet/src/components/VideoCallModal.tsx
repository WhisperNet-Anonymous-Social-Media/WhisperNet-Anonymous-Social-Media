import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { PhoneOff, PhoneCall, ShieldCheck, Loader2, Mic, MicOff, Video, VideoOff } from "lucide-react";

interface VideoCallModalProps {
  open: boolean;
  isIncoming: boolean;
  mode?: "voice" | "video";
  contact?: string | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMicMuted?: boolean;
  isCameraOff?: boolean;
  onAnswer: () => void;
  onEnd: () => void;
  onToggleMic?: () => void;
  onToggleCamera?: () => void;
  onMinimize?: () => void;
}

function drawVideoToCanvas(
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement,
  blurPx: number,
  isActive: () => boolean
) {
  // alpha: false helps performance on mobile devices
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return () => { };

  let frameId = 0;

  const render = () => {
    if (!isActive()) return;

    // readyState 2 means HAVE_CURRENT_DATA, necessary for mobile hardware
    if (video.readyState >= 2 && video.videoWidth > 0) {
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      // Re-applying the filter inside the loop is critical for mobile Safari/Chrome
      ctx.filter = blurPx > 0 ? `blur(${blurPx}px)` : "none";
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
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
  isMicMuted = false,
  isCameraOff = false,
  onAnswer,
  onEnd,
  onToggleMic,
  onToggleCamera,
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

  // Reset states
  useEffect(() => {
    if (!open) {
      setLocalReady(false);
      setRemoteReady(false);
      return;
    }
    setBlur(5);
  }, [open]);

  // Gradual unblur logic
  useEffect(() => {
    if (!open || remoteStream === null) return;
    const interval = setInterval(() => {
      setBlur((prev) => Math.max(0, prev - 1));
    }, 5000);
    return () => clearInterval(interval);
  }, [open, remoteStream]);

  // Local Stream setup
  useEffect(() => {
    if (!localVideoRef.current || !localStream) return;
    localVideoRef.current.srcObject = localStream;
    localVideoRef.current.muted = true;

    localVideoRef.current.onloadedmetadata = () => {
      setLocalReady(true);
      localVideoRef.current?.play().catch(() => { });
    };
  }, [localStream]);

  // Remote Stream setup (Audio + Video)
  useEffect(() => {
    if (!remoteStream) return;

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.onloadedmetadata = () => {
        setRemoteReady(true);
        remoteVideoRef.current?.play().catch(() => { });
      };
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch(() => { });
    }
  }, [remoteStream]);

  // Local Canvas (No Blur)
  useEffect(() => {
    if (isVoiceOnly || !open || !localVideoRef.current || !localCanvasRef.current || !localReady) return;
    let active = true;
    const stopLocal = drawVideoToCanvas(localVideoRef.current, localCanvasRef.current, 0, () => active);
    return () => { active = false; stopLocal(); };
  }, [open, localReady, isVoiceOnly]);

  // Remote Canvas (With Blur)
  useEffect(() => {
    if (isVoiceOnly || !open || !remoteVideoRef.current || !remoteCanvasRef.current || !remoteReady) return;
    let active = true;
    const stopRemote = drawVideoToCanvas(remoteVideoRef.current, remoteCanvasRef.current, blur, () => active);
    return () => { active = false; stopRemote(); };
  }, [open, blur, remoteReady, isVoiceOnly]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
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
              <h3 className="text-lg font-semibold text-slate-100 leading-tight">
                {isIncoming && !remoteStream ? `Incoming from ${displayName}` : `Chatting with ${displayName}`}
              </h3>
            </div>
          </div>
          {!isVoiceOnly && remoteStream && (
            <div className="text-xs font-mono text-blue-300 bg-blue-950/40 border border-blue-500/30 px-3 py-1 rounded-full animate-pulse">
              Blur: {blur}px
            </div>
          )}
        </div>

        {/* Video Grid */}
        <div className="grid md:grid-cols-2 gap-4 p-4 bg-slate-950 flex-grow">
          {/* Local Participant (Self) */}
          <div className="relative rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 aspect-video md:aspect-auto min-h-[220px]">
            {isVoiceOnly ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-800 animate-pulse" />
                <span className="text-slate-400 text-sm">Your Mic Active</span>
              </div>
            ) : (
              <>
                <canvas
                  ref={localCanvasRef}
                  className="w-full h-full object-cover block mx-auto scale-x-[-1]"
                  style={{ minHeight: '100%', transform: 'translateZ(0)' }}
                />
                {!localReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-slate-600 animate-spin" />
                  </div>
                )}
              </>
            )}
            <div className="absolute bottom-3 left-3 px-2 py-1 bg-black/50 backdrop-blur-md rounded text-[10px] text-white border border-white/10">
              You
            </div>
          </div>

          {/* Remote Participant (Stranger) */}
          <div className="relative rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 aspect-video md:aspect-auto min-h-[220px]">
            {!remoteStream ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <PhoneCall className="w-6 h-6 text-blue-500 animate-bounce" />
                </div>
                <p className="text-slate-400 text-sm">
                  {isIncoming ? "Call waiting..." : "Connecting peer..."}
                </p>
              </div>
            ) : isVoiceOnly ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <div className="w-4 h-4 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <span className="text-emerald-400 text-sm">Secure Connection</span>
              </div>
            ) : (
              <>
                <canvas
                  ref={remoteCanvasRef}
                  className="w-full h-full object-cover block mx-auto transition-all duration-700"
                  style={{
                    minHeight: '100%',
                    transform: 'translateZ(0)',
                    // CSS FALLBACK: If Canvas API filter fails on mobile, 
                    // this CSS filter acts as a safety net.
                    filter: blur > 0 ? `blur(${blur}px)` : 'none'
                  }}
                />
                {!remoteReady && (
                  <div className="absolute inset-0 flex items-center justify-center">
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

        {/* Call Actions */}
        <div className="px-6 py-6 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-3 flex-wrap">
          {isIncoming && !remoteStream && (
            <Button
              onClick={onAnswer}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full px-10 h-14 shadow-xl active:scale-95 transition-all"
            >
              <PhoneCall className="w-5 h-5 mr-2" />
              Answer
            </Button>
          )}

          <Button
            onClick={onToggleMic}
            variant={isMicMuted ? "destructive" : "secondary"}
            size="lg"
            className="rounded-full px-6 h-14 shadow-md active:scale-95 transition-all"
            disabled={!onToggleMic}
          >
            {isMicMuted ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
            {isMicMuted ? "Mic Off" : "Mic On"}
          </Button>

          {!isVoiceOnly && (
            <Button
              onClick={onToggleCamera}
              variant={isCameraOff ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full px-6 h-14 shadow-md active:scale-95 transition-all"
              disabled={!onToggleCamera}
            >
              {isCameraOff ? <VideoOff className="w-5 h-5 mr-2" /> : <Video className="w-5 h-5 mr-2" />}
              {isCameraOff ? "Camera Off" : "Camera On"}
            </Button>
          )}

          <Button
            onClick={onEnd}
            variant="destructive"
            size="lg"
            className="rounded-full px-10 h-14 shadow-xl active:scale-95 transition-all"
          >
            <PhoneOff className="w-5 h-5 mr-2" />
            {isIncoming && !remoteStream ? "Decline" : "End Call"}
          </Button>

          {onMinimize && (
            <Button onClick={onMinimize} variant="ghost" className="text-slate-500 hover:text-white">
              Minimize
            </Button>
          )}
        </div>

        {/* Hidden Engines */}
        <video ref={localVideoRef} muted playsInline autoPlay className="hidden" />
        <video ref={remoteVideoRef} playsInline autoPlay className="hidden" />
        <audio ref={remoteAudioRef} autoPlay className="hidden" />
      </div>
    </div>
  );
};
