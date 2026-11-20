import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiFetch, setUnauthorizedHandler } from "./api";
import { pushTokenStorage, tokenStorage } from "./storage";

interface AuthContextValue {
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    tokenStorage.get().then((stored) => {
      setToken(stored);
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await apiFetch<{ accessToken: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    await tokenStorage.set(res.accessToken);
    setToken(res.accessToken);
  }, []);

  /** Drops the local session without calling the API (it already rejected the token). */
  const clearSession = useCallback(async () => {
    await Promise.all([tokenStorage.clear(), pushTokenStorage.clear()]);
    setToken(null);
  }, []);

  const logout = useCallback(async () => {
    // Stop this device from receiving the user's reminders; best-effort.
    const pushToken = await pushTokenStorage.get();
    if (pushToken) {
      await apiFetch(`/users/me/push-tokens/${encodeURIComponent(pushToken)}`, {
        method: "DELETE",
      }).catch(() => undefined);
    }
    await clearSession();
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(() => void clearSession());
    return () => setUnauthorizedHandler(null);
  }, [clearSession]);

  const value = useMemo(
    () => ({ token, isLoading, login, logout }),
    [token, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
