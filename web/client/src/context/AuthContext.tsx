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
const ENTITY_KEY = "cradle_active_entity";

/** UI-facing persona (maps to backend Founder / Mentor). */
export type AppEntity = "startup" | "mentor";

export function entityToBackendRole(entity: AppEntity): "Founder" | "Mentor" {
  return entity === "startup" ? "Founder" : "Mentor";
}

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  entity: AppEntity;
  demoUsers: DemoUser[];
  loading: boolean;
  switching: boolean;
  loginAs: (email: string, password?: string) => Promise<void>;
  loginAsRole: (role: "Founder" | "Mentor" | "Admin") => Promise<void>;
  setEntity: (entity: AppEntity) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [entity, setEntityState] = useState<AppEntity>(() => {
    const stored = localStorage.getItem(ENTITY_KEY);
    return stored === "mentor" ? "mentor" : "startup";
  });
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

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

  const loginAsRoleInternal = useCallback(
    async (role: "Founder" | "Mentor" | "Admin") => {
      const fallbacks: Record<
        "Founder" | "Mentor" | "Admin",
        { email: string; password: string }
      > = {
        Founder: { email: "founder@demo.com", password: "demo123" },
        Mentor: { email: "mentor@cradle.com", password: "demo123" },
        Admin: { email: "admin@cradle.com", password: "demo123" },
      };
      const match = demoUsers.find((u) => u.role === role) ?? fallbacks[role];
      await loginAs(match.email, match.password);
    },
    [demoUsers, loginAs],
  );

  const loginAsRole = loginAsRoleInternal;

  useEffect(() => {
    if (loading) return;
    const role = entityToBackendRole(entity);
    if (user?.role === role && token) return;
    loginAsRoleInternal(role).catch(() => undefined);
  }, [loading, entity, user?.role, token, loginAsRoleInternal]);

  const setEntity = useCallback(
    async (next: AppEntity) => {
      if (next === entity) return;
      setSwitching(true);
      setEntityState(next);
      localStorage.setItem(ENTITY_KEY, next);
      try {
        await loginAsRoleInternal(entityToBackendRole(next));
      } finally {
        setSwitching(false);
      }
    },
    [entity, loginAsRoleInternal],
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
      entity,
      demoUsers,
      loading,
      switching,
      loginAs,
      loginAsRole,
      setEntity,
      logout,
    }),
    [user, token, entity, demoUsers, loading, switching, loginAs, loginAsRole, setEntity, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
