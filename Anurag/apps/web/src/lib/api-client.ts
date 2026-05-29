import axios, { type AxiosError } from "axios";
import type { ApiResponse } from "@anurag/types";

const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

async function refreshAccessToken(): Promise<string | null> {
  try {
    const { data } = await axios.post<ApiResponse<{ accessToken: string }>>(
      `${API_URL}/auth/refresh`,
      {},
      { withCredentials: true }
    );
    if (data.success) {
      accessToken = data.data.accessToken;
      return accessToken;
    }
  } catch {
    accessToken = null;
  }
  return null;
}

function isRefreshRequest(url?: string) {
  return url?.includes("/auth/refresh") ?? false;
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config;
    if (!original || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Never retry refresh endpoint; prevent infinite 401 → refresh loops
    if (isRefreshRequest(original.url) || (original as { _retry?: boolean })._retry) {
      return Promise.reject(error);
    }

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const token = await refreshPromise;
    if (token) {
      (original as { _retry?: boolean })._retry = true;
      original.headers.Authorization = `Bearer ${token}`;
      return apiClient(original);
    }

    return Promise.reject(error);
  }
);

export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  const { data } = await apiClient.get<ApiResponse<T>>(url, { params });
  if (!data.success) throw new Error(data.error.message);
  return { data: data.data, meta: "meta" in data ? data.meta : undefined };
}

export async function apiPost<T>(url: string, body?: unknown) {
  const { data } = await apiClient.post<ApiResponse<T>>(url, body);
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}

export async function apiPatch<T>(url: string, body?: unknown) {
  const { data } = await apiClient.patch<ApiResponse<T>>(url, body);
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}

export async function apiPut<T>(url: string, body?: unknown) {
  const { data } = await apiClient.put<ApiResponse<T>>(url, body);
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}

export async function apiDelete<T>(url: string) {
  const { data } = await apiClient.delete<ApiResponse<T>>(url);
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}
