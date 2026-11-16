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

const previewTrips = [
  {
    id: 'preview-1',
    departure: '06:00 ص',
    arrival: '10:30 ص',
    duration: '٤ س ٣٠ د',
    price: 85000,
    seats: 12,
    className: 'اقتصادي',
    accent: colors.primary,
  },
  {
    id: 'preview-2',
    departure: '08:30 ص',
    arrival: '01:00 م',
    duration: '٤ س ٣٠ د',
    price: 120000,
    seats: 8,
    className: 'مميز',
    accent: '#d4931b',
  },
  {
    id: 'preview-3',
    departure: '11:00 ص',
    arrival: '03:30 م',
    duration: '٤ س ٣٠ د',
    price: 180000,
    seats: 5,
    className: 'رجال أعمال',
    accent: '#5370a7',
  },
];

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatSelectedDate(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'موعد الرحلة';
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('ar-SY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(year, month - 1, day, 12));
}

export default function TripResultsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    from?: string;
    to?: string;
    date?: string;
    passengers?: string;
  }>();
  const from = firstParam(params.from) || 'دمشق';
  const to = firstParam(params.to) || 'حلب';
  const date = firstParam(params.date);
  const passengers = firstParam(params.passengers) || '1';
  const formattedDate = useMemo(() => formatSelectedDate(date), [date]);

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <View style={styles.headerTop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="العودة للبحث"
              style={styles.iconButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backGlyph}>→</Text>
            </Pressable>
            <View style={styles.headerBrand}>
              <Text style={styles.brandName}>رحلتي</Text>
              <Text style={styles.brandCaption}>رحلاتك بكل سهولة</Text>
            </View>
          </View>

          <Text style={styles.headerEyebrow}>نتائج البحث</Text>
          <View style={styles.routeSummary}>
            <View style={styles.routeCity}>
              <Text style={styles.cityLabel}>من</Text>
              <Text style={styles.cityName}>{from}</Text>
            </View>
            <View style={styles.routeArrow}>
              <View style={styles.routeLine} />
              <Text style={styles.routeArrowGlyph}>←</Text>
            </View>
            <View style={styles.routeCity}>
              <Text style={styles.cityLabel}>إلى</Text>
              <Text style={styles.cityName}>{to}</Text>
            </View>
          </View>

          <View style={styles.summaryFooter}>
            <Text style={styles.summaryMeta}>{formattedDate}</Text>
            <Text style={styles.summaryMeta}>
              {Number(passengers).toLocaleString('ar-SY')} ركاب
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.previewNotice}>
            <View style={styles.noticeMark}>
              <Text style={styles.noticeMarkText}>i</Text>
            </View>
            <View style={styles.noticeCopy}>
              <Text style={styles.noticeTitle}>معاينة تصميمية</Text>
              <Text style={styles.noticeDescription}>
                هذه أمثلة توضيحية فقط وليست رحلات فعلية. ستظهر المواعيد والأسعار
                الحقيقية بعد ربط خدمة الرحلات.
              </Text>
            </View>
          </View>

          <View style={styles.listHeading}>
            <View>
              <Text style={styles.listTitle}>الرحلات المتاحة</Text>
              <Text style={styles.listSubtitle}>
                خيارات تناسب موعدك وميزانيتك
              </Text>
            </View>
            <View style={styles.countPill}>
              <Text style={styles.countText}>٣ أمثلة</Text>
            </View>
          </View>

          <View style={styles.tripList}>
            {previewTrips.map((trip) => (
              <View key={trip.id} style={styles.tripCard}>
                <View
                  style={[styles.tripAccent, { backgroundColor: trip.accent }]}
                />
                <View style={styles.tripCardBody}>
                  <View style={styles.tripTop}>
                    <View style={styles.classPill}>
                      <Text style={[styles.classText, { color: trip.accent }]}>
                        {trip.className}
                      </Text>
                    </View>
                    <Text style={styles.previewLabel}>مثال توضيحي</Text>
                  </View>

                  <View style={styles.timeRow}>
                    <View style={styles.timeBlock}>
                      <Text style={styles.time}>{trip.departure}</Text>
                      <Text style={styles.timePlace}>{from}</Text>
                    </View>
                    <View style={styles.durationBlock}>
                      <Text style={styles.duration}>{trip.duration}</Text>
                      <View style={styles.durationLine}>
                        <View style={styles.durationDot} />
                        <View style={styles.durationRule} />
                        <View
                          style={[
                            styles.durationDot,
                            { backgroundColor: trip.accent },
                          ]}
                        />
                      </View>
                      <Text style={styles.durationCaption}>مباشرة</Text>
                    </View>
                    <View style={styles.timeBlock}>
                      <Text style={styles.time}>{trip.arrival}</Text>
                      <Text style={styles.timePlace}>{to}</Text>
                    </View>
                  </View>

                  <View style={styles.tripDivider} />
                  <View style={styles.tripBottom}>
                    <View style={styles.priceBlock}>
                      <Text style={styles.priceLabel}>سعر المقعد</Text>
                      <Text style={styles.price}>
                        {trip.price.toLocaleString('ar-SY')}
                        <Text style={styles.currency}> ل.س</Text>
                      </Text>
                    </View>
                    <Text style={styles.seats}>
                      {trip.seats.toLocaleString('ar-SY')} مقاعد متاحة
                    </Text>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    style={styles.selectSeatsButton}
                    onPress={() =>
                      router.push({
                        pathname: '/seat-selection',
                        params: {
                          from,
                          to,
                          date: date ?? '',
                          passengers,
                          price: String(trip.price),
                          className: trip.className,
                          available: String(trip.seats),
                          busClass:
                            trip.id === 'preview-1'
                              ? 'REGULAR'
                              : trip.id === 'preview-2'
                                ? 'FIRST_CLASS'
                                : 'BUSINESS',
                          tripTime: trip.departure,
                        },
                      })
                    }
                  >
                    <Text style={styles.disabledButtonText}>
                      معاينة المقاعد
                    </Text>
                    <Text style={styles.disabledButtonGlyph}>←</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <Pressable
            accessibilityRole="button"
            style={styles.editSearch}
            onPress={() => router.back()}
          >
            <Text style={styles.editSearchText}>تعديل تفاصيل البحث</Text>
          </Pressable>
        </View>
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
    paddingBottom: 28,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: colors.primaryDark,
  },
  headerTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
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
  headerBrand: {
    alignItems: 'flex-end',
  },
  brandName: {
    color: colors.surface,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 17,
  },
  brandCaption: {
    color: '#b5d3c9',
    fontFamily: 'Cairo_400Regular',
    fontSize: 9,
  },
  headerEyebrow: {
    marginTop: 21,
    color: '#b5d3c9',
    fontFamily: 'Cairo_500Medium',
    fontSize: 11,
    textAlign: 'right',
  },
  routeSummary: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 7,
  },
  routeCity: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cityLabel: {
    color: '#b5d3c9',
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
  },
  cityName: {
    marginTop: 1,
    color: colors.surface,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 21,
  },
  routeArrow: {
    width: 66,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeLine: {
    position: 'absolute',
    right: 3,
    left: 3,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.32)',
  },
  routeArrowGlyph: {
    paddingHorizontal: 8,
    color: '#cde4da',
    backgroundColor: colors.primaryDark,
    fontSize: 17,
  },
  summaryFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 13,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.14)',
  },
  summaryMeta: {
    color: '#e1eee9',
    fontFamily: 'Cairo_500Medium',
    fontSize: 10,
  },
  body: {
    paddingHorizontal: 17,
  },
  previewNotice: {
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
    fontSize: 14,
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
  listHeading: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 23,
    marginBottom: 11,
  },
  listTitle: {
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 16,
    textAlign: 'right',
  },
  listSubtitle: {
    marginTop: 1,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    textAlign: 'right',
  },
  countPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
  },
  countText: {
    color: colors.primaryDark,
    fontFamily: 'Cairo_700Bold',
    fontSize: 10,
  },
  tripList: {
    gap: 11,
  },
  tripCard: {
    flexDirection: 'row-reverse',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.surface,
    shadowColor: '#17352b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.045,
    shadowRadius: 8,
    elevation: 2,
  },
  tripAccent: {
    width: 4,
  },
  tripCardBody: {
    flex: 1,
    padding: 13,
  },
  tripTop: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  classPill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 9,
    backgroundColor: '#f4f7f5',
  },
  classText: {
    fontFamily: 'Cairo_700Bold',
    fontSize: 9,
  },
  previewLabel: {
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 9,
  },
  timeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginTop: 14,
  },
  timeBlock: {
    width: 79,
    alignItems: 'flex-end',
  },
  time: {
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 17,
  },
  timePlace: {
    marginTop: 1,
    color: colors.muted,
    fontFamily: 'Cairo_500Medium',
    fontSize: 10,
  },
  durationBlock: {
    flex: 1,
    alignItems: 'center',
  },
  duration: {
    color: colors.muted,
    fontFamily: 'Cairo_500Medium',
    fontSize: 9,
  },
  durationLine: {
    width: '78%',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  durationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  durationRule: {
    flex: 1,
    height: 1,
    marginHorizontal: 4,
    backgroundColor: '#cfdad4',
  },
  durationCaption: {
    marginTop: 4,
    color: colors.primary,
    fontFamily: 'Cairo_500Medium',
    fontSize: 9,
  },
  tripDivider: {
    height: 1,
    marginTop: 12,
    backgroundColor: colors.line,
  },
  tripBottom: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  priceBlock: {
    alignItems: 'flex-end',
  },
  priceLabel: {
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 9,
  },
  price: {
    marginTop: 1,
    color: colors.primaryDark,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 15,
  },
  currency: {
    color: colors.primary,
    fontFamily: 'Cairo_500Medium',
    fontSize: 10,
  },
  seats: {
    color: colors.muted,
    fontFamily: 'Cairo_500Medium',
    fontSize: 9,
  },
  selectSeatsButton: {
    minHeight: 39,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 11,
    borderRadius: 11,
    backgroundColor: colors.primary,
  },
  disabledButtonText: {
    color: colors.surface,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
  },
  disabledButtonGlyph: {
    color: colors.surface,
    fontSize: 14,
  },
  editSearch: {
    minHeight: 43,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#cde4da',
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  editSearchText: {
    color: colors.primary,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
  },
});
