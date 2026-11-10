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
import { api, setToken, setUnauthorizedHandler } from "./api";
import type { Session } from "./types";

const KEY = "rihlati.session";
const EVENT = "rihlati-session";
const SERVER = "__server__";

interface AuthValue {
  session: Session | null;
  /** true until the stored session has been read in the browser */
  loading: boolean;
  login: (phone: string, password: string, remember: boolean) => Promise<Session>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

// "Remember me" keeps the session in localStorage; otherwise it lives until the tab closes.
const read = () => localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY) ?? "";
const subscribe = (cb: () => void) => {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENT, cb);
  };
};
const notify = () => window.dispatchEvent(new Event(EVENT));

function parse(raw: string): Session | null {
  if (!raw || raw === SERVER) return null;
  try {
    const s = JSON.parse(raw) as Session;
    return s?.token && s.user?._id ? s : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const raw = useSyncExternalStore(subscribe, read, () => SERVER);
  const session = useMemo(() => parse(raw), [raw]);
  setToken(session?.token ?? null);

  const logout = useCallback(() => {
    localStorage.removeItem(KEY);
    sessionStorage.removeItem(KEY);
    setToken(null);
    notify();
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    return () => setUnauthorizedHandler(null);
  }, [logout]);

  const login = useCallback(async (phone: string, password: string, remember: boolean) => {
    const next = await api.post<Session>("/auth/login", { phone, password });
    (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(next));
    setToken(next.token);
    notify();
    return next;
  }, []);

  const value = useMemo(
    () => ({ session, loading: raw === SERVER, login, logout }),
    [session, raw, login, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

export const homeFor = (role: string) => (role === "ADMIN" ? "/dashboard" : "/booking");
