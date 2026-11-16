import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ClassBadge, ErrorText, GreenHeader, HeaderRow, Loading, Route, T } from '../components/ui';
import { apiRequest } from '../lib/api';
import { BUS_CLASSES, CLASS_INFO, cityName, type BusClass } from '../lib/catalog';
import { addDays, dayName, isoDate, longDate, parseIsoDate, price, time12 } from '../lib/format';
import type { Trip } from '../lib/types';
import { colors, shadow } from '../theme';

export default function TripResultsScreen() {
  const params = useLocalSearchParams<{ from: string; to: string; date: string }>();
  const from = params.from ?? 'DAMASCUS';
  const to = params.to ?? 'ALEPPO';
  const [date, setDate] = useState(() => (params.date ? parseIsoDate(params.date) : new Date()));
  const [busClass, setBusClass] = useState<BusClass | null>(null);
  const [trips, setTrips] = useState<Trip[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setTrips(null);
    setError('');
    const q = `from=${from}&to=${to}&date=${isoDate(date)}${busClass ? `&class=${busClass}` : ''}`;
    apiRequest<Trip[]>(`/trips?${q}`)
      .then(setTrips)
      .catch((e: unknown) => {
        setTrips([]);
        setError(e instanceof Error ? e.message : 'تعذر تحميل الرحلات.');
      });
  }, [from, to, date, busClass]);

  useEffect(load, [load]);

  // The strip starts at the searched day (or today) and shows 5 days
  const start = params.date ? parseIsoDate(params.date) : new Date();
  const days = Array.from({ length: 5 }, (_, i) => addDays(start, i));

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <GreenHeader height={150}>
        <HeaderRow
          title={<Route from={cityName(from)} to={cityName(to)} color="#fff" />}
          subtitle={`${longDate(date).replace(' ', '، ')}${trips ? ` · ${tripsCount(trips.length)}` : ''}`}
        />
      </GreenHeader>

      <View style={[styles.strip, shadow]}>
        {days.map((d) => {
          const active = isoDate(d) === isoDate(date);
          return (
            <Pressable key={isoDate(d)} onPress={() => setDate(d)} style={[styles.day, active && styles.dayActive]}>
              <T size={12.5} color={active ? 'rgba(255,255,255,0.85)' : colors.muted} style={{ textAlign: 'center' }}>{dayName(d)}</T>
              <T w="bold" size={18} color={active ? '#fff' : colors.ink} style={{ textAlign: 'center' }}>{d.getDate()}</T>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.filters}>
        <Chip label="الكل" active={busClass === null} onPress={() => setBusClass(null)} />
        {BUS_CLASSES.map((c) => (
          <Chip key={c} label={CLASS_INFO[c].name} active={busClass === c} onPress={() => setBusClass(c)} />
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 14 }}>
        <ErrorText message={error} />
        {trips === null ? <Loading /> : null}
        {trips?.length === 0 && !error ? (
          <View style={styles.empty}>
            <Ionicons name="bus-outline" size={36} color={colors.muted} />
            <T w="bold" size={16} style={{ textAlign: 'center' }}>لا توجد رحلات بهذا اليوم</T>
            <T size={13} color={colors.muted} style={{ textAlign: 'center' }}>جرّب يوماً آخر من الشريط أو درجة أخرى.</T>
          </View>
        ) : null}
        {trips?.map((t) => {
          const at = new Date(t.departureAt);
          return (
            <Pressable key={t._id} onPress={() => router.push({ pathname: '/seat-selection', params: { tripId: t._id } })} style={styles.trip}>
              <View style={styles.tripTop}>
                <View>
                  <T w="bold" size={22}>{time12(at)}</T>
                  <T size={13} color={colors.muted}>{cityName(t.from)}</T>
                </View>
                <View style={styles.line} />
                <T size={13} color={colors.muted}>{cityName(t.to)}</T>
              </View>
              <View style={styles.tripBottom}>
                {t.bus ? <ClassBadge busClass={t.bus.busClass} /> : null}
                <T size={13} color={colors.muted} style={{ flex: 1 }}>{`${t.availableSeats} مقعد متاح`}</T>
                <T w="bold" size={20} color={colors.primary}>{price(t.seatPrice)}</T>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function tripsCount(n: number) {
  if (n === 1) return 'رحلة واحدة';
  if (n === 2) return 'رحلتان';
  return `${n} رحلات`;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <T w="medium" size={14} color={active ? '#fff' : colors.muted}>{label}</T>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  strip: {
    marginTop: -44,
    marginHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 8,
    flexDirection: 'row-reverse',
    gap: 4,
  },
  day: { flex: 1, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayActive: { backgroundColor: colors.primary },
  filters: { flexDirection: 'row-reverse', gap: 8, paddingHorizontal: 16, marginVertical: 14 },
  chip: { height: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, justifyContent: 'center' },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  trip: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 16 },
  tripTop: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  line: { flex: 1, height: 2, backgroundColor: '#D5DDDA', marginHorizontal: 34, borderRadius: 1, maxWidth: 60 },
  tripBottom: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 14 },
  empty: { alignItems: 'center', gap: 6, padding: 32 },
});
