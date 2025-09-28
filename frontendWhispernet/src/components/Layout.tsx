import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  onLogout: () => void;
  onAdminToggle: () => void;
  isAdmin: boolean;
}

export const Layout: React.FC<LayoutProps> = ({ onLogout, onAdminToggle, isAdmin }) => {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar is now fixed to the left of the screen */}
      <aside className="w-64 hidden md:block fixed top-0 left-0 h-screen">
        <Sidebar onLogout={onLogout} onAdminToggle={onAdminToggle} isAdmin={isAdmin} />
      </aside>

      {/* Main content now has a left margin to avoid being hidden under the sidebar */}
      <main className="flex-1 md:pl-64">
        <Outlet />
      </main>
    </div>
  );
};