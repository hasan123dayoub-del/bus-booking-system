import { ReactNode, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, TextInputProps, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { goToAuth, safeRedirect } from '../lib/auth';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GreenHeader, T } from './ui';
import { colors, fonts, shadow } from '../theme';

/** Login and register share this screen: green header, card with two tabs */
export function AuthScreen({
  tab,
  title,
  subtitle,
  children,
  footer,
}: {
  tab: 'sign-in' | 'register';
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  // Switching between the two tabs keeps the page to return to
  const redirect = safeRedirect(useLocalSearchParams<{ redirect?: string }>().redirect);
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.surface }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 24 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <GreenHeader height={290}>
          <View style={{ paddingHorizontal: 24, marginTop: 34, alignItems: 'flex-end' }}>
            <View style={styles.logo}>
              <Ionicons name="bus-outline" size={30} color="#fff" />
            </View>
            <T w="bold" size={32} color="#fff" style={{ marginTop: 12 }}>{title}</T>
            <T size={15} color="rgba(255,255,255,0.85)">{subtitle}</T>
          </View>
        </GreenHeader>

        <View style={[styles.card, shadow]}>
          <View style={styles.tabs}>
            <Tab label="تسجيل الدخول" active={tab === 'sign-in'} onPress={() => goToAuth(redirect, '/sign-in', true)} />
            <Tab label="حساب جديد" active={tab === 'register'} onPress={() => goToAuth(redirect, '/register', true)} />
          </View>
          {children}
        </View>

        {footer}

        <View style={styles.secure}>
          <T size={13} color={colors.muted}>بياناتك محمية ولا تُشارك مع أي جهة</T>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <T w={active ? 'bold' : 'medium'} size={15} color={active ? colors.primary : colors.muted} style={{ textAlign: 'center' }}>
        {label}
      </T>
    </Pressable>
  );
}

/** Labelled field; the phone field shows the +963 prefix */
export function Field({
  label,
  icon,
  prefix,
  secure,
  ...input
}: TextInputProps & { label: string; icon: keyof typeof Ionicons.glyphMap; prefix?: string; secure?: boolean }) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  return (
    <View style={{ gap: 8 }}>
      <T size={14} color={colors.muted}>{label}</T>
      <View style={[styles.field, focused && styles.fieldFocused]}>
        <Ionicons name={icon} size={20} color={focused ? colors.primary : '#8E9A96'} />
        <TextInput
          {...input}
          secureTextEntry={secure && hidden}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholderTextColor="#9AA5A1"
          style={styles.input}
        />
        {prefix ? (
          <View style={styles.prefix}>
            <T w="medium" size={13} color={colors.primary}>{prefix}</T>
          </View>
        ) : null}
        {secure ? (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8} accessibilityLabel="إظهار كلمة المرور">
            <Ionicons name={hidden ? 'eye-outline' : 'eye-off-outline'} size={20} color="#8E9A96" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: { width: 56, height: 56, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  card: { marginTop: -70, marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 28, padding: 20, gap: 18 },
  tabs: { flexDirection: 'row-reverse', backgroundColor: colors.sunk, borderRadius: 16, padding: 4, gap: 4 },
  tab: { flex: 1, height: 42, borderRadius: 12, justifyContent: 'center' },
  tabActive: { backgroundColor: colors.surface, ...shadow, shadowOpacity: 0.06 },
  field: {
    height: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#F7F9F8',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  fieldFocused: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface },
  input: { flex: 1, height: '100%', fontFamily: fonts.medium, fontSize: 16, color: colors.ink, textAlign: 'right', outlineWidth: 0 },
  prefix: { height: 28, paddingHorizontal: 10, borderRadius: 8, backgroundColor: colors.primarySoft, justifyContent: 'center' },
  secure: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6, marginTop: 48 },
});
