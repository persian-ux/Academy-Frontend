import { Navigate, useLocation } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppStore";
import { Loader2 } from "lucide-react";

interface TeacherRouteProps {
  children: React.ReactNode;
}

/**
 * Auth guard that only allows users with the "Teacher" role to access
 * the wrapped routes. Redirects to /signin if not authenticated, or to
 * the appropriate dashboard if the user has a different role.
 */
export default function TeacherRoute({ children }: TeacherRouteProps) {
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

  // If a non-teacher tries to access a teacher page, redirect to their area
  if (user.role !== "Teacher") {
    if (user.role === "Admin") {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === "Student") {
      return <Navigate to="/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
