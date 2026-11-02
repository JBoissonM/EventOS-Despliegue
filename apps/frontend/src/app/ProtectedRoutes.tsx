import { Navigate, Outlet, useLocation } from "react-router";
import { getCurrentUserRole } from "../lib/userNavigation";

interface ProtectedRouteProps {
  allowedRoles: string[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const rolUsuario = getCurrentUserRole();
  const location = useLocation();

  if (!rolUsuario) {
    return <Navigate to="/login" replace state={{ returnUrl: location.pathname }} />;
  }

  if (!allowedRoles.includes(rolUsuario)) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}