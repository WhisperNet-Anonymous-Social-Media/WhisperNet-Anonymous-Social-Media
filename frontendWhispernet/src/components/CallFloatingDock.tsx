import React from "react";
import { Button } from "@/components/ui/button";
import { Phone, PhoneOff } from "lucide-react";
import { useCall } from "@/context/CallContext";
import { useNavigate } from "react-router-dom";

export const CallFloatingDock: React.FC = () => {
  const navigate = useNavigate();
  const { callContact, isInCall, isCallModalOpen, openCallModal, endCall } = useCall();

  const showDock = isInCall && !isCallModalOpen;
  if (!showDock) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[110] w-[min(92vw,420px)]">
      <div className="rounded-2xl border border-slate-700 bg-slate-900/95 backdrop-blur-xl px-4 py-3 shadow-[0_16px_30px_-20px_rgba(2,6,23,0.8)]">
        <div className="flex items-center gap-3 flex-wrap">
          <div>
            <p className="text-xs text-slate-500">Call In Progress</p>
            <p className="text-sm font-semibold text-slate-100">{callContact || "Unknown"}</p>
          </div>
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
        </div>
      </div>
    </div>
  );
};
