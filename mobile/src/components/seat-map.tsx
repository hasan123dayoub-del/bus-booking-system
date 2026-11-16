import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme';
import { T } from './ui';
import type { SeatMap } from '../lib/types';

const SEAT_W = 34;
const SEAT_H = 30;
const GAP = 8;

type SeatState = 'available' | 'booked' | 'selected';

function Seat({ n, state, onPress }: { n: number; state: SeatState; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={state === 'booked'}
      accessibilityLabel={`المقعد ${n}${state === 'booked' ? '، محجوز' : state === 'selected' ? '، محدد' : ''}`}
      style={[styles.seat, state === 'booked' && styles.booked, state === 'selected' && styles.selected]}
    >
      {state === 'booked' ? (
        <Ionicons name="close" size={16} color="#A3ADA9" />
      ) : (
        <T w="bold" size={12} color={state === 'selected' ? '#fff' : colors.primary} style={{ textAlign: 'center', lineHeight: 16 }}>
          {n}
        </T>
      )}
    </Pressable>
  );
}

/**
 * The bus drawn as in the design: driver and door at the front, then the rows.
 * Physical layout stays left-to-right; the back middle seat sits inside the last row.
 */
export function SeatMapView({
  map,
  booked,
  selected,
  onToggle,
}: {
  map: SeatMap;
  booked: number[];
  selected: number[];
  onToggle: (n: number) => void;
}) {
  const bookedSet = new Set(booked);
  const state = (n: number): SeatState => (selected.includes(n) ? 'selected' : bookedSet.has(n) ? 'booked' : 'available');
  const seat = (n: number) => <Seat key={n} n={n} state={state(n)} onPress={() => onToggle(n)} />;
  const lastRow = map.rows.length;

  return (
    <View style={styles.bus}>
      <View style={styles.front}>
        <View style={styles.driver}>
          <MaterialCommunityIcons name="steering" size={22} color="#7A8783" />
        </View>
        <MaterialCommunityIcons name="door" size={22} color="#A3ADA9" />
      </View>
      {map.rows.map((r) => (
        <View key={r.row} style={styles.row}>
          {r.left.map(seat)}
          {r.row === lastRow && map.backMiddleSeat ? seat(map.backMiddleSeat) : <View style={styles.aisle} />}
          {r.right.map(seat)}
        </View>
      ))}
    </View>
  );
}

export function SeatLegend() {
  const item = (label: string, box: object) => (
    <View style={{ flexDirection: 'row-reverse', alignItems: 'center', gap: 6 }}>
      <View style={[styles.legendBox, box]} />
      <T size={13} color={colors.muted}>{label}</T>
    </View>
  );
  return (
    <View style={{ flexDirection: 'row-reverse', justifyContent: 'center', gap: 18 }}>
      {item('متاح', { borderColor: colors.seatAvailable, backgroundColor: colors.surface })}
      {item('محجوز', { borderColor: colors.seatBooked, backgroundColor: colors.seatBooked })}
      {item('محدد', { borderColor: colors.primary, backgroundColor: colors.primary })}
    </View>
  );
}

const styles = StyleSheet.create({
  bus: {
    alignSelf: 'center',
    gap: GAP,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 18,
    borderWidth: 1.5,
    borderColor: colors.busLine,
    borderTopLeftRadius: 44,
    borderTopRightRadius: 44,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    backgroundColor: '#F4F6F5',
  },
  front: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 2,
  },
  driver: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6EAE8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', gap: GAP },
  // Same width as a seat, so the back middle seat lines up with the aisle
  aisle: { width: SEAT_W },
  seat: {
    width: SEAT_W,
    height: SEAT_H,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.seatAvailable,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  booked: { backgroundColor: colors.seatBooked, borderColor: colors.seatBooked },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  legendBox: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5 },
});
