import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { authApi, type AuthUser } from "../api/auth.api";
import { tokenStorage } from "../utils/token-storage";
import { AuthContext } from "./auth-context";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mounted = useRef(false);

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.getAccessToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      tokenStorage.clear();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      void refreshUser();
    }
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login({ email, password });
    tokenStorage.setTokens(result.accessToken, result.refreshToken);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = tokenStorage.getRefreshToken();
      await authApi.logout(refreshToken ?? undefined);
    } catch {
      // Best-effort logout
    }
    tokenStorage.clear();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
