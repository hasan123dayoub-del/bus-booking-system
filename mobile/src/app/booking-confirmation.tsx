import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseSeats(value: string | undefined) {
  if (!value) return [];
  return [...new Set(
    value
      .split(',')
      .map(Number)
      .filter((seat) => Number.isInteger(seat) && seat > 0),
  )].sort((a, b) => a - b);
}

function formatPrice(value: number) {
  return `${value.toLocaleString('ar-SY')} ل.س`;
}

function formatDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return 'التاريخ المحدد';
  }
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('ar-SY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(year, month - 1, day, 12));
}

export default function BookingConfirmationScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    from?: string;
    to?: string;
    date?: string;
    price?: string;
    className?: string;
    tripTime?: string;
    seats?: string;
    paymentMethod?: string;
  }>();
  const from = firstParam(params.from) || 'دمشق';
  const to = firstParam(params.to) || 'حلب';
  const seats = useMemo(
    () => parseSeats(firstParam(params.seats)),
    [params.seats],
  );
  const priceValue = Number(firstParam(params.price));
  const price = Number.isFinite(priceValue) && priceValue > 0 ? priceValue : 0;
  const total = price * seats.length;
  const paymentMethod =
    firstParam(params.paymentMethod) === 'SHAM_CASH' ? 'شام كاش' : 'الدفع نقداً';

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 10, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brandRow}>
          <View style={styles.brandMark}>
            <Text style={styles.brandGlyph}>ر</Text>
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandName}>رحلتي</Text>
            <Text style={styles.brandCaption}>رحلاتك بكل سهولة</Text>
          </View>
        </View>

        <View style={styles.statusIcon}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
        <Text style={styles.eyebrow}>انتهت معاينة التدفق</Text>
        <Text style={styles.title}>وصلت إلى نهاية المعاينة</Text>
        <Text style={styles.description}>
          راجعت تفاصيل الرحلة والمقاعد وبيانات الحجز بنجاح.
        </Text>

        <View style={styles.previewNotice}>
          <View style={styles.noticeMark}>
            <Text style={styles.noticeMarkText}>!</Text>
          </View>
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>لم يتم إنشاء حجز فعلي</Text>
            <Text style={styles.noticeDescription}>
              هذه شاشة تصميمية فقط. لم تُحجز المقاعد ولم يتم تحصيل أي مبلغ.
              ستظهر هنا تفاصيل التأكيد الحقيقية عند ربط خدمات الحجز والدفع.
            </Text>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View>
              <Text style={styles.summaryTitle}>ملخص المعاينة</Text>
              <Text style={styles.summaryCaption}>
                بيانات توضيحية وليست تذكرة سفر
              </Text>
            </View>
            <View style={styles.demoBadge}>
              <Text style={styles.demoBadgeText}>معاينة</Text>
            </View>
          </View>

          <View style={styles.routeRow}>
            <View style={styles.cityBlock}>
              <Text style={styles.metaLabel}>من</Text>
              <Text style={styles.cityName}>{from}</Text>
            </View>
            <View style={styles.routeMiddle}>
              <View style={styles.routeRule} />
              <Text style={styles.routeArrow}>←</Text>
            </View>
            <View style={styles.cityBlock}>
              <Text style={styles.metaLabel}>إلى</Text>
              <Text style={styles.cityName}>{to}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>
              {formatDate(firstParam(params.date))}
            </Text>
            <Text style={styles.detailLabel}>موعد الرحلة</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>
              {firstParam(params.tripTime) || '06:00 ص'}
            </Text>
            <Text style={styles.detailLabel}>وقت الانطلاق</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>
              {firstParam(params.className) || 'اقتصادي'}
            </Text>
            <Text style={styles.detailLabel}>فئة الحافلة</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{paymentMethod}</Text>
            <Text style={styles.detailLabel}>طريقة الدفع المختارة</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.seatSection}>
            <Text style={styles.seatSectionTitle}>المقاعد المختارة</Text>
            <View style={styles.seatList}>
              {seats.map((seat) => (
                <View key={seat} style={styles.seatChip}>
                  <Text style={styles.seatChipText}>
                    مقعد {seat.toLocaleString('ar-SY')}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            <Text style={styles.totalLabel}>الإجمالي التقديري</Text>
          </View>
          <Text style={styles.totalNote}>
            السعر للمعاينة فقط وغير قابل للدفع
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.homeButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.homeButtonText}>العودة إلى الرئيسية</Text>
          <Text style={styles.homeButtonGlyph}>⌂</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          style={styles.newTripButton}
          onPress={() => router.replace('/trip-search')}
        >
          <Text style={styles.newTripButtonText}>استكشف رحلة أخرى</Text>
        </Pressable>
      </ScrollView>
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
    alignItems: 'center',
    paddingHorizontal: 19,
  },
  brandRow: {
    width: '100%',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
  },
  brandMark: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    borderBottomLeftRadius: 5,
    backgroundColor: colors.primary,
  },
  brandGlyph: {
    color: colors.surface,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 20,
  },
  brandCopy: {
    alignItems: 'flex-end',
  },
  brandName: {
    color: colors.primaryDark,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 15,
  },
  brandCaption: {
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 9,
  },
  statusIcon: {
    width: 66,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
    borderRadius: 33,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  checkmark: {
    color: colors.surface,
    fontSize: 35,
    fontWeight: '700',
  },
  eyebrow: {
    marginTop: 15,
    color: colors.primary,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
  },
  title: {
    marginTop: 4,
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 21,
    textAlign: 'center',
  },
  description: {
    maxWidth: 300,
    marginTop: 5,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
  },
  previewNotice: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 17,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f0d7a5',
    borderRadius: 14,
    backgroundColor: '#fff8e9',
  },
  noticeMark: {
    width: 23,
    height: 23,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#f8e7bf',
  },
  noticeMarkText: {
    color: '#936312',
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 13,
  },
  noticeCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  noticeTitle: {
    color: '#725016',
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 11,
    textAlign: 'right',
  },
  noticeDescription: {
    marginTop: 3,
    color: '#796a50',
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'right',
  },
  summaryCard: {
    width: '100%',
    maxWidth: 500,
    marginTop: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 19,
    backgroundColor: colors.surface,
    shadowColor: '#17352b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 14,
    textAlign: 'right',
  },
  summaryCaption: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 9,
    textAlign: 'right',
  },
  demoBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: '#fff4dc',
  },
  demoBadgeText: {
    color: '#936312',
    fontFamily: 'Cairo_700Bold',
    fontSize: 9,
  },
  routeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 16,
  },
  cityBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  metaLabel: {
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 9,
  },
  cityName: {
    marginTop: 2,
    color: colors.primaryDark,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 18,
  },
  routeMiddle: {
    width: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeRule: {
    position: 'absolute',
    right: 2,
    left: 2,
    height: 1,
    backgroundColor: '#d8e4de',
  },
  routeArrow: {
    paddingHorizontal: 7,
    color: colors.primary,
    backgroundColor: colors.surface,
    fontSize: 17,
  },
  divider: {
    height: 1,
    marginVertical: 13,
    backgroundColor: colors.line,
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  detailLabel: {
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
  },
  detailValue: {
    color: colors.ink,
    fontFamily: 'Cairo_700Bold',
    fontSize: 10,
  },
  seatSection: {
    alignItems: 'flex-end',
  },
  seatSectionTitle: {
    color: colors.ink,
    fontFamily: 'Cairo_700Bold',
    fontSize: 10,
  },
  seatList: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  seatChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
  },
  seatChipText: {
    color: colors.primaryDark,
    fontFamily: 'Cairo_700Bold',
    fontSize: 9,
  },
  totalBox: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
  totalLabel: {
    color: colors.primaryDark,
    fontFamily: 'Cairo_700Bold',
    fontSize: 10,
  },
  totalValue: {
    color: colors.primaryDark,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 15,
  },
  totalNote: {
    marginTop: 6,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 9,
    textAlign: 'right',
  },
  homeButton: {
    width: '100%',
    maxWidth: 500,
    minHeight: 48,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 16,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  homeButtonText: {
    color: colors.surface,
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
  },
  homeButtonGlyph: {
    color: colors.surface,
    fontSize: 16,
  },
  newTripButton: {
    minHeight: 39,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
    paddingHorizontal: 14,
  },
  newTripButtonText: {
    color: colors.primary,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
