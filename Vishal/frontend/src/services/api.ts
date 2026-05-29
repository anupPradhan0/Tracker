import axios, { isAxiosError } from "axios";
import type { ApiConflictBody, ApiErrorBody } from "@/types/api";

// In dev, default to same-origin + Vite proxy (avoids CORS). Set VITE_API_URL to call the API directly.
const baseURL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? "" : "http://localhost:5000");

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export function getApiErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return "Something went wrong. Please try again.";
  }

  const data = error.response?.data as ApiErrorBody | ApiConflictBody | undefined;

  if (data && "message" in data && typeof data.message === "string") {
    return data.message;
  }

  if (data && "error" in data && data.error?.message) {
    return data.error.message;
  }

  return "Something went wrong. Please try again.";
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Let React Query hooks handle redirect via ProtectedRoute
    }
    return Promise.reject(error);
  }
);
