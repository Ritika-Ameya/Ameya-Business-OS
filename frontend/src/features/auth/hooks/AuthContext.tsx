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
    const refreshToken = tokenStorage.getRefreshToken();
    if (!token && !refreshToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {
      // Access token may be expired — try refresh before giving up.
      if (refreshToken) {
        try {
          const refreshed = await authApi.refresh(refreshToken);
          tokenStorage.setTokens(
            refreshed.accessToken,
            refreshed.refreshToken,
            tokenStorage.isPersistent()
          );
          const me = await authApi.me();
          setUser(me);
          return;
        } catch {
          // fall through to clear
        }
      }
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

  const login = useCallback(async (email: string, password: string, rememberMe = true) => {
    const result = await authApi.login({ email, password, rememberMe });
    tokenStorage.setTokens(result.accessToken, result.refreshToken, rememberMe);
    setUser(result.user);
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    // Kick off server revoke while tokens are still available for Authorization,
    // then clear local session immediately for instant UI logout.
    const serverLogout = refreshToken
      ? authApi.logout(refreshToken).catch(() => undefined)
      : Promise.resolve();
    tokenStorage.clear();
    setUser(null);
    void serverLogout;
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
