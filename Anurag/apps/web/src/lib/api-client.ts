import axios, { type AxiosError } from "axios";
import type { AxiosRequestConfig } from "axios";
import type { ApiResponse } from "@anurag/types";

const API_URL = import.meta.env.VITE_API_URL ?? "/api/v1";

/** Default for most API calls */
const DEFAULT_TIMEOUT_MS = 12_000;

/** AI summary + email report call external LLMs and may take 30–90s */
export const AI_REQUEST_TIMEOUT_MS = 90_000;

const LONG_RUNNING_URL_PATTERN = /\/(ai\/summary|email\/ai-summary)$/;

export const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: DEFAULT_TIMEOUT_MS,
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
  const path = config.url ?? "";
  if (LONG_RUNNING_URL_PATTERN.test(path)) {
    config.timeout = AI_REQUEST_TIMEOUT_MS;
  }
  return config;
});

export function formatApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.code === "ECONNABORTED") {
      return "Request timed out. AI summaries can take up to a minute — please try again.";
    }
    const msg = error.response?.data;
    if (
      msg &&
      typeof msg === "object" &&
      "error" in msg &&
      msg.error &&
      typeof msg.error === "object" &&
      "message" in msg.error &&
      typeof msg.error.message === "string"
    ) {
      return msg.error.message;
    }
    return error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong";
}

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

/** Returns `{ data, meta }` — use `.data` for the payload (unlike post/patch/put/delete). */
export async function apiGet<T>(url: string, params?: Record<string, unknown>) {
  const { data } = await apiClient.get<ApiResponse<T>>(url, { params });
  if (!data.success) throw new Error(data.error.message);
  return { data: data.data, meta: "meta" in data ? data.meta : undefined };
}

/** Returns the API payload directly (`response.data.data`), not an Axios response. */
export async function apiPost<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const { data } = await apiClient.post<ApiResponse<T>>(url, body, config);
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}

/** Returns the API payload directly (`response.data.data`), not an Axios response. */
export async function apiPatch<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const { data } = await apiClient.patch<ApiResponse<T>>(url, body, config);
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}

/** Returns the API payload directly (`response.data.data`), not an Axios response. */
export async function apiPut<T>(
  url: string,
  body?: unknown,
  config?: AxiosRequestConfig
): Promise<T> {
  const { data } = await apiClient.put<ApiResponse<T>>(url, body, config);
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}

/** Returns the API payload directly (`response.data.data`), not an Axios response. */
export async function apiDelete<T>(url: string): Promise<T> {
  const { data } = await apiClient.delete<ApiResponse<T>>(url);
  if (!data.success) throw new Error(data.error.message);
  return data.data;
}
