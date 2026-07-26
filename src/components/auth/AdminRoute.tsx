import { Navigate } from "react-router-dom";
import { useAppSelector } from "@/hooks/useAppStore";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user } = useAppSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (user.role !== "Admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}