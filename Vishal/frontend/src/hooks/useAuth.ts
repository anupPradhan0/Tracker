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
      toast.error(getApiErrorMessage(error));
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
