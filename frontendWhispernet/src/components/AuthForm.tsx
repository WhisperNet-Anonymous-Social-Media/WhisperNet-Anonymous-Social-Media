import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader as Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import API from '@/api'; 
import { jwtDecode } from 'jwt-decode';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onSubmit: (email: string, password: string) => void;
  onModeChange: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit, onModeChange }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const validateEmail = (email: string): boolean => {
    const eduEmailRegex = /^[^\s@]+@[^\s@]+\.edu$/;
    return eduEmailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (mode === 'signup' && !validateEmail(email)) {
      toast({
        title: "Invalid Email",
        description: "Please use a valid college email address (.edu domain).",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        // LOGIN flow
        const res = await API.post("/login", { email, password });
        const token = res.data.token;
        localStorage.setItem("whispernet_token", token);

        const decoded: any = jwtDecode(token);
        console.log("Decoded user:", decoded);

        toast({ title: "Welcome back!", description: "Logged in successfully." });

        onSubmit(email, password);
      } else {
        // SIGNUP flow: 1) Register user 2) Send OTP
        await API.post("/register", { name: email.split("@")[0], email, password });
        await API.post("/auth/send-otp", { email });

        toast({
          title: "Account created!",
          description: "Check your email for the OTP to verify your account.",
        });

        // move to OTP step
        onSubmit(email, "");
      }
    } catch (err: any) {
      console.error(err);
      toast({
        title: "Error",
        description: err.response?.data || "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-4">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <span className="text-white font-bold text-2xl">W</span>
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            WhisperNet
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {mode === 'login'
              ? 'Welcome back to your anonymous campus community'
              : 'Join your anonymous campus community'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                College Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 text-base"
                  disabled={isLoading}
                />
              </div>
              {mode === 'signup' && email && !validateEmail(email) && (
                <p className="text-xs text-destructive mt-1">
                  Please use a valid .edu email address
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 text-base"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Eye className="h-5 w-5 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {mode === 'signup' && password && password.length < 6 && (
                <p className="text-xs text-destructive mt-1">
                  Password must be at least 6 characters
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  {mode === 'login' ? 'Logging in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'login' ? 'Log In' : 'Sign Up'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}{' '}
              <button
                onClick={onModeChange}
                className="font-semibold text-primary hover:text-primary/90 transition-colors"
                disabled={isLoading}
              >
                {mode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
