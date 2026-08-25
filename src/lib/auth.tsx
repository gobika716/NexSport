import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { loginFn, signupFn, getUserByIdFn } from "@/server/auth";

type Mode = "login" | "signup";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  city?: string;
  elo?: number;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  ready: boolean;
  authOpen: boolean;
  authMode: Mode;
  openAuth: (mode: Mode) => void;
  closeAuth: () => void;
  setAuthMode: (mode: Mode) => void;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (values: {
    name: string;
    email: string;
    mobileNumber: string;
    password: string;
    selectedGame: string;
    experienceLevel: "Beginner" | "Intermediate" | "Advanced";
    answers: Record<string, string | string[]>;
    verificationType: string;
    certificateData?: string;
  }) => Promise<boolean>;
  logout: () => void;
  setRedirectPath: (path: string | null) => void;
}

const STORAGE_KEY = "nexsport_auth";
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function saveUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  if (user) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<Mode>("login");
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as AuthUser;
        if (parsed?.id) {
          getUserByIdFn({ data: { userId: parsed.id } })
            .then((valid) => {
              if (valid) {
                setUser({
                  id: valid.id,
                  name: valid.name,
                  email: valid.email,
                  elo: valid.elo,
                  ...(valid.city ? { city: valid.city } : {}),
                });
              } else {
                saveUser(null);
                setUser(null);
              }
            })
            .catch(() => setUser(parsed))
            .finally(() => setReady(true));
          return;
        }
      } catch {
        setUser(null);
      }
    }
    setReady(true);
  }, []);

  const applyUser = useCallback(
    (u: AuthUser) => {
      setUser(u);
      saveUser(u);
      if (redirectPath) {
        setRedirectPath(null);
        router.navigate({ to: redirectPath });
      }
    },
    [redirectPath, router],
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await loginFn({ data: { email, password } });
      if (!res.ok || !res.user) {
        toast.error(res.message ?? "Login failed. Please try again.");
        return false;
      }
      const u: AuthUser = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        elo: res.user.elo,
        ...(res.user.city ? { city: res.user.city } : {}),
      };
      applyUser(u);
      toast.success("Welcome back to NexSport", {
        description: `Signed in as ${u.email}`,
      });
      return true;
    },
    [applyUser],
  );

  const signup = useCallback(
    async ({
      name,
      email,
      password,
      mobileNumber,
      selectedGame,
      experienceLevel,
      answers,
      verificationType,
      certificateData,
    }: {
      name: string;
      email: string;
      mobileNumber: string;
      password: string;
      selectedGame: string;
      experienceLevel: "Beginner" | "Intermediate" | "Advanced";
      answers: Record<string, string | string[]>;
      verificationType: string;
      certificateName?: string;
      certificateData?: string;
    }) => {
      const res = await signupFn({
        data: {
          name: name?.trim() || email.split("@")[0] || "NexSport player",
          email,
          password,
          mobileNumber,
          selectedGame,
          experienceLevel,
          answers,
          verificationType,
          ...(certificateData ? { certificateData } : {}),
        },
      });
      if (!res.ok || !res.user) {
        toast.error(res.message ?? "Signup failed. Please try again.");
        return false;
      }
      const u: AuthUser = {
        id: res.user.id,
        name: res.user.name,
        email: res.user.email,
        elo: res.user.elo,
        ...(res.user.city ? { city: res.user.city } : {}),
      };
      applyUser(u);
      toast.success("Account created", {
        description: `Signed in as ${u.email}`,
      });
      return true;
    },
    [applyUser],
  );

  const logout = useCallback(() => {
    setUser(null);
    saveUser(null);
    toast.success("Logged out", { description: "You can log back in anytime." });
    router.navigate({ to: "/" });
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: user !== null,
      ready,
      authOpen,
      authMode,
      openAuth: (mode: Mode) => {
        setAuthMode(mode);
        setAuthOpen(true);
      },
      closeAuth: () => setAuthOpen(false),
      setAuthMode,
      login,
      signup,
      logout,
      setRedirectPath,
    }),
    [user, ready, authOpen, authMode, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function useRequireAuth() {
  const { ready, isAuthenticated, openAuth, setRedirectPath } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!isAuthenticated) {
      setRedirectPath("/dashboard");
      router.navigate({ to: "/login" });
    }
  }, [ready, isAuthenticated, setRedirectPath, router]);

  return useAuth();
}
