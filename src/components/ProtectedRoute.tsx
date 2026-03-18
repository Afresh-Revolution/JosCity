import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

/**
 * ProtectedRoute component that checks if user is authenticated
 * Redirects to login if not authenticated
 */
export default function ProtectedRoute({
  children,
  requireAdmin = true,
}: ProtectedRouteProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if admin is logged in
    const checkAuth = async () => {
      try {
        if (requireAdmin) {
          const adminToken = localStorage.getItem("adminToken");
          setIsAuthenticated(!!adminToken);
        } else {
          // For non-admin routes, you can add other checks here
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [requireAdmin]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2rem",
          color: "#666",
        }}
      >
        Loading...
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
}

