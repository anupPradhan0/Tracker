import { api } from "./api";
import type { ApiSuccess } from "@/types/api";
import type { LoginPayload, RegisterPayload, User } from "@/types/user";

export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<ApiSuccess<{ user: User }>>("/api/auth/register", payload);
  return data.data.user;
}

export async function login(payload: LoginPayload): Promise<User> {
  const { data } = await api.post<ApiSuccess<{ user: User }>>("/api/auth/login", payload);
  return data.data.user;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<ApiSuccess<User>>("/api/auth/me");
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post("/api/auth/logout");
}
