import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppStore";

interface StudentRouteProps {
  children: React.ReactNode;
}

export default function StudentRoute({ children }: StudentRouteProps) {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // If a non-student tries to access a student page, redirect to home
  if (user.role !== "Student") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}