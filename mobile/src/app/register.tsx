import { router } from 'expo-router';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '../lib/api';
import { saveSession } from '../lib/session';
import { colors } from '../theme';

interface RegisterResponse {
  token: string;
  user: {
    _id: string;
    name: string;
    phone: string;
    role: string;
  };
}

function isRegisterResponse(value: unknown): value is RegisterResponse {
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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (name.trim().length < 2) {
      setError('أدخل الاسم، على أن يتكوّن من حرفين على الأقل.');
      return;
    }
    if (!phone.trim()) {
      setError('أدخل رقم الهاتف للمتابعة.');
      return;
    }
    if (password.length < 6) {
      setError('يجب أن تتكوّن كلمة المرور من 6 أحرف على الأقل.');
      return;
    }

    setBusy(true);
    try {
      const payload = await apiRequest<unknown>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.trim(),
          password,
        }),
      });

      if (!isRegisterResponse(payload)) {
        throw new Error('استجابة إنشاء الحساب غير صالحة');
      }
      if (payload.user.role !== 'CUSTOMER') {
        throw new Error('إنشاء الحساب عبر التطبيق مخصص لحسابات الزبائن.');
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
        reason instanceof Error ? reason.message : 'تعذر إنشاء الحساب حالياً.',
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
              accessibilityLabel="العودة لتسجيل الدخول"
              style={styles.backButton}
              onPress={() => router.replace('/sign-in')}
            >
              <Text style={styles.backGlyph}>→</Text>
            </Pressable>
            <View style={styles.brandMark}>
              <Text style={styles.brandGlyph}>ر</Text>
            </View>
            <Text style={styles.brandName}>رحلتي</Text>
            <Text style={styles.welcome}>انضم إلينا</Text>
            <Text style={styles.heroDescription}>
              أنشئ حسابك وابدأ التخطيط لرحلتك القادمة
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>إنشاء حساب جديد</Text>
            <Text style={styles.formDescription}>
              أدخل بياناتك لإنشاء حساب زبون
            </Text>

            {error ? (
              <View accessibilityRole="alert" style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.field}>
              <Text style={styles.label}>الاسم الكامل</Text>
              <TextInput
                accessibilityLabel="الاسم الكامل"
                autoComplete="name"
                placeholder="أدخل اسمك الكامل"
                placeholderTextColor="#9aa8a2"
                returnKeyType="next"
                style={styles.input}
                textAlign="right"
                value={name}
                onChangeText={setName}
              />
            </View>

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
                autoComplete="new-password"
                placeholder="6 أحرف على الأقل"
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
                {busy ? 'جارٍ إنشاء الحساب…' : 'إنشاء حساب'}
              </Text>
              {!busy && <Text style={styles.submitGlyph}>←</Text>}
            </Pressable>

            <View style={styles.loginRow}>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.replace('/sign-in')}
              >
                <Text style={styles.loginLink}>تسجيل الدخول</Text>
              </Pressable>
              <Text style={styles.loginText}>لديك حساب بالفعل؟</Text>
            </View>

            <Text style={styles.footerNote}>
              بياناتك تُستخدم لإنشاء حساب زبون فقط
            </Text>
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
    minHeight: 250,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 48,
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
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderBottomLeftRadius: 6,
    backgroundColor: colors.surface,
  },
  brandGlyph: {
    color: colors.primaryDark,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 24,
  },
  brandName: {
    marginTop: 7,
    color: colors.surface,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 19,
  },
  welcome: {
    marginTop: 12,
    color: colors.surface,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 22,
  },
  heroDescription: {
    marginTop: 4,
    color: '#c4ddd3',
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    textAlign: 'center',
  },
  formCard: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    marginTop: -25,
    padding: 22,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 22,
    backgroundColor: colors.surface,
    shadowColor: '#15382c',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  formTitle: {
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 19,
    textAlign: 'right',
  },
  formDescription: {
    marginTop: 3,
    marginBottom: 14,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    textAlign: 'right',
  },
  errorBanner: {
    marginBottom: 12,
    padding: 11,
    borderWidth: 1,
    borderColor: '#f0d7d4',
    borderRadius: 11,
    backgroundColor: '#fff5f4',
  },
  errorText: {
    color: '#a33c32',
    fontFamily: 'Cairo_500Medium',
    fontSize: 11,
    textAlign: 'right',
  },
  field: {
    marginTop: 11,
  },
  label: {
    marginBottom: 6,
    color: colors.ink,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    textAlign: 'right',
  },
  input: {
    minHeight: 47,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: '#fbfcfb',
    color: colors.ink,
    fontFamily: 'Cairo_500Medium',
    fontSize: 13,
  },
  submitButton: {
    minHeight: 49,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  submitText: {
    color: colors.surface,
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
  },
  submitGlyph: {
    color: colors.surface,
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.76,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 17,
  },
  loginText: {
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
  },
  loginLink: {
    color: colors.primary,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
  },
  footerNote: {
    marginTop: 16,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    textAlign: 'center',
  },
});
