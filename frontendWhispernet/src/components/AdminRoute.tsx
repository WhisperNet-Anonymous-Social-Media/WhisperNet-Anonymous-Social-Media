import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const AdminRoute: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  return user?.isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};

