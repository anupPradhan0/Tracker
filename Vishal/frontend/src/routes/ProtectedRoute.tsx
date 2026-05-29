import { Navigate } from "react-router-dom";
import { PageLoader } from "@/components/ui/spinner";
import { useCurrentUser } from "@/hooks/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useCurrentUser();

  // #region agent log
  fetch("http://127.0.0.1:7653/ingest/7d610bca-fce8-41a2-94b5-7bfea24503fa", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "342f73" },
    body: JSON.stringify({
      sessionId: "342f73",
      runId: "pre-fix",
      hypothesisId: "C",
      location: "ProtectedRoute.tsx:render",
      message: "auth gate state",
      data: { isLoading, isError, hasUser: Boolean(user) },
      timestamp: Date.now(),
    }),
  }).catch(() => {});
  // #endregion

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
