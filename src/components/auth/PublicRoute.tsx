import { Navigate, Outlet } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppStore";
import { Loader2 } from "lucide-react";

interface PublicRouteProps {
  children?: React.ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { user, isLoading } = useAppSelector((state) => state.auth);

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // Render children or nested routes
  return children ? <>{children}</> : <Outlet />;
}