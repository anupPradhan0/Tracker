import { createContext, useContext, type ReactNode } from "react";
import {
  useCurrentUser,
  useLogin,
  useLogout,
  useRegister,
} from "@/hooks/useAuth";
import type { User } from "@/types/user";

interface AuthContextValue {
  user: User | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: ReturnType<typeof useLogin>;
  register: ReturnType<typeof useRegister>;
  logout: ReturnType<typeof useLogout>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: user, isLoading } = useCurrentUser();
  const login = useLogin();
  const register = useRegister();
  const logout = useLogout();

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
