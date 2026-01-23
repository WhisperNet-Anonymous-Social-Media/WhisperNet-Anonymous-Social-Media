import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/context/AuthContext';

export const Layout: React.FC = () => {
  const { logout, user } = useAuth();

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed top-0 left-0 h-screen border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Sidebar onLogout={logout} isAdmin={user?.isAdmin} />
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-16 border-b bg-background/95 backdrop-blur flex items-center px-4 justify-between">
        <h1 className="text-xl font-bold text-primary">WhisperNet</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <Sidebar onLogout={logout} isAdmin={user?.isAdmin} />
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 md:pl-64 pt-16 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
};