const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"
).replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      `تعذر الاتصال بالخادم. تحقق من تشغيل الواجهة الخلفية على ${API_BASE_URL}`,
      0,
    );
  }

  const raw = await response.text();
  let payload: unknown;
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      throw new ApiError("استجابة الخادم ليست بصيغة JSON صالحة", response.status);
    }
  }

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : `تعذر تنفيذ الطلب (${response.status})`;
    const code =
      isRecord(payload) && typeof payload.code === "string"
        ? payload.code
        : undefined;
    throw new ApiError(message, response.status, code);
  }

  if (payload === undefined) {
    return undefined as T;
  }

  if (isRecord(payload) && "data" in payload) {
    return payload.data as T;
  }

  return payload as T;
}

export async function apiList<T>(path: string): Promise<T[]> {
  const response = await apiRequest<unknown>(path);
  if (!Array.isArray(response)) {
    throw new Error("استجابة الخادم يجب أن تكون قائمة");
  }
  return response as T[];
}

export function jsonBody(value: unknown) {
  return JSON.stringify(value);
}

export function entityId(value: string | { _id: string } | { id: string }) {
  if (typeof value === "string") return value;
  return "_id" in value ? value._id : value.id;
}
