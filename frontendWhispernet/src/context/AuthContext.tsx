import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

interface User {
  email: string;
  pseudonym?: string;
  isAdmin: boolean;
  isBanned?: boolean;
  userId: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, email: string) => void;
  logout: (reason?: "session-expired" | "manual") => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("whispernet_token"));
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem("whispernet_token");
    if (storedToken) {
      try {
        const decoded: any = jwtDecode(storedToken);
        setUser({
            email: "User", 
            userId: decoded.userId,
            isAdmin: !!decoded.isAdmin,
            pseudonym: decoded.pseudonym
        });
        setToken(storedToken);
      } catch (error) {
        console.error("Invalid token", error);
        logout();
      }
    }
  }, []);

  useEffect(() => {
    if (!token) return;
    try {
      const decoded: any = jwtDecode(token);
      if (!decoded?.exp) return;

      const msUntilExpiry = decoded.exp * 1000 - Date.now();
      if (msUntilExpiry <= 0) {
        logout("session-expired");
        return;
      }

      const timer = setTimeout(() => {
        logout("session-expired");
      }, msUntilExpiry);

      return () => clearTimeout(timer);
    } catch {
      logout("session-expired");
    }
  }, [token]);

  const login = (newToken: string, email: string) => {
    localStorage.setItem("whispernet_token", newToken);
    setToken(newToken);
    const decoded: any = jwtDecode(newToken);
    setUser({ 
      email, 
      userId: decoded.userId, 
      isAdmin: !!decoded.isAdmin, 
      pseudonym: decoded.pseudonym 
    });
    navigate("/");
  };

  const logout = (reason: "session-expired" | "manual" = "manual") => {
    localStorage.removeItem("whispernet_token");
    setUser(null);
    setToken(null);
    if (reason === "session-expired") {
      window.dispatchEvent(new CustomEvent("whispernet:session-expired"));
    }
    navigate("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
