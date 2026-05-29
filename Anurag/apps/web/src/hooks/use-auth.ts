import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import { useAuthStore } from "@/stores/auth-store";
import type { AuthTokens, UserPublic } from "@anurag/types";
import { loginSchema, registerSchema } from "@anurag/types";
import type { z } from "zod";

export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (input: z.infer<typeof loginSchema>) => {
      const data = await apiPost<AuthTokens>("/auth/login", input);
      setAuth(data.user, data.accessToken);
      return data;
    },
  });
}

export function useRegister() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: async (input: z.infer<typeof registerSchema>) => {
      const data = await apiPost<AuthTokens>("/auth/register", input);
      setAuth(data.user, data.accessToken);
      return data;
    },
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost("/auth/logout"),
    onSettled: () => {
      clearAuth();
      qc.clear();
    },
  });
}

export function useMe() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => apiGet<UserPublic>("/auth/me").then((r) => r.data).catch(() => null),
    enabled: !!accessToken,
    retry: false,
  });
}
