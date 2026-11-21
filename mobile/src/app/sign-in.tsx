import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthScreen, Field } from '../components/auth';
import { Button, ErrorText, T } from '../components/ui';
import { authenticate, goToAuth, safeRedirect } from '../lib/auth';
import { colors } from '../theme';

// The public demo (EXPO_PUBLIC_DEMO=true) fills in a seeded customer account with one tap.
const DEMO = process.env.EXPO_PUBLIC_DEMO === 'true';
const DEMO_PHONE = '944123456';
const DEMO_PASSWORD = 'Rihlati123';

export default function SignInScreen() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // The page that sent the user here (e.g. the booking in progress)
  const redirect = safeRedirect(useLocalSearchParams<{ redirect?: string }>().redirect);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError('');
    if (!phone.trim() || !password) {
      setError('أدخل رقم الهاتف وكلمة المرور للمتابعة.');
      return;
    }
    setBusy(true);
    try {
      await authenticate('/auth/login', { phone: phone.trim(), password });
      router.replace(redirect as never);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر تسجيل الدخول حالياً.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      tab="sign-in"
      title="أهلاً بعودتك"
      subtitle="سجّل دخولك لمتابعة حجوزاتك وحجز رحلتك القادمة"
      footer={
        <Pressable onPress={() => goToAuth(redirect, '/register', true)} style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 40 }}>
          <T w="bold" size={15} color={colors.primary}>أنشئ حساباً</T>
          <T size={15} color={colors.muted}>ليس لديك حساب؟</T>
        </Pressable>
      }
    >
      <Field label="رقم الهاتف" icon="call-outline" prefix="+963" value={phone} onChangeText={setPhone} placeholder="944 123 456" keyboardType="phone-pad" autoComplete="tel" />
      <Field label="كلمة المرور" icon="lock-closed-outline" secure value={password} onChangeText={setPassword} placeholder="••••••••" onSubmitEditing={submit} />
      <ErrorText message={error} />
      <View>
        <Button label="تسجيل الدخول" onPress={submit} busy={busy} />
      </View>
      {DEMO && (
        <View style={{ gap: 6 }}>
          <Button
            label="حساب زبون تجريبي · Demo customer"
            icon="person-outline"
            variant="outline"
            onPress={() => {
              setPhone(DEMO_PHONE);
              setPassword(DEMO_PASSWORD);
              setError('');
            }}
          />
          <T size={12} color={colors.muted} style={{ textAlign: 'center' }}>Password {DEMO_PASSWORD} · demo data resets every night</T>
        </View>
      )}
    </AuthScreen>
  );
}
