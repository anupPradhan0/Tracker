import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getApiErrorMessage } from "@/services/api";
import {
  getCurrentUser,
  login,
  logout,
  register,
} from "@/services/authService";
import type { LoginPayload, RegisterPayload } from "@/types/user";
import { ROUTES } from "@/constants/auth";

export const AUTH_QUERY_KEY = ["auth", "me"] as const;

export function useCurrentUser() {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
    onSuccess: async (user) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user);
      toast.success("Welcome back!");
      navigate(ROUTES.dashboard);
    },
    onError: (error) => {
      const msg = getApiErrorMessage(error);
      // #region agent log
      fetch("http://127.0.0.1:7653/ingest/7d610bca-fce8-41a2-94b5-7bfea24503fa", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "342f73" },
        body: JSON.stringify({
          sessionId: "342f73",
          runId: "pre-fix",
          hypothesisId: "D",
          location: "useAuth.ts:login",
          message: "login error",
          data: {
            msg,
            status: (error as { response?: { status?: number } }).response?.status,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      toast.error(msg);
    },
  });
}

export function useRegister() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: RegisterPayload) => register(payload),
    onSuccess: async (user) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, user);
      toast.success("Account created successfully!");
      navigate(ROUTES.dashboard);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: logout,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
      toast.success("Signed out");
      navigate(ROUTES.home);
    },
    onError: (error) => {
      toast.error(getApiErrorMessage(error));
    },
  });
}
