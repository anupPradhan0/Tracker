import { Navigate } from "react-router-dom";
import { PageLoader } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useCurrentUser();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
