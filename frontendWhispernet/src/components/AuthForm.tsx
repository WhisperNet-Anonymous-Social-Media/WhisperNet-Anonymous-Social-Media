import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import API from '@/api';
import { toast } from 'sonner';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (email: string, token?: string) => void;
  onModeChange: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit, onModeChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotFlow, setIsForgotFlow] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await API.post('/login', { email, password });
        const token = res.data.token;

        toast.success('Welcome back!', { description: 'Logged in successfully.' });
        onSubmit(email, token);
      } else {
        await API.post('/register', { name: email.split('@')[0], email, password });

        toast.success('Account created!', { description: 'Check your email for the OTP.' });
        onSubmit(email);
      }
    } catch (err: any) {
      toast.error(err.response?.data || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const requestResetOtp = async () => {
    if (!forgotEmail.trim()) {
      toast.error('Enter your email first.');
      return;
    }

    setIsLoading(true);
    try {
      await API.post('/auth/forgot-password/request', { email: forgotEmail.trim() });
      setOtpRequested(true);
      toast.success('Reset OTP sent', { description: 'Check your email inbox.' });
    } catch {
      toast.error('Could not send OTP.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!forgotEmail.trim() || !forgotOtp.trim() || newPassword.length < 6) {
      toast.error('Fill email, OTP and a new password (min 6 chars).');
      return;
    }

    setIsLoading(true);
    try {
      await API.post('/auth/forgot-password/reset', {
        email: forgotEmail.trim(),
        otp: forgotOtp.trim(),
        newPassword,
      });
      toast.success('Password updated. You can log in now.');
      setIsForgotFlow(false);
      setOtpRequested(false);
      setForgotOtp('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col space-y-2 text-center mb-6">
        <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-slate-100">
          {isForgotFlow ? 'Reset password' : mode === 'login' ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="text-sm text-slate-400">
          {isForgotFlow
            ? 'Request an OTP and set a new password'
            : mode === 'login'
            ? 'Enter your credentials to access your account'
            : 'Enter your email below to create your account'}
        </p>
      </div>

      <Card className="border-slate-800 bg-slate-900/92 backdrop-blur-xl shadow-[0_30px_50px_-32px_rgba(2,6,23,0.8)]">
        <CardContent className="pt-6">
          {!isForgotFlow ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-slate-950 border-slate-700 text-slate-100 focus:bg-slate-950 transition-all"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-slate-300">Password</Label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => {
                        setForgotEmail(email);
                        setIsForgotFlow(true);
                      }}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-primary transition-colors" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 bg-slate-950 border-slate-700 text-slate-100 focus:bg-slate-950 transition-all"
                    disabled={isLoading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-11 w-11 px-0 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4 text-slate-500" /> : <Eye className="h-4 w-4 text-slate-500" />}
                  </Button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 font-medium text-base shadow-lg shadow-primary/20" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Sign Up with Email'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Email</Label>
                <Input
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="your.name@example.com"
                  className="h-11 bg-slate-950 border-slate-700 text-slate-100"
                  disabled={isLoading}
                />
              </div>

              <Button type="button" onClick={requestResetOtp} disabled={isLoading} className="w-full h-11">
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send reset OTP'}
              </Button>

              {otpRequested && (
                <>
                  <div className="space-y-2">
                    <Label className="text-slate-300">OTP</Label>
                    <Input
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      placeholder="6-digit code"
                      className="h-11 bg-slate-950 border-slate-700 text-slate-100"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-300">New password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="h-11 bg-slate-950 border-slate-700 text-slate-100"
                      disabled={isLoading}
                    />
                  </div>
                  <Button type="button" onClick={resetPassword} disabled={isLoading} className="w-full h-11">
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Reset password'}
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                type="button"
                className="w-full text-slate-400"
                onClick={() => setIsForgotFlow(false)}
              >
                Back to login
              </Button>
            </div>
          )}

          {!isForgotFlow && (
            <div className="mt-6 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-900 px-2 text-slate-500">Or continue with</span>
                </div>
              </div>

              <p className="text-sm text-slate-400">
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
                <button
                  onClick={onModeChange}
                  className="font-semibold text-primary hover:text-primary/80 transition-colors underline underline-offset-4"
                  disabled={isLoading}
                >
                  {mode === 'login' ? 'Sign Up' : 'Log In'}
                </button>
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="px-8 text-center text-xs text-slate-500 mt-6">
        By clicking continue, you agree to our <a href="#" className="underline underline-offset-4 hover:text-primary">Terms of Service</a> and <a href="#" className="underline underline-offset-4 hover:text-primary">Privacy Policy</a>.
      </p>
    </div>
  );
};
