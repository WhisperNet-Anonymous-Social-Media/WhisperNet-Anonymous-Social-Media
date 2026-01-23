import React, { useState } from "react";
import { AuthForm } from "@/components/AuthForm";
import { OtpForm } from "@/components/OtpForm";
import { useAuth } from "@/context/AuthContext";

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [emailForOtp, setEmailForOtp] = useState("");
  
  // ✅ USE THE CONTEXT HOOK
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
    // ✅ PASS THE TOKEN TO LOGIN
    // This updates the global state and redirects to "/"
    login(token, emailForOtp);
  };

  if (step === "otp") {
    return <OtpForm email={emailForOtp} onVerified={handleOtpVerified} />;
  }

  return (
    <AuthForm
      mode={mode}
      onSubmit={handleSubmit}
      onModeChange={() => setMode(mode === "login" ? "signup" : "login")}
    />
  );
};