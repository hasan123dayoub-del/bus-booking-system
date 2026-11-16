import { router } from 'expo-router';
import { apiRequest } from './api';
import { saveSession } from './session';

/** Only paths inside the app, so a redirect can't send the user anywhere else */
export const safeRedirect = (r?: string) => (r && r.startsWith('/') && !r.startsWith('//') ? r : '/');

/** Open login (or register) and come back to `redirect` after it succeeds */
export function goToAuth(redirect: string, screen: '/sign-in' | '/register' = '/sign-in', replace = false) {
  const href = { pathname: screen, params: { redirect } } as const;
  if (replace) router.replace(href);
  else router.push(href);
}

interface AuthResponse {
  token: string;
  user: { _id: string; name: string; phone: string; role: string };
}

function isAuthResponse(value: unknown): value is AuthResponse {
  if (typeof value !== 'object' || value === null || !('user' in value)) return false;
  const user = value.user;
  return (
    'token' in value &&
    typeof value.token === 'string' &&
    typeof user === 'object' &&
    user !== null &&
    '_id' in user &&
    typeof user._id === 'string' &&
    'name' in user &&
    typeof user.name === 'string' &&
    'phone' in user &&
    typeof user.phone === 'string' &&
    'role' in user &&
    typeof user.role === 'string'
  );
}

/** POST to /auth/login or /auth/register and save the customer session */
export async function authenticate(path: '/auth/login' | '/auth/register', body: Record<string, string>) {
  const payload = await apiRequest<unknown>(path, { method: 'POST', body: JSON.stringify(body) });
  if (!isAuthResponse(payload)) {
    throw new Error(path === '/auth/login' ? 'استجابة تسجيل الدخول غير صالحة' : 'استجابة إنشاء الحساب غير صالحة');
  }
  if (payload.user.role !== 'CUSTOMER') {
    throw new Error('التطبيق مخصص لحسابات الزبائن.');
  }
  await saveSession({
    token: payload.token,
    user: { id: payload.user._id, name: payload.user.name, phone: payload.user.phone },
  });
}
