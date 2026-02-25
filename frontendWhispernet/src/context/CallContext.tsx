import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import PeerCtor from "simple-peer/simplepeer.min.js";
import { toast } from "sonner";
import { useSocket } from "@/hooks/useSocket";
import { useAuth } from "@/context/AuthContext";
import { VideoCallModal } from "@/components/VideoCallModal";

type IncomingCall = {
  from: string;
  signal: any;
};

type CallContextType = {
  callContact: string | null;
  callMode: "voice" | "video";
  isInCall: boolean;
  isCallModalOpen: boolean;
  incomingCall: IncomingCall | null;
  startCall: (contact: string) => Promise<void>;
  startVoiceCall: (contact: string) => Promise<void>;
  startVideoCall: (contact: string) => Promise<void>;
  answerCall: () => Promise<void>;
  declineCall: () => void;
  endCall: (notifyPeer?: boolean) => void;
  openCallModal: () => void;
  closeCallModal: () => void;
};

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = useSocket();
  const { user } = useAuth();
  const peerRef = useRef<any>(null);

  const [callContact, setCallContact] = useState<string | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);
  const [callMode, setCallMode] = useState<"voice" | "video">("voice");
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const ringTimerRef = useRef<number | null>(null);
  const pendingSignalsRef = useRef<any[]>([]);
  const incomingCallRef = useRef<IncomingCall | null>(null);
  const startInFlightRef = useRef(false);

  const createPeer = useCallback((options: any) => {
    const PeerAny: any = PeerCtor as any;
    const Ctor = PeerAny?.default || PeerAny;
    if (!Ctor) throw new Error("WebRTC peer constructor unavailable");
    return new Ctor(options);
  }, []);

  const stopRinging = useCallback(() => {
    if (ringTimerRef.current) {
      window.clearInterval(ringTimerRef.current);
      ringTimerRef.current = null;
    }
  }, []);

  const startRinging = useCallback(() => {
    stopRinging();
    ringTimerRef.current = window.setInterval(() => {
      try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 900;
        gain.gain.value = 0.035;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        setTimeout(() => {
          osc.stop();
          ctx.close();
        }, 180);
      } catch (_) {}
    }, 1100);
  }, [stopRinging]);

  const getLocalStream = useCallback(async (mode: "voice" | "video") => {
    if (localStream) return localStream;
    const stream = await navigator.mediaDevices.getUserMedia({ video: mode === "video", audio: true });
    setLocalStream(stream);
    return stream;
  }, [localStream]);

  const hardCleanup = useCallback(() => {
    stopRinging();
    peerRef.current?.destroy();
    peerRef.current = null;
    setRemoteStream(null);
    setIncomingCall(null);
    incomingCallRef.current = null;
    setCallContact(null);
    setCallMode("voice");
    setIsInCall(false);
    pendingSignalsRef.current = [];
    startInFlightRef.current = false;
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
  }, [localStream, stopRinging]);

  const endCall = useCallback((notifyPeer = true) => {
    if (notifyPeer && socket && callContact && user?.pseudonym) {
      socket.emit("endCall", { to: callContact, from: user.pseudonym });
    }
    setIsCallModalOpen(false);
    hardCleanup();
  }, [socket, callContact, user, hardCleanup]);

  const startCallInternal = useCallback(async (contact: string, mode: "voice" | "video") => {
    if (!socket || !user?.pseudonym || !contact) return;
    if (startInFlightRef.current || isInCall || incomingCallRef.current) return;
    try {
      startInFlightRef.current = true;
      const stream = await getLocalStream(mode);
      setCallContact(contact);
      setCallMode(mode);
      setIsCallModalOpen(true);

      const peer = createPeer({
        initiator: true,
        trickle: true,
        stream,
        config: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      });

      peer.on("signal", (signalData: any) => {
        if (signalData?.type === "offer") {
          socket.emit("callUser", {
            userToCall: contact,
            signalData,
            from: user.pseudonym,
            mode,
          });
          return;
        }
        if (signalData?.candidate) {
          socket.emit("iceCandidate", { to: contact, candidate: signalData, from: user.pseudonym });
        }
      });

      peer.on("stream", (streamFromPeer: MediaStream) => {
        setRemoteStream(streamFromPeer);
        setIsInCall(true);
      });

      peer.on("error", () => endCall(false));
      peer.on("close", () => endCall(false));

      peerRef.current = peer;
    } catch (err: any) {
      toast.error(err?.message || "Could not start call");
      endCall(false);
    } finally {
      startInFlightRef.current = false;
    }
  }, [socket, user, getLocalStream, endCall, createPeer, isInCall]);

  const startVoiceCall = useCallback(async (contact: string) => {
    await startCallInternal(contact, "voice");
  }, [startCallInternal]);

  const startVideoCall = useCallback(async (_contact: string) => {
    toast.info("Video call is coming soon. Use voice call for now.");
  }, []);

  const startCall = useCallback(async (contact: string) => {
    await startVoiceCall(contact);
  }, [startVoiceCall]);

  const answerCall = useCallback(async () => {
    const activeIncoming = incomingCallRef.current || incomingCall;
    if (!socket || !user?.pseudonym || !activeIncoming) return;
    try {
      const stream = await getLocalStream(callMode);

      const peer = createPeer({
        initiator: false,
        trickle: true,
        stream,
        config: {
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        },
      });

      peer.on("signal", (signalData: any) => {
        if (signalData?.type === "answer") {
          socket.emit("answerCall", {
            to: activeIncoming.from,
            signal: signalData,
            from: user.pseudonym,
          });
          return;
        }
        if (signalData?.candidate) {
          socket.emit("iceCandidate", { to: activeIncoming.from, candidate: signalData, from: user.pseudonym });
        }
      });

      peer.on("stream", (streamFromPeer: MediaStream) => {
        setRemoteStream(streamFromPeer);
        setIsInCall(true);
      });

      peer.on("error", () => endCall(false));
      peer.on("close", () => endCall(false));

      peer.signal(activeIncoming.signal);
      peerRef.current = peer;

      if (pendingSignalsRef.current.length) {
        pendingSignalsRef.current.forEach((sig) => {
          try {
            peer.signal(sig);
          } catch (_) {}
        });
        pendingSignalsRef.current = [];
      }

      setCallContact(activeIncoming.from);
      setIncomingCall(null);
      incomingCallRef.current = null;
      setIsCallModalOpen(true);
      stopRinging();
    } catch (err: any) {
      toast.error(err?.message || "Could not answer call");
      setIncomingCall(null);
      incomingCallRef.current = null;
      setIsCallModalOpen(false);
      stopRinging();
    }
  }, [socket, user, incomingCall, getLocalStream, callMode, endCall, createPeer, stopRinging]);

  const declineCall = useCallback(() => {
    const activeIncoming = incomingCallRef.current || incomingCall;
    if (socket && activeIncoming?.from && user?.pseudonym) {
      socket.emit("callDeclined", { to: activeIncoming.from, from: user.pseudonym });
    }
    setIncomingCall(null);
    incomingCallRef.current = null;
    setIsCallModalOpen(false);
    stopRinging();
  }, [socket, incomingCall, user, stopRinging]);

  useEffect(() => {
    if (!socket || !user?.pseudonym) return;
    socket.emit("join_chat", user.pseudonym);
  }, [socket, user?.pseudonym]);

  useEffect(() => {
    if (!socket) return;

    const onIncomingCall = ({ from, signal, mode }: { from: string; signal: any; mode?: "voice" | "video" }) => {
      if (isInCall) {
        if (socket && user?.pseudonym) {
          socket.emit("callDeclined", { to: from, from: user.pseudonym });
        }
        return;
      }
      setIncomingCall({ from, signal });
      incomingCallRef.current = { from, signal };
      setCallContact(from);
      setCallMode(mode === "video" ? "video" : "voice");
      setIsCallModalOpen(true);
      startRinging();

      toast(`Incoming ${mode === "video" ? "video" : "voice"} call`, {
        description: `${from} is calling you`,
        action: {
          label: "Accept",
          onClick: () => {
            answerCall();
          },
        },
        cancel: {
          label: "Decline",
          onClick: () => {
            declineCall();
          },
        },
        duration: 20000,
      });
    };

    const onAnswered = ({ signal }: { signal: any }) => {
      peerRef.current?.signal(signal);
      setIsInCall(true);
      setIsCallModalOpen(true);
      stopRinging();
      toast.success("Call connected");
    };

    const onIceCandidate = ({ candidate }: { candidate: any }) => {
      if (!candidate) return;
      if (peerRef.current) {
        try {
          peerRef.current.signal(candidate);
        } catch (_) {}
      } else {
        pendingSignalsRef.current.push(candidate);
      }
    };

    const onEnded = () => {
      stopRinging();
      toast.info("Call ended");
      endCall(false);
    };

    const onDeclined = ({ from }: { from: string }) => {
      stopRinging();
      toast.info(`${from} declined your call`);
      endCall(false);
    };

    socket.on("callUser", onIncomingCall);
    socket.on("answerCall", onAnswered);
    socket.on("iceCandidate", onIceCandidate);
    socket.on("endCall", onEnded);
    socket.on("callDeclined", onDeclined);

    return () => {
      socket.off("callUser", onIncomingCall);
      socket.off("answerCall", onAnswered);
      socket.off("iceCandidate", onIceCandidate);
      socket.off("endCall", onEnded);
      socket.off("callDeclined", onDeclined);
    };
  }, [socket, answerCall, declineCall, endCall, isInCall, startRinging, stopRinging, user?.pseudonym]);

  useEffect(() => {
    return () => {
      hardCleanup();
    };
  }, [hardCleanup]);

  return (
    <CallContext.Provider
      value={{
        callContact,
        isInCall,
        isCallModalOpen,
        incomingCall,
        callMode,
        startCall,
        startVoiceCall,
        startVideoCall,
        answerCall,
        declineCall,
        endCall,
        openCallModal: () => setIsCallModalOpen(true),
        closeCallModal: () => setIsCallModalOpen(false),
      }}
    >
      {children}
      <VideoCallModal
        open={isCallModalOpen}
        isIncoming={!!incomingCall && !isInCall}
        mode={callMode}
        contact={incomingCall?.from || callContact}
        localStream={localStream}
        remoteStream={remoteStream}
        onAnswer={answerCall}
        onEnd={() => {
          if (incomingCall && !isInCall) {
            declineCall();
            return;
          }
          endCall(true);
        }}
        onMinimize={() => setIsCallModalOpen(false)}
      />
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error("useCall must be used within CallProvider");
  return context;
};
