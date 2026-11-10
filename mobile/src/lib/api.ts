import { loadSession } from './session';
const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000/api'
).replace(/\/+$/, '');

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  const session = await loadSession();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (session) headers.set('Authorization', `Bearer ${session.token}`);

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `تعذر الاتصال بالخادم. تحقق من تشغيله وإعداد EXPO_PUBLIC_API_URL (${API_BASE_URL}).`,
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error('استجابة الخادم ليست بصيغة JSON صالحة');
  }

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.message === 'string'
      ? payload.message
      : `تعذر تنفيذ الطلب (${response.status})`;
    throw new Error(message);
  }

  return payload as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
