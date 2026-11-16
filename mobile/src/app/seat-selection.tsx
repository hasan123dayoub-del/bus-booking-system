import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { SeatLegend, SeatMapView } from '../components/seat-map';
import { BottomBar, Button, ErrorText, GreenHeader, HeaderRow, Loading, Route, SeatChip, T } from '../components/ui';
import { apiRequest } from '../lib/api';
import { goToAuth } from '../lib/auth';
import { loadSession } from '../lib/session';
import { CLASS_INFO, MAX_SEATS_PER_BOOKING, cityName } from '../lib/catalog';
import { longDate, price, time12 } from '../lib/format';
import type { TripDetail } from '../lib/types';
import { colors, shadow } from '../theme';

export default function SeatSelectionScreen() {
  const { tripId } = useLocalSearchParams<{ tripId: string }>();
  const [trip, setTrip] = useState<TripDetail | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    apiRequest<TripDetail>(`/trips/${tripId}`)
      .then(setTrip)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'تعذر تحميل الرحلة.'));
  }, [tripId]);

  const toggle = (n: number) => {
    setError('');
    setSelected((s) => {
      if (s.includes(n)) return s.filter((x) => x !== n);
      if (s.length >= MAX_SEATS_PER_BOOKING) {
        setError(`الحد الأقصى ${MAX_SEATS_PER_BOOKING} مقاعد في الحجز الواحد.`);
        return s;
      }
      return [...s, n].sort((a, b) => a - b);
    });
  };

  const at = trip ? new Date(trip.departureAt) : null;
  const subtitle =
    trip && at ? `${longDate(at)} · ${time12(at)}${trip.bus ? ` · ${CLASS_INFO[trip.bus.busClass].name}` : ''}` : '';

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <GreenHeader height={116}>
        <HeaderRow
          title={trip ? <Route from={cityName(trip.from)} to={cityName(trip.to)} color="#fff" /> : 'اختر مقعدك'}
          subtitle={subtitle}
        />
      </GreenHeader>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24, gap: 12 }}>
        <ErrorText message={error} />
        {!trip && !error ? <Loading /> : null}
        {trip?.seatMap ? (
          <View style={[styles.mapCard, shadow]}>
            <SeatLegend />
            <SeatMapView map={trip.seatMap} booked={trip.bookedSeats} selected={selected} onToggle={toggle} />
          </View>
        ) : null}
      </ScrollView>

      {trip ? (
        <BottomBar>
          <View style={styles.summary}>
            <View style={{ flex: 1, gap: 6 }}>
              <T size={14} color={colors.muted}>المقاعد المختارة</T>
              <View style={styles.chips}>
                {selected.length ? selected.map((n) => <SeatChip key={n} n={n} />) : <T size={13} color={colors.muted}>اختر مقعداً من المخطط</T>}
              </View>
            </View>
            <View style={{ alignItems: 'flex-start' }}>
              <T size={14} color={colors.muted}>الإجمالي</T>
              <T w="bold" size={22} color={colors.ink}>{price(trip.seatPrice * selected.length)}</T>
            </View>
          </View>
          <Button
            label="متابعة"
            icon="arrow-back"
            disabled={!selected.length}
            onPress={async () => {
              const next = `/booking-details?tripId=${trip._id}&seats=${selected.join(',')}`;
              // Booking needs an account: log in first, then come back to these seats
              if (await loadSession().catch(() => null)) router.push(next as never);
              else goToAuth(next);
            }}
          />
        </BottomBar>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  mapCard: { backgroundColor: colors.surface, borderRadius: 28, borderWidth: 1, borderColor: colors.line, paddingVertical: 18, gap: 18 },
  summary: { flexDirection: 'row-reverse', alignItems: 'flex-end', gap: 12 },
  chips: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 6 },
});
