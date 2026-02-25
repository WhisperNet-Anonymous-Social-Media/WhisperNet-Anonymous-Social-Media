import React, { useState } from "react";
import { AuthForm } from "@/components/AuthForm";
import { OtpForm } from "@/components/OtpForm";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, Sparkles } from "lucide-react";

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [emailForOtp, setEmailForOtp] = useState("");
  
  const { login } = useAuth();

  const handleSubmit = (email: string, token?: string) => {
    if (mode === "login" && token) {
      // Direct login if we have a token (Login form)
      login(token, email);
    } else {
      // Move to OTP step (Signup form)
      setEmailForOtp(email);
      setStep("otp");
    }
  };

  const handleOtpVerified = (token: string) => {
    login(token, emailForOtp);
  };

  return (
    <div className="flex min-h-screen w-full overflow-hidden bg-background text-foreground">
      <div className="hidden lg:flex w-1/2 relative flex-col justify-between border-r border-slate-200 bg-slate-950">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-55"
          style={{ 
            backgroundImage: "url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop')",
            filter: "hue-rotate(195deg) contrast(1.15) saturate(1.08)" 
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-blue-950/20" />
        
        <div className="relative z-20 flex items-center p-10 text-xl font-semibold tracking-tight text-white">
          <div className="mr-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md border border-white/35">
            <Sparkles className="h-5 w-5" />
          </div>
          WhisperNet
        </div>
        
        <div className="relative z-20 mt-auto p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-white/90 backdrop-blur-md">
            <ShieldCheck className="h-3.5 w-3.5" />
            Verified Campus Community
          </div>
          <blockquote className="mt-6 space-y-4 max-w-lg">
            <p className="text-3xl font-semibold leading-tight text-white">
              Speak freely. Stay anonymous. Connect in real time.
            </p>
            <p className="text-base text-white/70 leading-relaxed">
              Built for students who want honest conversations without exposing identity.
            </p>
            <footer className="text-sm font-medium text-white/55">
              &copy; 2026 WhisperNet Inc.
            </footer>
          </blockquote>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center items-center p-4 lg:p-8 bg-slate-950 relative">
        <div className="absolute inset-0 animated-bg opacity-40 pointer-events-none" />
        
        <div className="w-full max-w-md space-y-6 relative z-10">
          {step === "otp" ? (
            <OtpForm email={emailForOtp} onVerified={handleOtpVerified} />
          ) : (
            <AuthForm
              mode={mode}
              onSubmit={handleSubmit}
              onModeChange={() => setMode(mode === "login" ? "signup" : "login")}
            />
          )}
        </div>
      </div>
    </div>
  );
};
