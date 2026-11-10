import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

type BusClass = 'REGULAR' | 'FIRST_CLASS' | 'BUSINESS';

interface SeatLayout {
  leftSeats: number;
  rightSeats: number;
  rows: number;
  hasBackMiddleSeat: boolean;
}

const layouts: Record<BusClass, SeatLayout> = {
  REGULAR: {
    leftSeats: 2,
    rightSeats: 2,
    rows: 11,
    hasBackMiddleSeat: true,
  },
  FIRST_CLASS: {
    leftSeats: 2,
    rightSeats: 1,
    rows: 11,
    hasBackMiddleSeat: false,
  },
  BUSINESS: {
    leftSeats: 1,
    rightSeats: 1,
    rows: 11,
    hasBackMiddleSeat: false,
  },
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function safeBusClass(value: string | undefined): BusClass {
  return value === 'FIRST_CLASS' || value === 'BUSINESS' ? value : 'REGULAR';
}

function formatPrice(value: number) {
  return `${value.toLocaleString('ar-SY')} ل.س`;
}

function getPreviewBookedSeats(seatCount: number, availableSeats: number) {
  const bookedCount = Math.max(0, seatCount - availableSeats);
  return new Set(
    Array.from(
      { length: bookedCount },
      (_, index) => ((index * 7) % seatCount) + 1,
    ),
  );
}

export default function SeatSelectionScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    from?: string;
    to?: string;
    date?: string;
    passengers?: string;
    price?: string;
    available?: string;
    className?: string;
    busClass?: string;
    tripTime?: string;
  }>();
  const from = firstParam(params.from) || 'دمشق';
  const to = firstParam(params.to) || 'حلب';
  const busClass = safeBusClass(firstParam(params.busClass));
  const className = firstParam(params.className) || 'اقتصادي';
  const tripTime = firstParam(params.tripTime) || '06:00 ص';
  const parsedPrice = Number(firstParam(params.price));
  const seatPrice = Number.isFinite(parsedPrice) && parsedPrice > 0 ? parsedPrice : 85000;
  const parsedAvailable = Number(firstParam(params.available));
  const parsedPassengers = Number(firstParam(params.passengers));
  const passengerLimit =
    Number.isInteger(parsedPassengers) && parsedPassengers > 0
      ? Math.min(parsedPassengers, 8)
      : 1;
  const layout = layouts[busClass];
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const seatCount =
    layout.rows * (layout.leftSeats + layout.rightSeats) +
    Number(layout.hasBackMiddleSeat);
  const availableSeats =
    Number.isInteger(parsedAvailable) && parsedAvailable >= 0
      ? Math.min(parsedAvailable, seatCount)
      : Math.min(12, seatCount);
  const bookedSeats = useMemo(
    () => getPreviewBookedSeats(seatCount, availableSeats),
    [availableSeats, seatCount],
  );
  const total = selectedSeats.length * seatPrice;

  const rows = useMemo(() => {
    let nextSeatNumber = 1;
    return Array.from({ length: layout.rows }, (_, row) => {
      const leftSeats = Array.from(
        { length: layout.leftSeats },
        () => nextSeatNumber++,
      );
      const rightSeats = Array.from(
        { length: layout.rightSeats },
        () => nextSeatNumber++,
      );
      return { row, leftSeats, rightSeats };
    });
  }, [layout]);

  function toggleSeat(seatNumber: number) {
    if (bookedSeats.has(seatNumber)) return;
    setSelectedSeats((current) => {
      if (current.includes(seatNumber)) {
        return current.filter((seat) => seat !== seatNumber);
      }
      if (current.length >= passengerLimit) {
        Alert.alert(
          'تم الوصول للحد المحدد',
          `يمكنك اختيار ${passengerLimit.toLocaleString('ar-SY')} مقعداً حسب عدد الركاب في البحث.`,
        );
        return current;
      }
      return [...current, seatNumber].sort((a, b) => a - b);
    });
  }

  function previewContinue() {
    if (selectedSeats.length !== passengerLimit) {
      Alert.alert(
        'اختر المقاعد',
        `اختر ${passengerLimit.toLocaleString('ar-SY')} مقعداً للمتابعة.`,
      );
      return;
    }
    router.push({
      pathname: '/booking-details',
      params: {
        from,
        to,
        date: firstParam(params.date) ?? '',
        passengers: String(passengerLimit),
        price: String(seatPrice),
        className,
        tripTime,
        seats: selectedSeats.join(','),
      },
    });
  }

  function renderSeat(seatNumber: number) {
    const booked = bookedSeats.has(seatNumber);
    const selected = selectedSeats.includes(seatNumber);
    return (
      <Pressable
        key={seatNumber}
        accessibilityRole="button"
        accessibilityLabel={`المقعد ${seatNumber.toLocaleString('ar-SY')}${
          booked ? ' محجوز في المعاينة' : selected ? ' محدد' : ' متاح للمعاينة'
        }`}
        accessibilityState={{ disabled: booked, selected }}
        disabled={booked}
        style={[
          styles.seat,
          booked && styles.bookedSeat,
          selected && styles.selectedSeat,
        ]}
        onPress={() => toggleSeat(seatNumber)}
      >
        <Text
          style={[
            styles.seatNumber,
            booked && styles.bookedSeatNumber,
            selected && styles.selectedSeatNumber,
          ]}
        >
          {seatNumber.toLocaleString('ar-SY')}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: 178 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="العودة إلى الرحلات"
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backGlyph}>→</Text>
          </Pressable>
          <Text style={styles.headerEyebrow}>اختيار المقاعد</Text>
          <Text style={styles.headerTitle}>
            اختر مقعدك المفضل
          </Text>
          <View style={styles.tripSummary}>
            <Text style={styles.tripRoute}>
              {from} <Text style={styles.routeArrow}>←</Text> {to}
            </Text>
            <View style={styles.tripMetaRow}>
              <Text style={styles.tripMeta}>{tripTime}</Text>
              <View style={styles.metaDot} />
              <Text style={styles.tripMeta}>{className}</Text>
            </View>
          </View>
          <View style={styles.headerDecoration} />
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            مخطط المقاعد وحالات الحجز للمعاينة فقط
          </Text>
        </View>

        <View style={styles.busCard}>
          <View style={styles.busHeading}>
            <View>
              <Text style={styles.cardTitle}>مخطط المقاعد</Text>
              <Text style={styles.cardSubtitle}>
                {seatCount.toLocaleString('ar-SY')} مقعداً · {className} ·{' '}
                {availableSeats.toLocaleString('ar-SY')} متاح
              </Text>
            </View>
            <View style={styles.busIcon}>
              <Text style={styles.busIconGlyph}>▤</Text>
            </View>
          </View>

          <View style={styles.seatLegend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendAvailable]} />
              <Text style={styles.legendText}>متاح</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendSelected]} />
              <Text style={styles.legendText}>محدد</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendSwatch, styles.legendBooked]} />
              <Text style={styles.legendText}>محجوز</Text>
            </View>
          </View>

          <View style={styles.busInterior}>
            <View style={styles.driverRow}>
              <Text style={styles.driverLabel}>مقدمة الحافلة</Text>
              <View style={styles.steeringWheel}>
                <Text style={styles.steeringGlyph}>◉</Text>
              </View>
            </View>
            <View style={styles.aisleLine} />

            {rows.map(({ row, leftSeats, rightSeats }) => (
              <View key={row} style={styles.seatRow}>
                <View style={styles.seatGroup}>{leftSeats.map(renderSeat)}</View>
                <View style={styles.rowAisle} />
                <View style={styles.seatGroup}>{rightSeats.map(renderSeat)}</View>
              </View>
            ))}

            {layout.hasBackMiddleSeat && (
              <View style={styles.backSeatRow}>
                {renderSeat(seatCount)}
              </View>
            )}
          </View>
        </View>

        <View style={styles.selectedCard}>
          <View style={styles.selectedHeading}>
            <Text style={styles.selectedCount}>
              {selectedSeats.length.toLocaleString('ar-SY')} /{' '}
              {passengerLimit.toLocaleString('ar-SY')}
            </Text>
            <Text style={styles.selectedTitle}>المقاعد المختارة</Text>
          </View>
          {selectedSeats.length ? (
            <View style={styles.selectedSeatsList}>
              {selectedSeats.map((seat) => (
                <View key={seat} style={styles.selectedSeatChip}>
                  <Text style={styles.selectedSeatChipText}>
                    مقعد {seat.toLocaleString('ar-SY')}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptySelection}>
              اختر {passengerLimit.toLocaleString('ar-SY')} مقعداً من المخطط
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View style={styles.totalRow}>
          <View style={styles.totalCopy}>
            <Text style={styles.totalLabel}>الإجمالي التقديري</Text>
            <Text style={styles.unitPrice}>
              {formatPrice(seatPrice)} للمقعد
            </Text>
          </View>
          <Text style={styles.totalPrice}>{formatPrice(total)}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={previewContinue}
        >
          <Text style={styles.continueButtonText}>متابعة المعاينة</Text>
          <Text style={styles.continueGlyph}>←</Text>
        </Pressable>
        <Text style={styles.footerNote}>
          الحجز الفعلي غير متاح حتى ربط خدمة الحجز
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    flexGrow: 1,
  },
  header: {
    overflow: 'hidden',
    paddingHorizontal: 20,
    paddingBottom: 21,
    borderBottomLeftRadius: 27,
    borderBottomRightRadius: 27,
    backgroundColor: colors.primaryDark,
  },
  backButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  backGlyph: {
    color: colors.surface,
    fontSize: 21,
  },
  headerEyebrow: {
    marginTop: 16,
    color: '#b5d3c9',
    fontFamily: 'Cairo_500Medium',
    fontSize: 10,
    textAlign: 'right',
  },
  headerTitle: {
    marginTop: 1,
    color: colors.surface,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 21,
    textAlign: 'right',
  },
  tripSummary: {
    marginTop: 13,
    paddingHorizontal: 13,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  tripRoute: {
    color: colors.surface,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 15,
    textAlign: 'right',
  },
  routeArrow: {
    color: '#f5c977',
  },
  tripMetaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 7,
    marginTop: 3,
  },
  tripMeta: {
    color: '#d9eae4',
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#b5d3c9',
  },
  headerDecoration: {
    position: 'absolute',
    right: -56,
    bottom: -123,
    width: 185,
    height: 185,
    borderRadius: 93,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  notice: {
    marginHorizontal: 16,
    marginTop: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#f0d7a5',
    borderRadius: 12,
    backgroundColor: '#fff8e9',
  },
  noticeText: {
    color: '#725016',
    fontFamily: 'Cairo_500Medium',
    fontSize: 10,
    textAlign: 'right',
  },
  busCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 19,
    backgroundColor: colors.surface,
    shadowColor: '#17352b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 9,
    elevation: 2,
  },
  busHeading: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 15,
    textAlign: 'right',
  },
  cardSubtitle: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    textAlign: 'right',
  },
  busIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
  },
  busIconGlyph: {
    color: colors.primary,
    fontSize: 18,
  },
  seatLegend: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 19,
    marginTop: 14,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 11,
    height: 11,
    borderWidth: 1,
    borderRadius: 4,
  },
  legendAvailable: {
    borderColor: '#b9ddcf',
    backgroundColor: colors.primarySoft,
  },
  legendSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  legendBooked: {
    borderColor: '#dfe5e1',
    backgroundColor: '#edf0ee',
  },
  legendText: {
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 9,
  },
  busInterior: {
    alignSelf: 'center',
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: '#d9e8e1',
    borderRadius: 25,
    backgroundColor: '#f9fcfa',
  },
  driverRow: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
    paddingBottom: 9,
  },
  driverLabel: {
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 9,
  },
  steeringWheel: {
    width: 27,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbdad2',
    borderRadius: 14,
    backgroundColor: colors.surface,
  },
  steeringGlyph: {
    color: colors.muted,
    fontSize: 13,
  },
  aisleLine: {
    position: 'absolute',
    top: 45,
    bottom: 20,
    width: 1,
    backgroundColor: '#e9efeb',
  },
  seatRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 2,
  },
  seatGroup: {
    flexDirection: 'row',
    gap: 5,
  },
  rowAisle: {
    width: 17,
  },
  seat: {
    width: 28,
    height: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#b9ddcf',
    borderRadius: 7,
    backgroundColor: colors.primarySoft,
  },
  seatNumber: {
    color: colors.primaryDark,
    fontFamily: 'Cairo_700Bold',
    fontSize: 9,
  },
  selectedSeat: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  selectedSeatNumber: {
    color: colors.surface,
  },
  bookedSeat: {
    borderColor: '#e2e7e4',
    backgroundColor: '#edf0ee',
    opacity: 0.75,
  },
  bookedSeatNumber: {
    color: '#a3ada8',
    textDecorationLine: 'line-through',
  },
  backSeatRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 5,
  },
  selectedCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  selectedHeading: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedTitle: {
    color: colors.ink,
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
  },
  selectedCount: {
    color: colors.primary,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
  },
  selectedSeatsList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 10,
  },
  selectedSeatChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
  },
  selectedSeatChipText: {
    color: colors.primaryDark,
    fontFamily: 'Cairo_700Bold',
    fontSize: 10,
  },
  emptySelection: {
    marginTop: 8,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    paddingHorizontal: 18,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.surface,
    shadowColor: '#17352b',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 9,
  },
  totalRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  totalCopy: {
    alignItems: 'flex-end',
  },
  totalLabel: {
    color: colors.ink,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
  },
  unitPrice: {
    marginTop: 1,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 9,
  },
  totalPrice: {
    color: colors.primaryDark,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 17,
  },
  continueButton: {
    minHeight: 47,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  continueButtonText: {
    color: colors.surface,
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
  },
  continueGlyph: {
    color: colors.surface,
    fontSize: 16,
  },
  footerNote: {
    marginTop: 7,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 9,
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
