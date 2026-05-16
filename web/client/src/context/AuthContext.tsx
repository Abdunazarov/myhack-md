import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchDemoUsers, login as apiLogin } from "../api/client";
import type { AuthUser, DemoUser } from "../api/types";

const TOKEN_KEY = "cradle_auth_token";
const USER_KEY = "cradle_auth_user";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  demoUsers: DemoUser[];
  loading: boolean;
  loginAs: (email: string, password?: string) => Promise<void>;
  loginAsRole: (role: "Founder" | "Admin") => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser) as AuthUser);
    }
    fetchDemoUsers()
      .then(setDemoUsers)
      .catch(() => setDemoUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(TOKEN_KEY, nextToken);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  }, []);

  const loginAs = useCallback(
    async (email: string, password = "demo123") => {
      const result = await apiLogin(email, password);
      persist(result.token, result.user);
    },
    [persist],
  );

  const loginAsRole = useCallback(
    async (role: "Founder" | "Admin") => {
      const match =
        demoUsers.find((u) => u.role === role) ??
        (role === "Founder"
          ? { email: "founder@demo.com", password: "demo123" }
          : { email: "admin@cradle.com", password: "demo123" });
      await loginAs(match.email, match.password);
    },
    [demoUsers, loginAs],
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      demoUsers,
      loading,
      loginAs,
      loginAsRole,
      logout,
    }),
    [user, token, demoUsers, loading, loginAs, loginAsRole, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
