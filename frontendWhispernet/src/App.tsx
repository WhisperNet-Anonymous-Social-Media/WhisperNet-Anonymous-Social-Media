import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect, Suspense, lazy } from "react";
import { AuthPage } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { AccountPage } from "./pages/AccountPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { BookmarksPage } from "./pages/BookmarksPage";
import { ExplorePage } from "./pages/ExplorePage";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";
import { PrivateRoute } from "./components/PrivateRoute";
import { toast, Toaster } from "sonner";
import { CallProvider } from "./context/CallContext";

const ChatPage = lazy(() => import("./pages/ChatPage").then((m) => ({ default: m.ChatPage })));
const AdminDashboardPage = lazy(() =>
  import("./pages/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage }))
);

function App() {
  useEffect(() => {
    const onSessionExpired = () => {
      toast.error("Session timed out. Please log in again.");
    };
    window.addEventListener("whispernet:session-expired", onSessionExpired);
    return () => window.removeEventListener("whispernet:session-expired", onSessionExpired);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <CallProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            
            {/* ✅ Correct nesting: PrivateRoute -> Layout -> Pages */}
            <Route element={<PrivateRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route
                  path="/chat"
                  element={
                    <Suspense fallback={<div className="p-6 text-slate-400">Loading chat...</div>}>
                      <ChatPage />
                    </Suspense>
                  }
                />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/bookmarks" element={<BookmarksPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route
                  path="/admin"
                  element={
                    <Suspense fallback={<div className="p-6 text-slate-400">Loading admin...</div>}>
                      <AdminDashboardPage />
                    </Suspense>
                  }
                />
              </Route>
            </Route>
          </Routes>
        </CallProvider>
        <Toaster theme="dark" richColors position="bottom-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;
