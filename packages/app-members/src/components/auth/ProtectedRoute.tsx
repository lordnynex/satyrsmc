import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/state/AuthContext";
import { PageLoading } from "@/components/layout/PageLoading";
import type { ReactNode } from "react";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <PageLoading />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
