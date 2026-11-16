import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

type PaymentMethod = 'CASH' | 'SHAM_CASH';

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

export default function BookingDetailsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    from?: string;
    to?: string;
    date?: string;
    passengers?: string;
    price?: string;
    className?: string;
    tripTime?: string;
    seats?: string;
  }>();
  const from = firstParam(params.from) || 'دمشق';
  const to = firstParam(params.to) || 'حلب';
  const date = firstParam(params.date);
  const tripTime = firstParam(params.tripTime) || '06:00 ص';
  const className = firstParam(params.className) || 'اقتصادي';
  const seatPriceValue = Number(firstParam(params.price));
  const seatPrice =
    Number.isFinite(seatPriceValue) && seatPriceValue > 0
      ? seatPriceValue
      : 0;
  const seats = useMemo(() => parseSeats(firstParam(params.seats)), [params.seats]);
  const total = seats.length * seatPrice;

  const [passengerNames, setPassengerNames] = useState<Record<number, string>>({});
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentRef, setPaymentRef] = useState('');
  const [error, setError] = useState('');

  function continuePreview() {
    setError('');
    if (!customerName.trim()) {
      setError('أدخل اسم صاحب الحجز.');
      return;
    }
    if (!phone.trim()) {
      setError('أدخل رقم الهاتف للتواصل.');
      return;
    }
    if (!seats.length) {
      setError('لم يتم اختيار مقاعد للمعاينة.');
      return;
    }
    if (seats.some((seat) => !passengerNames[seat]?.trim())) {
      setError('أدخل اسم كل راكب قبل المتابعة.');
      return;
    }
    if (paymentMethod === 'SHAM_CASH' && !paymentRef.trim()) {
      setError('أدخل رقم عملية شام كاش للمتابعة.');
      return;
    }
    router.push({
      pathname: '/booking-confirmation',
      params: {
        from,
        to,
        date: date ?? '',
        price: String(seatPrice),
        className,
        tripTime,
        seats: seats.join(','),
        paymentMethod,
      },
    });
  }

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.content,
            { paddingBottom: 30 + insets.bottom },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="العودة لاختيار المقاعد"
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backGlyph}>→</Text>
            </Pressable>
            <Text style={styles.headerEyebrow}>الخطوة الأخيرة</Text>
            <Text style={styles.headerTitle}>تأكيد بيانات الحجز</Text>
            <Text style={styles.headerDescription}>
              راجع الرحلة وأدخل بيانات الركاب وطريقة الدفع
            </Text>
            <View style={styles.headerDecoration} />
          </View>

          <View style={styles.body}>
            <View style={styles.previewNotice}>
              <View style={styles.noticeMark}>
                <Text style={styles.noticeMarkText}>i</Text>
              </View>
              <Text style={styles.noticeText}>
                هذه معاينة للنموذج فقط. لن يتم إنشاء حجز أو تحصيل أي مبلغ.
              </Text>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.routeIcon}>
                  <Text style={styles.routeIconText}>⌁</Text>
                </View>
                <View style={styles.cardHeadingCopy}>
                  <Text style={styles.cardTitle}>ملخص الرحلة</Text>
                  <Text style={styles.cardSubtitle}>{className}</Text>
                </View>
              </View>

              <View style={styles.routeRow}>
                <View style={styles.cityBlock}>
                  <Text style={styles.metaLabel}>من</Text>
                  <Text style={styles.cityName}>{from}</Text>
                </View>
                <Text style={styles.routeArrow}>←</Text>
                <View style={styles.cityBlock}>
                  <Text style={styles.metaLabel}>إلى</Text>
                  <Text style={styles.cityName}>{to}</Text>
                </View>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.metaRow}>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>موعد الرحلة</Text>
                  <Text style={styles.metaValue}>{formatDate(date)}</Text>
                </View>
                <View style={styles.metaBlock}>
                  <Text style={styles.metaLabel}>وقت الانطلاق</Text>
                  <Text style={styles.metaValue}>{tripTime}</Text>
                </View>
              </View>
              <View style={styles.seatChips}>
                {seats.map((seat) => (
                  <View key={seat} style={styles.seatChip}>
                    <Text style={styles.seatChipText}>
                      مقعد {seat.toLocaleString('ar-SY')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>بيانات صاحب الحجز</Text>
              <Text style={styles.cardSubtitle}>
                سنستخدمها للتواصل بشأن تفاصيل الرحلة
              </Text>
              <View style={styles.field}>
                <Text style={styles.label}>الاسم الكامل</Text>
                <TextInput
                  accessibilityLabel="اسم صاحب الحجز"
                  autoComplete="name"
                  placeholder="أدخل الاسم الكامل"
                  placeholderTextColor="#9aa8a2"
                  returnKeyType="next"
                  style={styles.input}
                  textAlign="right"
                  value={customerName}
                  onChangeText={(value) => {
                    setCustomerName(value);
                    setError('');
                  }}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>رقم الهاتف</Text>
                <TextInput
                  accessibilityLabel="رقم هاتف صاحب الحجز"
                  autoComplete="tel"
                  keyboardType="phone-pad"
                  placeholder="09xxxxxxxx"
                  placeholderTextColor="#9aa8a2"
                  returnKeyType="done"
                  style={styles.input}
                  textAlign="right"
                  value={phone}
                  onChangeText={(value) => {
                    setPhone(value);
                    setError('');
                  }}
                />
              </View>
            </View>

            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View>
                  <Text style={styles.cardTitle}>بيانات الركاب</Text>
                  <Text style={styles.cardSubtitle}>
                    أدخل اسم الراكب لكل مقعد
                  </Text>
                </View>
                <Text style={styles.passengerCount}>
                  {seats.length.toLocaleString('ar-SY')} ركاب
                </Text>
              </View>
              <View style={styles.passengerList}>
                {seats.map((seat, index) => (
                  <View key={seat} style={styles.passengerField}>
                    <View style={styles.passengerLabel}>
                      <Text style={styles.passengerNumber}>
                        الراكب { (index + 1).toLocaleString('ar-SY')}
                      </Text>
                      <Text style={styles.passengerSeat}>
                        مقعد {seat.toLocaleString('ar-SY')}
                      </Text>
                    </View>
                    <TextInput
                      accessibilityLabel={`اسم الراكب للمقعد ${seat}`}
                      autoComplete="name"
                      placeholder="اسم الراكب"
                      placeholderTextColor="#9aa8a2"
                      style={styles.input}
                      textAlign="right"
                      value={passengerNames[seat] ?? ''}
                      onChangeText={(value) => {
                        setPassengerNames((current) => ({
                          ...current,
                          [seat]: value,
                        }));
                        setError('');
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>طريقة الدفع</Text>
              <Text style={styles.cardSubtitle}>
                اختر الطريقة التي تناسبك
              </Text>
              <View style={styles.paymentOptions}>
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: paymentMethod === 'CASH' }}
                  style={[
                    styles.paymentOption,
                    paymentMethod === 'CASH' && styles.selectedPaymentOption,
                  ]}
                  onPress={() => {
                    setPaymentMethod('CASH');
                    setError('');
                  }}
                >
                  <View
                    style={[
                      styles.radio,
                      paymentMethod === 'CASH' && styles.radioSelected,
                    ]}
                  >
                    {paymentMethod === 'CASH' && <View style={styles.radioDot} />}
                  </View>
                  <View style={styles.paymentCopy}>
                    <Text style={styles.paymentTitle}>الدفع نقداً</Text>
                    <Text style={styles.paymentDescription}>
                      عند مكتب الشركة
                    </Text>
                  </View>
                  <Text style={styles.paymentGlyph}>▣</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{
                    checked: paymentMethod === 'SHAM_CASH',
                  }}
                  style={[
                    styles.paymentOption,
                    paymentMethod === 'SHAM_CASH' && styles.selectedPaymentOption,
                  ]}
                  onPress={() => {
                    setPaymentMethod('SHAM_CASH');
                    setError('');
                  }}
                >
                  <View
                    style={[
                      styles.radio,
                      paymentMethod === 'SHAM_CASH' && styles.radioSelected,
                    ]}
                  >
                    {paymentMethod === 'SHAM_CASH' && (
                      <View style={styles.radioDot} />
                    )}
                  </View>
                  <View style={styles.paymentCopy}>
                    <Text style={styles.paymentTitle}>شام كاش</Text>
                    <Text style={styles.paymentDescription}>
                      تحويل إلكتروني
                    </Text>
                  </View>
                  <Text style={styles.paymentGlyph}>▤</Text>
                </Pressable>
              </View>

              {paymentMethod === 'SHAM_CASH' && (
                <View style={styles.field}>
                  <Text style={styles.label}>رقم عملية التحويل</Text>
                  <TextInput
                    accessibilityLabel="رقم عملية شام كاش"
                    placeholder="أدخل رقم العملية"
                    placeholderTextColor="#9aa8a2"
                    style={styles.input}
                    textAlign="right"
                    value={paymentRef}
                    onChangeText={(value) => {
                      setPaymentRef(value);
                      setError('');
                    }}
                  />
                </View>
              )}
            </View>

            <View style={styles.totalCard}>
              <View style={styles.totalRow}>
                <Text style={styles.totalValue}>{formatPrice(total)}</Text>
                <Text style={styles.totalLabel}>سعر المقاعد</Text>
              </View>
              <View style={styles.totalDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalStrong}>{formatPrice(total)}</Text>
                <Text style={styles.totalStrongLabel}>الإجمالي التقديري</Text>
              </View>
              <Text style={styles.totalNote}>
                الإجمالي للمعاينة فقط وغير قابل للدفع
              </Text>
            </View>

            {error ? (
              <View accessibilityRole="alert" style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.submitButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={continuePreview}
            >
              <Text style={styles.submitButtonText}>متابعة المعاينة</Text>
              <Text style={styles.submitGlyph}>←</Text>
            </Pressable>
            <Text style={styles.footerNote}>
              لن يتم إنشاء حجز أو تنفيذ دفع في هذه المعاينة
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
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
    paddingBottom: 48,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: colors.primaryDark,
  },
  backButton: {
    width: 39,
    height: 39,
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
    fontSize: 22,
    textAlign: 'right',
  },
  headerDescription: {
    marginTop: 3,
    color: '#d9eae4',
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    textAlign: 'right',
  },
  headerDecoration: {
    position: 'absolute',
    right: -40,
    bottom: -96,
    width: 176,
    height: 176,
    borderRadius: 88,
    backgroundColor: 'rgba(255,255,255,0.045)',
  },
  body: {
    paddingHorizontal: 16,
  },
  previewNotice: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 9,
    marginTop: -27,
    marginBottom: 13,
    padding: 11,
    borderWidth: 1,
    borderColor: '#f0d7a5',
    borderRadius: 13,
    backgroundColor: '#fff8e9',
  },
  noticeMark: {
    width: 22,
    height: 22,
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
  noticeText: {
    flex: 1,
    color: '#725016',
    fontFamily: 'Cairo_500Medium',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'right',
  },
  card: {
    marginBottom: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 17,
    backgroundColor: colors.surface,
  },
  cardHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  routeIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colors.primarySoft,
  },
  routeIconText: {
    color: colors.primary,
    fontSize: 22,
  },
  cardHeadingCopy: {
    alignItems: 'flex-end',
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 14,
    textAlign: 'right',
  },
  cardSubtitle: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    textAlign: 'right',
  },
  routeRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
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
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 16,
  },
  routeArrow: {
    paddingHorizontal: 10,
    color: colors.primary,
    fontSize: 19,
  },
  summaryDivider: {
    height: 1,
    marginVertical: 10,
    backgroundColor: colors.line,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  metaBlock: {
    flex: 1,
    alignItems: 'flex-end',
  },
  metaValue: {
    marginTop: 3,
    color: colors.ink,
    fontFamily: 'Cairo_700Bold',
    fontSize: 10,
    textAlign: 'right',
  },
  seatChips: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
  },
  seatChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primarySoft,
  },
  seatChipText: {
    color: colors.primaryDark,
    fontFamily: 'Cairo_700Bold',
    fontSize: 9,
  },
  field: {
    marginTop: 15,
  },
  label: {
    marginBottom: 6,
    color: '#52625b',
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    textAlign: 'right',
  },
  input: {
    minHeight: 46,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    backgroundColor: '#fbfdfc',
    color: colors.ink,
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
  },
  passengerCount: {
    color: colors.primary,
    fontFamily: 'Cairo_700Bold',
    fontSize: 10,
  },
  passengerList: {
    gap: 13,
    marginTop: 5,
  },
  passengerField: {
    gap: 6,
  },
  passengerLabel: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
  },
  passengerNumber: {
    color: '#52625b',
    fontFamily: 'Cairo_700Bold',
    fontSize: 10,
  },
  passengerSeat: {
    color: colors.primary,
    fontFamily: 'Cairo_500Medium',
    fontSize: 10,
  },
  paymentOptions: {
    gap: 9,
    marginTop: 14,
  },
  paymentOption: {
    minHeight: 62,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    backgroundColor: '#fbfdfc',
  },
  selectedPaymentOption: {
    borderColor: '#8bbda9',
    backgroundColor: '#f4faf7',
  },
  radio: {
    width: 17,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#b8c5bf',
    borderRadius: 9,
  },
  radioSelected: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  paymentCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  paymentTitle: {
    color: colors.ink,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
    textAlign: 'right',
  },
  paymentDescription: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 9,
    textAlign: 'right',
  },
  paymentGlyph: {
    color: colors.primary,
    fontSize: 17,
  },
  totalCard: {
    marginTop: 1,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cde4da',
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
  },
  totalRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: colors.muted,
    fontFamily: 'Cairo_500Medium',
    fontSize: 10,
  },
  totalValue: {
    color: colors.ink,
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
  },
  totalDivider: {
    height: 1,
    marginVertical: 9,
    backgroundColor: '#cde4da',
  },
  totalStrongLabel: {
    color: colors.primaryDark,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 11,
  },
  totalStrong: {
    color: colors.primaryDark,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 16,
  },
  totalNote: {
    marginTop: 7,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 9,
    textAlign: 'right',
  },
  errorBanner: {
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#f1d0cc',
    borderRadius: 12,
    backgroundColor: '#fff0ef',
  },
  errorText: {
    color: '#a43e3e',
    fontFamily: 'Cairo_500Medium',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'right',
  },
  submitButton: {
    minHeight: 49,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 15,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  submitButtonText: {
    color: colors.surface,
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
  },
  submitGlyph: {
    color: colors.surface,
    fontSize: 16,
  },
  footerNote: {
    marginTop: 8,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 9,
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
