import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { AuthPage } from '@/pages/AuthPage';
import { HomePage } from '@/pages/HomePage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AccountPage } from './pages/AccountPage';
import { Layout } from './components/Layout';
import { Toaster } from '@/components/ui/toaster';
import './App.css';

interface User {
  email: string;
  isAdmin: boolean;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const savedUser = localStorage.getItem('whispernet_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (email: string) => {
    const isAdmin = email.includes('admin') || email.includes('moderator');
    const newUser = { email, isAdmin };
    setUser(newUser);
    localStorage.setItem('whispernet_user', JSON.stringify(newUser));
    navigate('/');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('whispernet_user');
    navigate('/auth');
  };

  const handleAdminToggle = () => {
    navigate('/admin');
  };

  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <Routes>
          {!user ? (
            <Route path="*" element={<AuthPage onLogin={handleLogin} />} />
          ) : (
            <>
              <Route path="/admin" element={<AdminDashboardPage />} />
              <Route path="/*" element={
                <Layout 
                  onLogout={handleLogout} 
                  onAdminToggle={handleAdminToggle}
                  isAdmin={user.isAdmin} 
                />
              }>
                <Route index element={<HomePage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="account" element={<AccountPage />} />
              </Route>
            </>
          )}
        </Routes>
        <Toaster />
    </ThemeProvider>
  );
}

export default App;