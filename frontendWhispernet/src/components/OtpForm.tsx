import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import API from "@/api";
import { MailCheck, ShieldCheck, RefreshCw } from "lucide-react";

interface OtpFormProps {
  email: string;
  onVerified: (token: string) => void;
}

export const OtpForm: React.FC<OtpFormProps> = ({ email, onVerified }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const { toast } = useToast();

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await API.post("/auth/verify-otp", { email, otp });
      const { token } = res.data;

      localStorage.setItem("whispernet_token", token);
      toast({ title: "Verified!", description: "Your account has been verified." });

      onVerified(token);
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Invalid OTP",
        description: err.response?.data?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      setResending(true);
      await API.post("/auth/send-otp", { email });
      toast({
        title: "OTP sent again",
        description: "A new code has been sent to your email.",
      });
    } catch (err: any) {
      toast({
        title: "Could not resend OTP",
        description: err?.response?.data || "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto mt-6 border-slate-700/90 bg-slate-900/88 backdrop-blur-2xl shadow-[0_34px_64px_-34px_rgba(2,6,23,0.95)] rounded-3xl overflow-hidden">
      <div className="h-1.5 w-full bg-gradient-to-r from-cyan-400/70 via-blue-500/85 to-indigo-500/70" />
      <CardHeader className="space-y-3 pb-2">
        <div className="inline-flex items-center gap-2 rounded-full border border-blue-400/25 bg-blue-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-blue-200 w-fit">
          <ShieldCheck className="h-3.5 w-3.5" />
          Secure Verification
        </div>
        <CardTitle className="text-3xl font-semibold tracking-tight text-slate-100">Verify your email</CardTitle>
        <p className="text-sm text-slate-300 leading-relaxed">
          Enter the 6-digit one-time code sent to <span className="text-blue-300 font-medium break-all">{email}</span>
        </p>
      </CardHeader>
      <CardContent className="pt-2 pb-6">
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="relative">
            <MailCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^\d]/g, ""))}
              className="h-12 pl-10 tracking-[0.35em] text-lg font-semibold bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 focus-visible:border-blue-500"
              disabled={loading}
            />
          </div>

          <Button className="w-full h-12 text-base rounded-xl font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40" type="submit" disabled={loading || otp.length !== 6}>
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={handleResend}
            disabled={resending || loading}
            className="w-full h-10 text-slate-300 hover:text-slate-100 hover:bg-slate-800/70"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${resending ? "animate-spin" : ""}`} />
            {resending ? "Resending..." : "Resend code"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
