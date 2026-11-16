import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, fonts, shadow } from '../theme';
import { CLASS_INFO, type BusClass } from '../lib/catalog';
import type { BookingStatus } from '../lib/types';

type Weight = keyof typeof fonts;

/** Arabic text: Cairo, aligned right by default */
export function T({
  w = 'regular',
  size = 15,
  color = colors.ink,
  style,
  ...props
}: TextProps & { w?: Weight; size?: number; color?: string; style?: StyleProp<TextStyle> }) {
  return (
    <Text
      {...props}
      style={[{ fontFamily: fonts[w], fontSize: size, color, textAlign: 'right', lineHeight: size * 1.6 }, style]}
    />
  );
}

/** Green gradient header with the two soft circles from the design */
export function GreenHeader({
  height,
  children,
  style,
}: {
  height: number;
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient
      colors={[colors.primary, colors.deep]}
      start={{ x: 0.2, y: 0 }}
      end={{ x: 0.8, y: 1 }}
      style={[styles.header, { height: height + insets.top, paddingTop: insets.top }, style]}
    >
      <View style={[styles.circle, { width: 320, height: 320, left: -140, top: -140 }]} />
      <View style={[styles.circle, { width: 230, height: 230, right: -60, bottom: -110 }]} />
      {children}
    </LinearGradient>
  );
}

/** Header row: title in the middle, back button on the right (RTL) */
export function HeaderRow({
  title,
  subtitle,
  onBack = () => (router.canGoBack() ? router.back() : router.replace('/')),
  showBack = true,
}: {
  title: ReactNode;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
}) {
  return (
    <View style={styles.headerRow}>
      {showBack ? (
        <Pressable onPress={onBack} style={styles.backBtn} accessibilityLabel="رجوع" hitSlop={8}>
          <Ionicons name="chevron-forward" size={22} color="#fff" />
        </Pressable>
      ) : (
        <View style={{ width: 40 }} />
      )}
      <View style={{ flex: 1, alignItems: 'center' }}>
        {typeof title === 'string' ? (
          <T w="bold" size={22} color="#fff" style={{ textAlign: 'center' }}>
            {title}
          </T>
        ) : (
          title
        )}
        {subtitle ? (
          <T size={12.5} color="rgba(255,255,255,0.85)" style={{ textAlign: 'center', marginTop: -2 }}>
            {subtitle}
          </T>
        ) : null}
      </View>
      <View style={{ width: 40 }} />
    </View>
  );
}

/** "دمشق ← حلب" with the arrow between the cities */
export function Route({ from, to, size = 22, color = colors.ink }: { from: string; to: string; size?: number; color?: string }) {
  return (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 10 }}>
      <T w="bold" size={size} color={color}>{from}</T>
      <Ionicons name="arrow-back" size={size * 0.7} color={color} />
      <T w="bold" size={size} color={color}>{to}</T>
    </View>
  );
}

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  busy,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'danger' | 'outline' | 'link' | 'dangerOutline';
  busy?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = buttonVariants[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        styles.button,
        v.box,
        (variant === 'primary' || variant === 'danger') && shadow,
        (pressed || disabled) && { opacity: 0.7 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={v.color} />
      ) : (
        // As in the design: the icon sits left of the label, except on the small outline button
        <View style={{ flexDirection: variant === 'dangerOutline' ? 'row' : 'row-reverse', alignItems: 'center', gap: 10 }}>
          <T w="bold" size={variant === 'link' ? 16 : variant === 'dangerOutline' ? 15 : 18} color={v.color}>
            {label}
          </T>
          {icon ? <Ionicons name={icon} size={variant === 'dangerOutline' ? 18 : 22} color={v.color} /> : null}
        </View>
      )}
    </Pressable>
  );
}

const buttonVariants: Record<string, { box: ViewStyle; color: string }> = {
  primary: { box: { backgroundColor: colors.primary }, color: '#fff' },
  danger: { box: { backgroundColor: colors.bad }, color: '#fff' },
  outline: { box: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.line }, color: colors.ink },
  dangerOutline: { box: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: '#E3A9A9', height: 40, paddingHorizontal: 18 }, color: colors.bad },
  link: { box: { backgroundColor: 'transparent', height: 44 }, color: colors.primary },
};

export function ClassBadge({ busClass }: { busClass: BusClass }) {
  const c = CLASS_INFO[busClass];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <T w="medium" size={13} color={c.fg}>{c.name}</T>
    </View>
  );
}

const STATUS: Record<BookingStatus, { label: string; bg: string; fg: string }> = {
  CONFIRMED: { label: 'مؤكد', bg: colors.okSoft, fg: colors.ok },
  COMPLETED: { label: 'مكتمل', bg: colors.sunk, fg: colors.muted },
  CANCELLED: { label: 'ملغى', bg: colors.badSoft, fg: colors.bad },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const s = STATUS[status];
  return (
    <View style={[styles.pill, { backgroundColor: s.bg }]}>
      <T w="medium" size={13} color={s.fg}>{s.label}</T>
    </View>
  );
}

/** "مقعد 4" chip */
export function SeatChip({ n }: { n: number }) {
  return (
    <View style={[styles.pill, { backgroundColor: colors.primarySoft, paddingHorizontal: 14 }]}>
      <T w="extraBold" size={13} color={colors.primary}>{`مقعد ${n}`}</T>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** White bar pinned to the bottom with rounded top corners */
export function BottomBar({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>{children}</View>;
}

export function ErrorText({ message }: { message: string }) {
  if (!message) return null;
  return (
    <View style={styles.error}>
      <Ionicons name="alert-circle-outline" size={18} color={colors.bad} />
      <T size={13} color={colors.bad} style={{ flex: 1 }}>{message}</T>
    </View>
  );
}

export function Loading() {
  return (
    <View style={{ padding: 40, alignItems: 'center' }}>
      <ActivityIndicator color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    overflow: 'hidden',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 26,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  button: {
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  pill: {
    height: 26,
    paddingHorizontal: 12,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  bottomBar: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 18,
    gap: 12,
    ...shadow,
    shadowOffset: { width: 0, height: -6 },
  },
  error: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.badSoft,
  },
});
