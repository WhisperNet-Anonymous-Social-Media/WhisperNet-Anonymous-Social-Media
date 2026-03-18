import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';
import { VibeWidget } from './VibeWidget';
import { cn } from '@/lib/utils';

export const Layout: React.FC = () => {
  const { logout, user } = useAuth();
  const [currentMood, setCurrentMood] = useState("");

  const getMoodStyles = (mood: string) => {
    const m = mood.toLowerCase();
    if (m.includes("stress") || m.includes("angry") || m.includes("tense")) {
      return "border-red-500/30 bg-red-950/35";
    }
    if (m.includes("calm") || m.includes("relax") || m.includes("chill")) {
      return "border-blue-500/30 bg-blue-950/35";
    }
    if (m.includes("happy") || m.includes("excited") || m.includes("joy")) {
      return "border-amber-500/30 bg-amber-950/35";
    }
    return "border-slate-700 bg-slate-900/70";
  };

  return (
    <div className="flex min-h-screen relative overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 animated-bg opacity-25 pointer-events-none fixed" />

      {/* Desktop Sidebar - Glass Effect */}
      <aside className="hidden md:block w-72 fixed top-0 left-0 h-screen border-r border-slate-800/90 bg-slate-900/90 backdrop-blur-2xl z-50 shadow-[0_28px_44px_-34px_rgba(2,6,23,0.8)]">
        <Sidebar onLogout={logout} isAdmin={user?.isAdmin} />
      </aside>

      {/* Mobile Header - Glass Effect */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur-2xl flex items-center px-4 justify-between">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-blue-500/40">
              <span className="font-bold text-primary">W</span>
           </div>
           <h1 className="text-lg font-bold tracking-tight text-slate-100">WhisperNet</h1>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="hover:bg-slate-800">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 border-r border-slate-800 bg-slate-900/95 backdrop-blur-xl">
            <Sidebar onLogout={logout} isAdmin={user?.isAdmin} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 md:pl-72 pt-16 md:pt-0 relative z-10 overflow-x-hidden">
        <div
          className={cn(
            "hidden md:flex sticky top-0 z-40 h-12 border-b backdrop-blur-lg items-center justify-center transition-colors duration-500",
            getMoodStyles(currentMood)
          )}
        >
          <VibeWidget onVibeChange={setCurrentMood} />
        </div>
        <div className="max-w-[1420px] mx-auto p-4 md:p-8">
            <Outlet />
        </div>
      </main>
    </div>
  );
};
