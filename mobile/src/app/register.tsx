import { useState } from 'react';
import { Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AuthScreen, Field } from '../components/auth';
import { Button, ErrorText, T } from '../components/ui';
import { authenticate, goToAuth, safeRedirect } from '../lib/auth';
import { colors } from '../theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  // The page that sent the user here (e.g. the booking in progress)
  const redirect = safeRedirect(useLocalSearchParams<{ redirect?: string }>().redirect);
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
      await authenticate('/auth/register', { name: name.trim(), phone: phone.trim(), password });
      router.replace(redirect as never);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'تعذر إنشاء الحساب حالياً.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreen
      tab="register"
      title="حساب جديد"
      subtitle="أنشئ حسابك واحجز مقعدك خلال دقائق"
      footer={
        <Pressable onPress={() => goToAuth(redirect, '/sign-in', true)} style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 32 }}>
          <T w="bold" size={15} color={colors.primary}>سجّل الدخول</T>
          <T size={15} color={colors.muted}>لديك حساب؟</T>
        </Pressable>
      }
    >
      <Field label="الاسم الكامل" icon="person-outline" value={name} onChangeText={setName} placeholder="مثال: سامر الأحمد" autoComplete="name" />
      <Field label="رقم الهاتف" icon="call-outline" prefix="+963" value={phone} onChangeText={setPhone} placeholder="944 123 456" keyboardType="phone-pad" autoComplete="tel" />
      <Field label="كلمة المرور" icon="lock-closed-outline" secure value={password} onChangeText={setPassword} placeholder="6 أحرف على الأقل" onSubmitEditing={submit} />
      <ErrorText message={error} />
      <Button label="إنشاء حساب" onPress={submit} busy={busy} />
    </AuthScreen>
  );
}
