import { useCallback, useState, type ReactNode } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, ErrorText, GreenHeader, HeaderRow, Loading, Route, SeatChip, StatusBadge, T } from '../../components/ui';
import { apiRequest } from '../../lib/api';
import { goToAuth } from '../../lib/auth';
import { cityName } from '../../lib/catalog';
import { longDate, price, shortDate, time12 } from '../../lib/format';
import { loadSession } from '../../lib/session';
import type { Booking } from '../../lib/types';
import { colors, shadow } from '../../theme';

export default function BookingsScreen() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);
  const [signedIn, setSignedIn] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState<Booking | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError('');
    const session = await loadSession().catch(() => null);
    if (!session) {
      setSignedIn(false);
      setBookings([]);
      return;
    }
    setSignedIn(true);
    try {
      setBookings(await apiRequest<Booking[]>('/me/bookings'));
    } catch (e) {
      setBookings([]);
      setError(e instanceof Error ? e.message : 'تعذر تحميل الحجوزات.');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const now = Date.now();
  const isUpcoming = (b: Booking) => b.status === 'CONFIRMED' && !!b.trip && new Date(b.trip.departureAt).getTime() > now;
  const upcoming = (bookings ?? []).filter(isUpcoming);
  const shown = tab === 'upcoming' ? upcoming : (bookings ?? []).filter((b) => !isUpcoming(b));

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <GreenHeader height={116}>
        <HeaderRow title="حجوزاتي" subtitle={signedIn && bookings ? upcomingCount(upcoming.length) : undefined} onBack={() => router.navigate('/')} />
      </GreenHeader>

      <View style={styles.tabs}>
        <Tab label="قادمة" active={tab === 'upcoming'} onPress={() => setTab('upcoming')} />
        <Tab label="سابقة" active={tab === 'past'} onPress={() => setTab('past')} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, gap: 14 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={colors.primary} />}
      >
        <ErrorText message={error} />
        {bookings === null ? <Loading /> : null}

        {!signedIn ? (
          <Empty
            title="سجّل الدخول لترى حجوزاتك"
            text="حجوزاتك القادمة والسابقة تظهر هنا بعد تسجيل الدخول."
            action={<Button label="تسجيل الدخول" onPress={() => goToAuth('/bookings')} />}
          />
        ) : bookings && !shown.length && !error ? (
          <Empty
            title={tab === 'upcoming' ? 'لا توجد حجوزات قادمة' : 'لا توجد حجوزات سابقة'}
            text={tab === 'upcoming' ? 'ابحث عن رحلة واحجز مقعدك، وسيظهر الحجز هنا.' : 'الرحلات المكتملة والملغاة تظهر هنا.'}
            action={tab === 'upcoming' ? <Button label="ابحث عن رحلة" icon="search" onPress={() => router.navigate('/')} /> : null}
          />
        ) : null}

        {shown.map((b) => {
          const at = b.trip ? new Date(b.trip.departureAt) : null;
          const expanded = open === b._id;
          return (
            <View key={b._id} style={styles.card}>
              <View style={styles.rowBetween}>
                <T size={14} color={colors.muted}>{b.code}</T>
                <StatusBadge status={b.status} />
              </View>
              {b.trip ? <Route from={cityName(b.trip.from)} to={cityName(b.trip.to)} /> : null}
              {at ? (
                <View style={styles.row}>
                  <Ionicons name="time-outline" size={18} color={colors.primary} />
                  <T size={14} color={colors.muted}>{`${longDate(at)} · ${time12(at)}`}</T>
                </View>
              ) : null}
              <View style={styles.row}>
                {b.seats.map((s) => <SeatChip key={s.seatNumber} n={s.seatNumber} />)}
              </View>

              {expanded ? (
                <View style={styles.details}>
                  {b.seats.map((s) => (
                    <View key={s.seatNumber} style={styles.rowBetween}>
                      <T size={14} color={colors.muted}>{`مقعد ${s.seatNumber}`}</T>
                      <T w="medium" size={14}>{s.passengerName}</T>
                    </View>
                  ))}
                  <View style={styles.rowBetween}>
                    <T size={14} color={colors.muted}>الدفع</T>
                    <T w="medium" size={14}>{b.paymentMethod === 'SHAM_CASH' ? `شام كاش${b.paymentRef ? ` · ${b.paymentRef}` : ''}` : 'نقداً'}</T>
                  </View>
                </View>
              ) : null}

              <View style={styles.footer}>
                {b.canCancel ? (
                  <Button label="إلغاء الحجز" icon="close" variant="dangerOutline" onPress={() => setCancelling(b)} />
                ) : (
                  <Pressable onPress={() => setOpen(expanded ? null : b._id)} style={[styles.row, { paddingVertical: 8 }]}>
                    <T w="medium" size={15} color={colors.primary}>{expanded ? 'إخفاء التفاصيل' : 'التفاصيل'}</T>
                    <Ionicons name={expanded ? 'chevron-up' : 'chevron-back'} size={18} color={colors.primary} />
                  </Pressable>
                )}
                <T w="bold" size={20} color={colors.primary}>{price(b.total)}</T>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <CancelSheet
        booking={cancelling}
        onClose={() => setCancelling(null)}
        onCancelled={() => {
          setCancelling(null);
          load();
        }}
      />
    </View>
  );
}

function upcomingCount(n: number) {
  if (n === 0) return 'لا حجوزات قادمة';
  if (n === 1) return 'حجز قادم واحد';
  if (n === 2) return 'حجزان قادمان';
  return `${n} حجوزات قادمة`;
}

/** Screen 9: bottom sheet that confirms the cancellation and shows the refund */
function CancelSheet({ booking, onClose, onCancelled }: { booking: Booking | null; onClose: () => void; onCancelled: () => void }) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const at = booking?.trip ? new Date(booking.trip.departureAt) : null;

  async function confirm() {
    if (!booking) return;
    setBusy(true);
    setError('');
    try {
      await apiRequest(`/bookings/${booking._id}/cancel`, { method: 'POST' });
      onCancelled();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر إلغاء الحجز حالياً.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible={!!booking} transparent animationType="slide" onRequestClose={onClose} onShow={() => setError('')}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      {booking ? (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
          <View style={styles.handle} />
          <T w="bold" size={24}>إلغاء الحجز؟</T>
          <T size={15} color={colors.muted}>{`هل تريد إلغاء الحجز ${booking.code}؟ ستعود المقاعد متاحة للمسافرين الآخرين.`}</T>
          <View style={styles.summary}>
            {booking.trip && at ? (
              <View style={styles.rowBetween}>
                <T size={14} color={colors.muted}>الرحلة</T>
                <T w="medium" size={14}>{`${cityName(booking.trip.from)} ← ${cityName(booking.trip.to)} · ${shortDate(at)} · ${time12(at)}`}</T>
              </View>
            ) : null}
            <View style={styles.rowBetween}>
              <T size={14} color={colors.muted}>المقاعد</T>
              <T w="medium" size={14}>{booking.seats.map((s) => `مقعد ${s.seatNumber}`).join('، ')}</T>
            </View>
            <View style={styles.rowBetween}>
              <T size={14} color={colors.muted}>المبلغ المسترد</T>
              <T w="bold" size={18} color={colors.primary}>{price(booking.refundIfCancelled ?? booking.total)}</T>
            </View>
          </View>
          <View style={styles.warn}>
            <T size={13} color={colors.wait}>يحوّل موظف الاستقبال المبلغ إلى محفظة شام كاش خلال يوم عمل. يمكن الإلغاء حتى ساعتين قبل موعد الرحلة.</T>
          </View>
          <ErrorText message={error} />
          <Button label="تأكيد الإلغاء" variant="danger" onPress={confirm} busy={busy} />
          <Button label="تراجع" variant="outline" onPress={onClose} />
        </View>
      ) : null}
    </Modal>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <T w={active ? 'bold' : 'medium'} size={16} color={active ? colors.primary : colors.muted} style={{ textAlign: 'center' }}>
        {label}
      </T>
    </Pressable>
  );
}

function Empty({ title, text, action }: { title: string; text: string; action: ReactNode }) {
  return (
    <View style={[styles.card, { alignItems: 'center', paddingVertical: 28 }]}>
      <Ionicons name="ticket-outline" size={38} color={colors.muted} />
      <T w="bold" size={17} style={{ textAlign: 'center' }}>{title}</T>
      <T size={14} color={colors.muted} style={{ textAlign: 'center' }}>{text}</T>
      {action ? <View style={{ alignSelf: 'stretch', marginTop: 8 }}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row-reverse', marginHorizontal: 16, marginVertical: 16, backgroundColor: '#ECF0EE', borderRadius: 18, padding: 4, gap: 4 },
  tab: { flex: 1, height: 42, borderRadius: 14, justifyContent: 'center' },
  tabActive: { backgroundColor: colors.surface, ...shadow, shadowOpacity: 0.06 },
  card: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.line, padding: 16, gap: 10 },
  row: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  rowBetween: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  details: { gap: 6, backgroundColor: colors.canvas, borderRadius: 14, padding: 12 },
  footer: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.line, paddingTop: 12, marginTop: 2 },
  backdrop: { flex: 1, backgroundColor: 'rgba(18,33,29,0.45)' },
  sheet: { width: '100%', maxWidth: 390, alignSelf: 'center', backgroundColor: colors.surface, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, gap: 12 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 8 },
  summary: { backgroundColor: '#F4F6F5', borderRadius: 18, padding: 14, gap: 10 },
  warn: { backgroundColor: '#FFF1D6', borderRadius: 16, padding: 14 },
});
