import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, GreenHeader, Route, SeatChip, T } from '../components/ui';
import { getLastBooking } from '../lib/booking-draft';
import { cityName } from '../lib/catalog';
import { price, shortDate, time12 } from '../lib/format';
import { colors, shadow } from '../theme';

export default function BookingConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const booking = getLastBooking();
  if (!booking) return <Redirect href="/bookings" />;

  const at = booking.trip ? new Date(booking.trip.departureAt) : null;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.canvas }} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
      <GreenHeader height={290}>
        <View style={{ alignItems: 'center', marginTop: 28 }}>
          <View style={styles.check}>
            <Ionicons name="checkmark" size={36} color={colors.primary} />
          </View>
          <T w="bold" size={30} color="#fff" style={{ textAlign: 'center', marginTop: 16 }}>تم الحجز بنجاح</T>
          <T size={15} color="rgba(255,255,255,0.85)" style={{ textAlign: 'center' }}>احتفظ بالرمز التالي، ستحتاجه عند الصعود</T>
        </View>
      </GreenHeader>

      <View style={[styles.ticket, shadow]}>
        <View style={styles.codeBox}>
          <T size={14} color={colors.muted} style={{ textAlign: 'center' }}>رمز الحجز</T>
          <T w="bold" size={34} color={colors.deep} style={{ textAlign: 'center', letterSpacing: 1 }}>{booking.code}</T>
        </View>
        <View style={styles.dashed} />
        {booking.trip ? (
          <Row label="الرحلة">
            <Route from={cityName(booking.trip.from)} to={cityName(booking.trip.to)} size={16} />
          </Row>
        ) : null}
        {at ? (
          <Row label="الموعد">
            <T w="medium" size={16}>{`${shortDate(at)} · ${time12(at)}`}</T>
          </Row>
        ) : null}
        <Row label="المقاعد">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {booking.seats.map((s) => <SeatChip key={s.seatNumber} n={s.seatNumber} />)}
          </View>
        </Row>
        <Row label="الدفع">
          <T w="medium" size={16}>{booking.paymentMethod === 'SHAM_CASH' ? 'شام كاش' : 'نقداً'}</T>
        </Row>
        <Row label="الإجمالي">
          <T w="medium" size={16}>{price(booking.total)}</T>
        </Row>
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={22} color={colors.wait} />
        <T size={14} color={colors.wait} style={{ flex: 1 }}>أظهر رمز الحجز لموظف الاستقبال عند الصعود.</T>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 28, gap: 4 }}>
        <Button label="عرض حجوزاتي" icon="ticket-outline" onPress={() => router.replace('/bookings')} />
        <Button label="العودة إلى الرئيسية" variant="link" onPress={() => router.replace('/')} />
      </View>
    </ScrollView>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View style={styles.row}>
      <T size={15} color={colors.muted}>{label}</T>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  check: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  ticket: { marginTop: -100, marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 28, padding: 20, gap: 14 },
  codeBox: { backgroundColor: colors.primarySoft, borderRadius: 20, paddingVertical: 14 },
  dashed: { borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: '#D5DDDA', marginVertical: 2 },
  row: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  note: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 16, padding: 14, borderRadius: 18, backgroundColor: '#FFF7E6' },
});
