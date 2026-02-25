import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Bell, User, Shield, LogOut, MessageSquare, Sparkles, Bookmark, Compass } from 'lucide-react'; 
import { cn } from '@/lib/utils';
import API from '@/api';
import { useSocket } from '@/hooks/useSocket';

interface SidebarProps {
  onLogout: () => void;
  isAdmin?: boolean;
}

const NavLink: React.FC<{ to: string; icon: React.ElementType; children: React.ReactNode; badge?: number }> = ({ to, icon: Icon, children, badge }) => {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className="block w-full mb-2">
      <div
        className={cn(
          "flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group relative overflow-hidden",
          isActive 
            ? "bg-slate-800 text-blue-300 font-semibold border border-blue-500/30 shadow-[0_14px_24px_-18px_rgba(37,99,235,0.55)]" 
            : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 hover:shadow-sm"
        )}
      >
        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500" />}
        
        <Icon className={cn("h-6 w-6 transition-transform group-hover:scale-110", isActive && "fill-current")} />
        <span className="text-lg tracking-wide">{children}</span>
        {!!badge && badge > 0 && (
          <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
            {badge}
          </span>
        )}
      </div>
    </Link>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ onLogout, isAdmin }) => {
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const socket = useSocket();

  const loadCounts = async () => {
    try {
      const [{ data: notifications }, { data: conversations }] = await Promise.all([
        API.get("/api/notifications"),
        API.get("/api/chat/conversations/list"),
      ]);

      const unreadN = (notifications || []).filter((n: any) => !n.read).length;
      const unreadM = (conversations || []).reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0);
      setUnreadNotifications(unreadN);
      setUnreadMessages(unreadM);
    } catch (_) {}
  };

  useEffect(() => {
    loadCounts();
    const timer = setInterval(loadCounts, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => loadCounts();
    socket.on("notification_new", refresh);
    socket.on("receive_message", refresh);
    socket.on("message_read", refresh);
    return () => {
      socket.off("notification_new", refresh);
      socket.off("receive_message", refresh);
      socket.off("message_read", refresh);
    };
  }, [socket]);

  return (
    <div className="flex flex-col h-full p-6">
      {/* Brand Logo Link */}
      <Link to="/" className="flex items-center gap-3 mb-10 px-2 hover:opacity-80 transition-opacity">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_18px_28px_-14px_rgba(37,99,235,0.6)]">
          <Sparkles className="text-white w-7 h-7" />
        </div>
        <div>
           <h1 className="text-2xl font-bold tracking-tight text-slate-100">WhisperNet</h1>
           <p className="text-sm text-slate-500">Anonymous Social</p>
        </div>
      </Link>
      
      {/* Navigation */}
      <nav className="flex-1 space-y-2">
        <NavLink to="/" icon={Home}>Home</NavLink>
        <NavLink to="/explore" icon={Compass}>Explore</NavLink> 
        <NavLink to="/chat" icon={MessageSquare} badge={unreadMessages}>Messages</NavLink> 
        <NavLink to="/bookmarks" icon={Bookmark}>Bookmarks</NavLink> 
        <NavLink to="/notifications" icon={Bell} badge={unreadNotifications}>Notifications</NavLink>
        <NavLink to="/account" icon={User}>Profile</NavLink>
        
        {isAdmin && (
           <div className="pt-6 mt-6 border-t border-slate-800">
               <NavLink to="/admin" icon={Shield}>Admin Panel</NavLink>
           </div>
        )}
      </nav>
      
      {/* Footer Actions */}
      <div className="space-y-4 pt-8 border-t border-slate-800">
        <Button 
            variant="ghost" 
            onClick={onLogout} 
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 h-12 text-lg px-5"
        >
            <LogOut className="mr-3 h-6 w-6" />
            Sign Out
        </Button>
      </div>
    </div>
  );
};
