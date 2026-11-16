import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export interface CustomerSession {
  token: string;
  user: {
    id: string;
    name: string;
    phone: string;
  };
}

const SESSION_KEY = 'customer-session';
let webSession: CustomerSession | null = null;

function isCustomerSession(value: unknown): value is CustomerSession {
  if (typeof value !== 'object' || value === null || !('user' in value)) {
    return false;
  }
  const user = value.user;
  return (
    'token' in value &&
    typeof value.token === 'string' &&
    typeof user === 'object' &&
    user !== null &&
    'id' in user &&
    typeof user.id === 'string' &&
    'name' in user &&
    typeof user.name === 'string' &&
    'phone' in user &&
    typeof user.phone === 'string'
  );
}

export async function saveSession(session: CustomerSession) {
  if (Platform.OS === 'web') {
    webSession = session;
    return;
  }
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
}

export async function loadSession(): Promise<CustomerSession | null> {
  if (Platform.OS === 'web') return webSession;
  const value = await SecureStore.getItemAsync(SESSION_KEY);
  if (!value) return null;

  const parsed: unknown = JSON.parse(value);
  if (!isCustomerSession(parsed)) {
    throw new Error('بيانات جلسة المستخدم المحفوظة غير صالحة');
  }

  return parsed;
}

export async function clearSession() {
  if (Platform.OS === 'web') {
    webSession = null;
    return;
  }
  await SecureStore.deleteItemAsync(SESSION_KEY);
}
