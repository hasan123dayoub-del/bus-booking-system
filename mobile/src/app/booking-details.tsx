import { useEffect, useState, type ComponentProps } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BottomBar, Button, ClassBadge, ErrorText, GreenHeader, HeaderRow, Loading, Route, SeatChip, T } from '../components/ui';
import { apiRequest } from '../lib/api';
import { setLastBooking } from '../lib/booking-draft';
import { cityName } from '../lib/catalog';
import { longDate, price, time12 } from '../lib/format';
import { goToAuth } from '../lib/auth';
import { loadSession } from '../lib/session';
import type { Booking, TripDetail } from '../lib/types';
import { colors, fonts, shadow } from '../theme';

const ORDINALS = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس', 'السابع', 'الثامن', 'التاسع', 'العاشر'];

export default function BookingDetailsScreen() {
  const params = useLocalSearchParams<{ tripId: string; seats: string }>();
  const seats = (params.seats ?? '').split(',').map(Number).filter(Boolean);
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [names, setNames] = useState<string[]>(() => seats.map(() => ''));
  const [paymentRef, setPaymentRef] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Booking needs an account; the first passenger defaults to the customer
    loadSession().then((s) => {
      if (!s) {
        goToAuth(`/booking-details?tripId=${params.tripId}&seats=${params.seats}`, '/sign-in', true);
        return;
      }
      setNames((n) => n.map((v, i) => (i === 0 && !v ? s.user.name : v)));
    });
    apiRequest<TripDetail>(`/trips/${params.tripId}`)
      .then(setTrip)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'تعذر تحميل الرحلة.'));
  }, [params.tripId]);

  async function confirm() {
    setError('');
    if (names.some((n) => !n.trim())) return setError('أدخل اسم كل راكب قبل المتابعة.');
    if (paymentRef.trim().length < 4) return setError('أدخل رقم عملية شام كاش للمتابعة.');
    setBusy(true);
    try {
      const booking = await apiRequest<Booking>('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          tripId: params.tripId,
          seats: seats.map((seatNumber, i) => ({ seatNumber, passengerName: names[i].trim() })),
          paymentRef: paymentRef.trim(),
        }),
      });
      setLastBooking(booking);
      router.replace('/booking-confirmation');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر تأكيد الحجز حالياً.');
    } finally {
      setBusy(false);
    }
  }

  const at = trip ? new Date(trip.departureAt) : null;

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.canvas }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <GreenHeader height={116}>
        <HeaderRow title="تأكيد الحجز" subtitle="أكمل بيانات الركاب واختر طريقة الدفع" />
      </GreenHeader>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 14, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        {!trip && !error ? <Loading /> : null}
        {trip && at ? (
          <View style={[styles.card, shadow]}>
            <View style={styles.rowBetween}>
              <Route from={cityName(trip.from)} to={cityName(trip.to)} size={20} />
              {trip.bus ? <ClassBadge busClass={trip.bus.busClass} /> : null}
            </View>
            <View style={styles.row}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <T size={14} color={colors.muted}>{`${longDate(at)} · ${time12(at)}`}</T>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <T size={14} color={colors.muted}>المقاعد</T>
              {seats.map((n) => <SeatChip key={n} n={n} />)}
              <T size={14} color={colors.muted} numberOfLines={1} style={{ flex: 1, minWidth: 110, textAlign: 'left' }}>{`${price(trip.seatPrice).replace(' ل.س', '')} × ${seats.length} ل.س`}</T>
            </View>
          </View>
        ) : null}

        <T w="bold" size={20} style={{ marginTop: 6 }}>بيانات الركاب</T>
        {seats.map((n, i) => (
          <View key={n} style={styles.card}>
            <View style={styles.rowBetween}>
              <T w="medium" size={15}>{`الراكب ${i + 1}`}</T>
              <SeatChip n={n} />
            </View>
            <T size={14} color={colors.muted}>الاسم الكامل</T>
            <Input
              icon="person-outline"
              value={names[i]}
              placeholder={`اسم الراكب ${ORDINALS[i] ?? i + 1}`}
              onChangeText={(v) => setNames((all) => all.map((x, j) => (j === i ? v : x)))}
            />
          </View>
        ))}

        <T w="bold" size={20} style={{ marginTop: 6 }}>طريقة الدفع</T>
        <View style={[styles.card, styles.payCard]}>
          <View style={styles.row}>
            <View style={styles.wallet}>
              <Ionicons name="wallet-outline" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <T w="bold" size={17}>شام كاش</T>
              <T size={13} color={colors.muted}>حوّل المبلغ ثم أدخل رقم العملية</T>
            </View>
            <Ionicons name="checkmark-circle" size={30} color={colors.primary} />
          </View>
          <T size={14} color={colors.muted}>رقم عملية التحويل</T>
          <Input icon="keypad-outline" value={paymentRef} placeholder="مثال: 4829175306" onChangeText={setPaymentRef} keyboardType="number-pad" />
        </View>

        <ErrorText message={error} />
      </ScrollView>

      <BottomBar>
        <View style={styles.rowBetween}>
          <T size={15} color={colors.muted}>الإجمالي</T>
          <T w="bold" size={22}>{trip ? price(trip.seatPrice * seats.length) : ''}</T>
        </View>
        <Button label="تأكيد الحجز" icon="checkmark" onPress={confirm} busy={busy} disabled={!trip} />
      </BottomBar>
    </KeyboardAvoidingView>
  );
}

function Input({
  icon,
  ...props
}: ComponentProps<typeof TextInput> & { icon: keyof typeof Ionicons.glyphMap }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.input, focused && styles.inputFocused]}>
      <Ionicons name={icon} size={20} color={focused ? colors.primary : '#8E9A96'} />
      <TextInput
        {...props}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor="#9AA5A1"
        style={{ flex: 1, height: '100%', fontFamily: fonts.medium, fontSize: 16, color: colors.ink, textAlign: 'right', outlineWidth: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 22, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 10 },
  payCard: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: '#F1F9F6' },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  rowBetween: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  divider: { height: 1, backgroundColor: colors.line, marginVertical: 2 },
  wallet: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  input: {
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: '#F7F9F8',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  inputFocused: { borderWidth: 1.5, borderColor: colors.primary, backgroundColor: colors.surface },
});
