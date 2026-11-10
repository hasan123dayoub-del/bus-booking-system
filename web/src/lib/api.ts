import type { PageMeta } from "./types";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api").replace(/\/+$/, "");

/** Error returned by the API: { code, message }. */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

let token: string | null = null;
let onUnauthorized: (() => void) | null = null;

export function setToken(value: string | null) {
  token = value;
}

/** Called when the API answers 401 (expired session). */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new ApiError("تعذّر الاتصال بالخادم، تحقق من الاتصال وحاول مجدداً", 0, "NETWORK");
  }

  const text = await res.text();
  const payload = text ? JSON.parse(text) : null;
  if (!res.ok) {
    if (res.status === 401 && token) onUnauthorized?.();
    throw new ApiError(payload?.message ?? `تعذّر تنفيذ الطلب (${res.status})`, res.status, payload?.code);
  }
  return payload as T;
}

/** Every successful response is { data } (lists with paging add { meta }). */
export const api = {
  get: async <T>(path: string) => (await request<{ data: T }>("GET", path)).data,
  page: <T>(path: string) => request<{ data: T[]; meta: PageMeta }>("GET", path),
  post: async <T>(path: string, body: unknown = {}) => (await request<{ data: T }>("POST", path, body)).data,
  patch: async <T>(path: string, body: unknown = {}) => (await request<{ data: T }>("PATCH", path, body)).data,
  delete: (path: string) => request<null>("DELETE", path),
};

export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "حدث خطأ غير متوقع";

/** Builds a query string, skipping empty values. */
export function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") s.set(k, String(v));
  }
  const out = s.toString();
  return out ? `?${out}` : "";
}
