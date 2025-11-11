import { Navigate, Outlet, useLocation } from "react-router";
import { ReactNode } from "react";
import { useAuth } from "../../hooks/useAuth";
import { UserRole } from "../../types/models";

interface ProtectedRouteProps {
  roles?: UserRole[];
  redirectTo?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({ roles, redirectTo = "/login", fallback }: ProtectedRouteProps) {
  const location = useLocation();
  const { session, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      fallback ?? (
        <div className="flex items-center justify-center w-full py-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      )
    );
  }

  if (!session) {
    return <Navigate to={redirectTo} replace state={{ from: location.pathname }} />;
  }

  if (roles && roles.length > 0 && profile && !roles.includes(profile.role)) {
    return <Navigate to="/unauthorised" replace />;
  }

  return <Outlet />;
}
