import React from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import { useCall } from "@/context/CallContext";
import { useNavigate } from "react-router-dom";

export const CallFloatingDock: React.FC = () => {
  const navigate = useNavigate();
  const { callContact, isInCall, incomingCall, isCallModalOpen, openCallModal, endCall, answerCall, declineCall } = useCall();

  const showDock = (isInCall || !!incomingCall) && !isCallModalOpen;
  if (!showDock) return null;

  const isIncoming = !!incomingCall && !isInCall;
  const label = isIncoming ? "Incoming Call" : "Call In Progress";

  return (
    <div className="fixed bottom-4 right-4 z-[110] w-[min(92vw,420px)]">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-xl px-4 py-3 shadow-[0_16px_30px_-20px_rgba(2,6,23,0.8)]">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm font-semibold text-slate-100">{callContact || "Unknown"}</p>
          </div>
          {isIncoming ? (
            <>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white" onClick={answerCall}>
                <Phone className="w-4 h-4 mr-2" />
                Answer
              </Button>
              <Button size="sm" variant="destructive" onClick={declineCall}>
                <PhoneOff className="w-4 h-4 mr-2" />
                Decline
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  navigate("/chat", { state: { contact: callContact } });
                  openCallModal();
                }}
              >
                <Phone className="w-4 h-4 mr-2" />
                Open
              </Button>
              <Button size="sm" variant="destructive" onClick={() => endCall(true)}>
                <PhoneOff className="w-4 h-4 mr-2" />
                End
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
