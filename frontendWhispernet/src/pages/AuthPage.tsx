import React, { useState } from "react";
import { AuthForm } from "@/components/AuthForm";
import { OtpForm } from "@/components/OtpForm";

interface AuthPageProps {
  onLogin: (email: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [step, setStep] = useState<"form" | "otp">("form");
  const [emailForOtp, setEmailForOtp] = useState("");

  const handleSubmit = (email: string) => {
    if (mode === "login") {
      onLogin(email);
    } else {
      setEmailForOtp(email);
      setStep("otp");
    }
  };

  const handleOtpVerified = () => {
    onLogin(emailForOtp);
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
