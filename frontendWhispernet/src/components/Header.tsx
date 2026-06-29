import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Shield, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';
import { VibeWidget } from './VibeWidget';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onLogout: () => void;
  onAdminToggle?: () => void;
  isAdmin?: boolean;
  currentView: 'home' | 'admin';
}

export const Header: React.FC<HeaderProps> = ({ 
  onLogout, 
  onAdminToggle, 
  isAdmin = false, 
  currentView 
}) => {
  const { theme, setTheme } = useTheme();
  const [currentMood, setCurrentMood] = useState<string>('');

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Determine header visuals based on mood
  const getMoodStyles = (mood: string) => {
    const m = mood.toLowerCase();
    if (m.includes('stress') || m.includes('angry') || m.includes('tense')) {
      return 'border-red-500/20 bg-red-500/5';
    }
    if (m.includes('calm') || m.includes('relax') || m.includes('chill')) {
      return 'border-blue-500/20 bg-blue-500/5';
    }
    if (m.includes('happy') || m.includes('excited') || m.includes('joy')) {
      return 'border-yellow-500/20 bg-yellow-500/5';
    }
    if (m.includes('focus') || m.includes('study')) {
      return 'border-indigo-500/20 bg-indigo-500/5';
    }
    return 'border-border/40 bg-background/95'; // Default
  };

  return (
    <header 
      className={cn(
        "sticky top-0 z-50 w-full border-b backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-colors duration-500 ease-in-out",
        getMoodStyles(currentMood)
      )}
    >
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-md">
            <span className="text-primary-foreground font-bold text-lg">W</span>
          </div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">
            WhisperNet
          </h1>
          {currentView === 'admin' && (
            <div className="hidden sm:flex items-center space-x-2 ml-4 px-2 py-0.5 bg-orange-500/10 rounded-full border border-orange-500/20">
              <Shield className="h-3 w-3 text-orange-500" />
              <span className="text-xs font-medium text-orange-600 dark:text-orange-400">Admin</span>
            </div>
          )}
        </div>

        {/* Center Widget: Vibe */}
        <div className="flex-1 flex justify-center">
            <VibeWidget onVibeChange={setCurrentMood} />
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {isAdmin && onAdminToggle && (
            <Button
              variant={currentView === 'admin' ? 'default' : 'outline'}
              size="sm"
              onClick={onAdminToggle}
              className="flex items-center space-x-2"
            >
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">
                {currentView === 'admin' ? 'Back to Feed' : 'Admin Panel'}
              </span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="flex items-center space-x-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};