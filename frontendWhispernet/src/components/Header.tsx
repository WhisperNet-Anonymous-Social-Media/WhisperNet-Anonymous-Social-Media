import React from 'react';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Shield, LogOut } from 'lucide-react';
import { useTheme } from 'next-themes';

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

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-md">
            <span className="text-primary-foreground font-bold text-lg">W</span>
          </div>
          <h1 className="text-2xl font-bold text-primary">
            WhisperNet
          </h1>
          {currentView === 'admin' && (
            <div className="hidden sm:flex items-center space-x-2 ml-4">
              <Shield className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">Admin Dashboard</span>
            </div>
          )}
        </div>

        {/* Navigation Actions */}
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-9 h-9"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Admin Toggle (if user is admin) */}
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

          {/* Logout Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="flex items-center space-x-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};