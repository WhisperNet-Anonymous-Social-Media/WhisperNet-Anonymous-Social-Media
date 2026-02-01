import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import API from "@/api";

interface OtpFormProps {
  email: string;
  onVerified: (token: string) => void;
}

export const OtpForm: React.FC<OtpFormProps> = ({ email, onVerified }) => {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
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

  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader>
        <CardTitle>Verify your Email</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVerify} className="space-y-4">
          <Input
            placeholder="Enter the 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            disabled={loading}
          />
          <Button type="submit" disabled={loading || otp.length === 0}>
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
