import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Bell, User, Shield, LogOut, Sun, Moon } from 'lucide-react'; // Added Sun and Moon
import { useTheme } from 'next-themes';

interface SidebarProps {
  onLogout: () => void;
  onAdminToggle?: () => void;
  isAdmin?: boolean;
}

const NavLink: React.FC<{ to: string; icon: React.ElementType; children: React.ReactNode }> = ({ to, icon: Icon, children }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to}>
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        className="w-full justify-start text-lg"
      >
        <Icon className="mr-4 h-6 w-6" />
        {children}
      </Button>
    </Link>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, onAdminToggle, isAdmin }) => {
  // Get the theme and setTheme function from the useTheme hook
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <div className="flex flex-col h-full p-4 border-r border-border/40 bg-background">
      {/* Logo and Brand */}
      <div className="flex items-center space-x-3 mb-8 px-2">
        <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center shadow-md">
          <span className="text-primary-foreground font-bold text-lg">W</span>
        </div>
        <h1 className="text-2xl font-bold text-primary">WhisperNet</h1>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 flex flex-col space-y-2">
        <NavLink to="/" icon={Home}>Home</NavLink>
        <NavLink to="/notifications" icon={Bell}>Notifications</NavLink>
        <NavLink to="/account" icon={User}>My Account</NavLink>
        {isAdmin && onAdminToggle && (
           <Button
              variant='ghost'
              onClick={onAdminToggle}
              className="w-full justify-start text-lg"
            >
              <Shield className="mr-4 h-6 w-6 text-orange-500" />
              Admin Panel
            </Button>
        )}
      </nav>
      
      {/* Footer Actions */}
      <div className="mt-auto space-y-2">
        {/* ADDED THIS BUTTON */}
        <Button
            variant="ghost"
            onClick={toggleTheme}
            className="w-full justify-start text-lg"
        >
            <Sun className="mr-4 h-6 w-6 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute mr-4 h-6 w-6 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="ml-10">
              {theme === 'light' ? 'Dark' : 'Light'} Mode
            </span>
        </Button>

        <Button
            variant="ghost"
            size="sm"
            onClick={onLogout}
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 text-lg"
        >
            <LogOut className="mr-4 h-6 w-6" />
            Logout
        </Button>
      </div>
    </div>
  );
};