import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UserPublic } from "@anurag/types";
import { setAccessToken } from "@/lib/api-client";

interface AuthState {
  user: UserPublic | null;
  accessToken: string | null;
  setAuth: (user: UserPublic, accessToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => {
        setAccessToken(accessToken);
        set({ user, accessToken });
      },
      clearAuth: () => {
        setAccessToken(null);
        set({ user: null, accessToken: null });
      },
    }),
    {
      name: "anurag-auth",
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) setAccessToken(state.accessToken);
      },
    }
  )
);
