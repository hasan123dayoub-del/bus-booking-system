"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { apiRequest, jsonBody, setAuthToken } from "@/lib/api";
import type { Role, Session, User } from "@/types/domain";

interface LoginResponse {
  token?: string;
  accessToken?: string;
  user?: User;
}

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<Session>;
  logout: () => void;
}

const STORAGE_KEY = "rihlati.session";
const SERVER_SNAPSHOT = "__rihlati_server_snapshot__";
const AuthContext = createContext<AuthContextValue | null>(null);

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) ?? "";
}

function getServerSnapshot() {
  return SERVER_SNAPSHOT;
}

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("rihlati-session-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("rihlati-session-change", onChange);
  };
}

function publishSessionChange() {
  window.dispatchEvent(new Event("rihlati-session-change"));
}

function isRole(value: unknown): value is Role {
  return value === "ADMIN" || value === "RECEPTIONIST" || value === "CUSTOMER";
}

function isSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Session>;
  return (
    typeof candidate.token === "string" &&
    !!candidate.user &&
    typeof candidate.user._id === "string" &&
    typeof candidate.user.name === "string" &&
    typeof candidate.user.phone === "string" &&
    isRole(candidate.user.role)
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const stored = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const session = useMemo(() => {
    if (!stored || stored === SERVER_SNAPSHOT) return null;
    try {
      const parsed: unknown = JSON.parse(stored);
      return isSession(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }, [stored]);
  const loading = stored === SERVER_SNAPSHOT;
  const error =
    stored && stored !== SERVER_SNAPSHOT && !session
      ? "بيانات الجلسة المحفوظة غير صالحة. سجّل الدخول مجدداً."
      : null;

  useEffect(() => {
    setAuthToken(session?.token ?? null);
  }, [session?.token]);

  const login = useCallback(async (phone: string, password: string) => {
    const response = await apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: jsonBody({ phone, password }),
    });
    const token = response.token ?? response.accessToken;
    if (!token || !response.user || !isSession({ token, user: response.user })) {
      throw new Error("استجابة تسجيل الدخول لا تحتوي على رمز وجلسة مستخدم صالحين");
    }
    const nextSession = { token, user: response.user };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
    setAuthToken(token);
    publishSessionChange();
    return nextSession;
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    publishSessionChange();
  }, []);

  const value = useMemo(
    () => ({ session, loading, error, login, logout }),
    [session, loading, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
