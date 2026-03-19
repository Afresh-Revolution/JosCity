import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated as hasUserSession } from "../utils/userUtils";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
  redirectTo?: string;
}

/**
 * ProtectedRoute component that checks if user is authenticated
 * Redirects to login if not authenticated
 */
export default function ProtectedRoute({
  children,
  requireAdmin = true,
  redirectTo,
}: ProtectedRouteProps) {
  const redirectPath = redirectTo ?? (requireAdmin ? "/admin/login" : "/signin");

  let isAllowed = false;
  try {
    isAllowed = requireAdmin
      ? !!localStorage.getItem("adminToken")
      : hasUserSession();
  } catch (error) {
    console.error("Auth check error:", error);
  }

  // Redirect to login if not authenticated
  if (!isAllowed) {
    return <Navigate to={redirectPath} replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
}
