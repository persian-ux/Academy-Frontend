import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppStore";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to sign-in if not authenticated, preserving the intended location
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Render children or nested routes
  return children ? <>{children}</> : <Outlet />;
}