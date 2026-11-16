import Constants from 'expo-constants';
import { loadSession } from './session';

// On a phone, "localhost" is the phone itself. Without EXPO_PUBLIC_API_URL, use the
// computer that serves the app (the Expo dev server host, e.g. 192.168.1.5:8081) on port 4000.
function defaultApiUrl() {
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return `http://${host || 'localhost'}:4000/api`;
}

const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL || defaultApiUrl()).replace(/\/+$/, '');

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

  // The API wraps every successful response as { data }
  if (isRecord(payload) && 'data' in payload) return payload.data as T;
  return payload as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
