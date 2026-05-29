import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Let React Query hooks handle redirect via ProtectedRoute
    }
    return Promise.reject(error);
  }
);
