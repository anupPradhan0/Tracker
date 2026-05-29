import { api } from "./api";
import type { ApiSuccess } from "@/types/api";
import type { User } from "@/types/user";

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<ApiSuccess<User>>("/api/auth/me");
  return data.data;
}

export async function logout(): Promise<void> {
  await api.post("/api/auth/logout");
}

export function getGoogleLoginUrl(): string {
  const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";
  return `${baseURL}/api/auth/google`;
}
