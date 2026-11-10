import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { clearSession, CustomerSession, loadSession } from '../../lib/session';
import { colors } from '../../theme';

function initials(name: string) {
  return name.trim().slice(0, 1) || '؟';
}

function AccountAction({
  icon,
  label,
  detail,
  onPress,
  destructive = false,
  disabled = false,
}: {
  icon: string;
  label: string;
  detail?: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={({ pressed }) => [
        styles.actionRow,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
      ]}
      onPress={onPress}
    >
      <Text style={[styles.actionArrow, destructive && styles.destructiveText]}>
        ‹
      </Text>
      <View style={styles.actionCopy}>
        <Text style={[styles.actionLabel, destructive && styles.destructiveText]}>
          {label}
        </Text>
        {detail ? <Text style={styles.actionDetail}>{detail}</Text> : null}
      </View>
      <View
        style={[
          styles.actionIcon,
          destructive && styles.destructiveIcon,
        ]}
      >
        <Text
          style={[
            styles.actionIconText,
            destructive && styles.destructiveText,
          ]}
        >
          {icon}
        </Text>
      </View>
    </Pressable>
  );
}

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loadKey, setLoadKey] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoading(true);
      setError('');

      loadSession()
        .then((value) => {
          if (active) setSession(value);
        })
        .catch((reason: unknown) => {
          if (active) {
            setError(
              reason instanceof Error
                ? reason.message
                : 'تعذر تحميل بيانات الحساب.',
            );
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [loadKey]),
  );

  async function signOut() {
    setBusy(true);
    setError('');
    try {
      await clearSession();
      setSession(null);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'تعذر تسجيل الخروج حالياً.',
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 28 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>إدارة ملفك الشخصي</Text>
          <Text style={styles.title}>حسابي</Text>
        </View>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>◉</Text>
        </View>
      </View>

      {error ? (
        <View accessibilityRole="alert" style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          {!session ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setLoadKey((key) => key + 1)}
            >
              <Text style={styles.retryText}>إعادة المحاولة</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loadingCard}>
          <ActivityIndicator color={colors.primary} />
          <Text style={styles.loadingText}>جارٍ تحميل بيانات الحساب...</Text>
        </View>
      ) : session ? (
        <>
          <View style={styles.profileCard}>
            <View style={styles.profileHeading}>
              <View style={styles.profileCopy}>
                <Text style={styles.profileGreeting}>أهلاً بك</Text>
                <Text style={styles.profileName}>{session.user.name}</Text>
                <Text style={styles.profilePhone}>{session.user.phone}</Text>
              </View>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials(session.user.name)}</Text>
              </View>
            </View>
            <View style={styles.memberBadge}>
              <View style={styles.memberDot} />
              <Text style={styles.memberText}>حساب زبون</Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>حسابك ورحلاتك</Text>
          <View style={styles.actionsCard}>
            <AccountAction
              icon="▤"
              label="حجوزاتي"
              detail="تابع رحلاتك القادمة والسابقة"
              onPress={() => router.push('/bookings')}
            />
            <View style={styles.rowDivider} />
            <AccountAction
              icon="♙"
              label="البيانات الشخصية"
              detail="الاسم ورقم الهاتف المسجلان"
              disabled
              onPress={() => undefined}
            />
          </View>

          <Text style={styles.sectionTitle}>التطبيق</Text>
          <View style={styles.actionsCard}>
            <AccountAction
              icon="i"
              label="عن رحلتي"
              detail="رحلاتك بكل سهولة"
              disabled
              onPress={() => undefined}
            />
            <View style={styles.rowDivider} />
            <AccountAction
              icon="↪"
              label={busy ? 'جارٍ تسجيل الخروج...' : 'تسجيل الخروج'}
              destructive
              disabled={busy}
              onPress={() => void signOut()}
            />
          </View>
        </>
      ) : (
        <View style={styles.signedOutCard}>
          <View style={styles.signedOutIllustration}>
            <Text style={styles.signedOutGlyph}>◉</Text>
          </View>
          <Text style={styles.signedOutTitle}>حسابك يبدأ من هنا</Text>
          <Text style={styles.signedOutDescription}>
            سجّل الدخول لمتابعة بيانات حسابك والوصول إلى حجوزاتك.
          </Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.signInButton,
              pressed && styles.pressed,
            ]}
            onPress={() => router.push('/sign-in')}
          >
            <Text style={styles.signInButtonText}>تسجيل الدخول</Text>
            <Text style={styles.signInButtonIcon}>←</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            style={styles.createAccountButton}
            onPress={() => router.push('/register')}
          >
            <Text style={styles.createAccountText}>إنشاء حساب جديد</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.footer}>رحلتي · رحلاتك بكل سهولة</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 21,
  },
  headerCopy: {
    alignItems: 'flex-end',
  },
  eyebrow: {
    color: colors.primary,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
  },
  title: {
    marginTop: 1,
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 25,
  },
  headerIcon: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
  },
  headerIconText: {
    color: colors.primary,
    fontSize: 23,
  },
  errorBanner: {
    alignItems: 'flex-end',
    gap: 5,
    marginBottom: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0d7d4',
    borderRadius: 12,
    backgroundColor: '#fff5f4',
  },
  errorText: {
    color: '#a33c32',
    fontFamily: 'Cairo_500Medium',
    fontSize: 11,
    textAlign: 'right',
  },
  retryText: {
    color: colors.primary,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
  },
  loadingCard: {
    minHeight: 140,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 18,
    backgroundColor: colors.surface,
  },
  loadingText: {
    color: colors.muted,
    fontFamily: 'Cairo_500Medium',
    fontSize: 12,
  },
  profileCard: {
    padding: 18,
    overflow: 'hidden',
    borderRadius: 19,
    backgroundColor: colors.primaryDark,
  },
  profileHeading: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 13,
  },
  profileCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  profileGreeting: {
    color: '#b8d9cc',
    fontFamily: 'Cairo_500Medium',
    fontSize: 11,
  },
  profileName: {
    marginTop: 2,
    color: colors.surface,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 21,
  },
  profilePhone: {
    marginTop: 2,
    color: '#d3e6de',
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
  },
  avatar: {
    width: 58,
    height: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#6ca08c',
    borderRadius: 20,
    backgroundColor: '#1c775e',
  },
  avatarText: {
    color: colors.surface,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 25,
  },
  memberBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 17,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: '#145540',
  },
  memberDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8de0b8',
  },
  memberText: {
    color: '#d5eee3',
    fontFamily: 'Cairo_500Medium',
    fontSize: 10,
  },
  sectionTitle: {
    marginTop: 23,
    marginBottom: 9,
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 14,
    textAlign: 'right',
  },
  actionsCard: {
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  actionRow: {
    minHeight: 66,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
  },
  pressed: {
    opacity: 0.75,
  },
  disabled: {
    opacity: 0.72,
  },
  actionIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
  actionIconText: {
    color: colors.primary,
    fontFamily: 'Cairo_700Bold',
    fontSize: 17,
  },
  actionCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  actionLabel: {
    color: colors.ink,
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    textAlign: 'right',
  },
  actionDetail: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    textAlign: 'right',
  },
  actionArrow: {
    color: '#9aa8a2',
    fontSize: 22,
  },
  rowDivider: {
    height: 1,
    marginLeft: 1,
    backgroundColor: colors.line,
  },
  destructiveIcon: {
    backgroundColor: '#fff0ed',
  },
  destructiveText: {
    color: '#b44335',
  },
  signedOutCard: {
    alignItems: 'center',
    marginTop: 23,
    paddingHorizontal: 22,
    paddingVertical: 30,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  signedOutIllustration: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
  },
  signedOutGlyph: {
    color: colors.primary,
    fontSize: 34,
  },
  signedOutTitle: {
    marginTop: 15,
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 19,
  },
  signedOutDescription: {
    marginTop: 6,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
  },
  signInButton: {
    minHeight: 46,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    marginTop: 20,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  signInButtonText: {
    color: colors.surface,
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
  },
  signInButtonIcon: {
    color: colors.surface,
    fontSize: 16,
  },
  createAccountButton: {
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    marginTop: 6,
  },
  createAccountText: {
    color: colors.primary,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
  },
  footer: {
    marginTop: 26,
    color: '#98a69f',
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    textAlign: 'center',
  },
});
