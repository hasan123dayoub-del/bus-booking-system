import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '../lib/api';
import { saveSession } from '../lib/session';
import { colors } from '../theme';

interface LoginResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    phone: string;
    role: string;
  };
}

function isLoginResponse(value: unknown): value is LoginResponse {
  if (typeof value !== 'object' || value === null || !('user' in value)) {
    return false;
  }
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

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (!phone.trim() || !password) {
      setError('أدخل رقم الهاتف وكلمة المرور للمتابعة.');
      return;
    }

    setBusy(true);
    try {
      const payload = await apiRequest<unknown>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim(), password }),
      });

      if (!isLoginResponse(payload)) {
        throw new Error('استجابة تسجيل الدخول غير صالحة');
      }

      if (payload.user.role !== 'CUSTOMER') {
        throw new Error('تسجيل الدخول عبر التطبيق مخصص لحسابات الزبائن.');
      }

      await saveSession({
        token: payload.token,
        user: {
          id: payload.user._id,
          name: payload.user.name,
          phone: payload.user.phone,
        },
      });
      router.replace('/');
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'تعذر تسجيل الدخول حالياً.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="العودة للرئيسية"
              style={styles.backButton}
              onPress={() => router.replace('/')}
            >
              <Text style={styles.backGlyph}>→</Text>
            </Pressable>
            <View style={styles.brandMark}>
              <Text style={styles.brandGlyph}>ر</Text>
            </View>
            <Text style={styles.brandName}>رحلتي</Text>
            <Text style={styles.welcome}>أهلاً بعودتك</Text>
            <Text style={styles.heroDescription}>
              سجّل الدخول وتابع رحلتك القادمة بكل سهولة
            </Text>
            <View style={styles.heroDecorationOne} />
            <View style={styles.heroDecorationTwo} />
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>تسجيل الدخول</Text>
            <Text style={styles.formDescription}>
              أدخل بيانات حسابك للمتابعة
            </Text>

            {error ? (
              <View accessibilityRole="alert" style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>رقم الهاتف</Text>
              <TextInput
                accessibilityLabel="رقم الهاتف"
                autoComplete="tel"
                keyboardType="phone-pad"
                placeholder="09xxxxxxxx"
                placeholderTextColor="#9aa8a2"
                returnKeyType="next"
                style={styles.input}
                textAlign="right"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>كلمة المرور</Text>
              <TextInput
                accessibilityLabel="كلمة المرور"
                autoComplete="current-password"
                placeholder="أدخل كلمة المرور"
                placeholderTextColor="#9aa8a2"
                returnKeyType="done"
                secureTextEntry
                style={styles.input}
                textAlign="right"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={() => void submit()}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={busy}
              style={({ pressed }) => [
                styles.submitButton,
                (pressed || busy) && styles.buttonPressed,
              ]}
              onPress={() => void submit()}
            >
              <Text style={styles.submitText}>
                {busy ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول'}
              </Text>
              {!busy && <Text style={styles.submitGlyph}>←</Text>}
            </Pressable>

            <Text style={styles.footerNote}>
              دخول آمن إلى حسابك وحجوزاتك
            </Text>
            <View style={styles.registerRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/register')}
              >
                <Text style={styles.registerLink}>إنشاء حساب جديد</Text>
              </Pressable>
              <Text style={styles.registerText}>ليس لديك حساب؟</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flexGrow: 1,
  },
  hero: {
    minHeight: 295,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 56,
    borderBottomLeftRadius: 34,
    borderBottomRightRadius: 34,
    backgroundColor: colors.primaryDark,
  },
  backButton: {
    position: 'absolute',
    top: 16,
    left: 20,
    zIndex: 2,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  backGlyph: {
    color: colors.surface,
    fontSize: 22,
  },
  brandMark: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    borderBottomLeftRadius: 6,
    backgroundColor: colors.surface,
  },
  brandGlyph: {
    color: colors.primaryDark,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 25,
  },
  brandName: {
    marginTop: 8,
    color: colors.surface,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 20,
  },
  welcome: {
    marginTop: 15,
    color: colors.surface,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 24,
    textAlign: 'center',
  },
  heroDescription: {
    maxWidth: 280,
    marginTop: 5,
    color: '#c4ddd4',
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
  },
  heroDecorationOne: {
    position: 'absolute',
    right: -44,
    bottom: -75,
    width: 188,
    height: 188,
    borderRadius: 94,
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  heroDecorationTwo: {
    position: 'absolute',
    bottom: -112,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  formCard: {
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    marginTop: -32,
    paddingHorizontal: 22,
    paddingTop: 25,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 23,
    backgroundColor: colors.surface,
    shadowColor: '#17352b',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  formTitle: {
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 20,
    textAlign: 'right',
  },
  formDescription: {
    marginTop: 4,
    marginBottom: 21,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    textAlign: 'right',
  },
  errorBanner: {
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#f1d0cc',
    borderRadius: 12,
    backgroundColor: '#fff0ef',
  },
  errorText: {
    color: '#a43e3e',
    fontFamily: 'Cairo_500Medium',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'right',
  },
  field: {
    marginBottom: 15,
  },
  label: {
    marginBottom: 7,
    color: '#52625b',
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    textAlign: 'right',
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    backgroundColor: '#fbfdfc',
    color: colors.ink,
    fontFamily: 'Cairo_400Regular',
    fontSize: 14,
  },
  submitButton: {
    minHeight: 50,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 5,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  submitText: {
    color: colors.surface,
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
  },
  submitGlyph: {
    color: colors.surface,
    fontSize: 17,
  },
  buttonPressed: {
    opacity: 0.76,
  },
  footerNote: {
    marginTop: 15,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    textAlign: 'center',
  },
  registerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 15,
  },
  registerText: {
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
  },
  registerLink: {
    color: colors.primary,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
  },
});
