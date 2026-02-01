import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { AuthProvider } from '@/context/AuthContext';
import { PrivateRoute } from '@/components/PrivateRoute';
import { AuthPage } from '@/pages/AuthPage';
import { HomePage } from '@/pages/HomePage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { AccountPage } from './pages/AccountPage';
import { ChatPage } from './pages/ChatPage'; // ✅ IMPORT THIS (Make sure you created this file!)
import { Layout } from './components/Layout';
import { Toaster } from '@/components/ui/sonner';
import './App.css';

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          
          <Route element={<PrivateRoute />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/account" element={<AccountPage />} />
              {/* ✅ ADD THIS ROUTE */}
              <Route path="/chat" element={<ChatPage />} /> 
            </Route>
          </Route>
          
          <Route path="*" element={<AuthPage />} />
        </Routes>
        <Toaster position="top-center" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;