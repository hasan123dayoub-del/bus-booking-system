import { useCallback, useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiRequest } from '../lib/api';
import { colors } from '../theme';

interface City {
  code: string;
  nameAr: string;
}

interface CitiesResponse {
  cities: City[];
}

type CityField = 'origin' | 'destination';

function isCitiesResponse(value: unknown): value is CitiesResponse {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('cities' in value) ||
    !Array.isArray(value.cities)
  ) {
    return false;
  }
  return value.cities.every(
    (city) =>
      typeof city === 'object' &&
      city !== null &&
      'code' in city &&
      typeof city.code === 'string' &&
      'nameAr' in city &&
      typeof city.nameAr === 'string',
  );
}

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createDateOptions() {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);
    return {
      value: localDateKey(date),
      day: new Intl.DateTimeFormat('ar-SY', { weekday: 'short' }).format(date),
      date: new Intl.DateTimeFormat('ar-SY', {
        day: 'numeric',
        month: 'short',
      }).format(date),
      isToday: index === 0,
    };
  });
}

export default function TripSearchScreen() {
  const insets = useSafeAreaInsets();
  const dates = useMemo(createDateOptions, []);
  const [cities, setCities] = useState<City[]>([]);
  const [origin, setOrigin] = useState<City | null>(null);
  const [destination, setDestination] = useState<City | null>(null);
  const [selectedDate, setSelectedDate] = useState(dates[0].value);
  const [passengers, setPassengers] = useState(1);
  const [cityField, setCityField] = useState<CityField | null>(null);
  const [loadingCities, setLoadingCities] = useState(true);
  const [citiesError, setCitiesError] = useState('');
  const [searchMessage, setSearchMessage] = useState('');

  const loadCities = useCallback(async () => {
    setLoadingCities(true);
    setCitiesError('');
    try {
      const payload = await apiRequest<unknown>('/cities');
      if (!isCitiesResponse(payload) || payload.cities.length === 0) {
        throw new Error('قائمة المدن التي أعادها الخادم غير صالحة.');
      }
      setCities(payload.cities);
      setOrigin((current) => current ?? payload.cities[0]);
      setDestination((current) => current ?? payload.cities[2] ?? payload.cities[1]);
    } catch (reason) {
      setCitiesError(
        reason instanceof Error ? reason.message : 'تعذر تحميل قائمة المدن.',
      );
    } finally {
      setLoadingCities(false);
    }
  }, []);

  useEffect(() => {
    void loadCities();
  }, [loadCities]);

  function chooseCity(city: City) {
    if (cityField === 'origin') {
      setOrigin(city);
      if (destination?.code === city.code) setDestination(null);
    } else {
      setDestination(city);
      if (origin?.code === city.code) setOrigin(null);
    }
    setCityField(null);
    setSearchMessage('');
  }

  function swapCities() {
    setOrigin(destination);
    setDestination(origin);
    setSearchMessage('');
  }

  function submitSearch() {
    setSearchMessage('');
    if (!origin || !destination) {
      setSearchMessage('اختر مدينتي الانطلاق والوصول أولاً.');
      return;
    }
    if (origin.code === destination.code) {
      setSearchMessage('يجب اختيار مدينتين مختلفتين.');
      return;
    }

    router.push({
      pathname: '/trip-results',
      params: {
        from: origin.nameAr,
        to: destination.nameAr,
        date: selectedDate,
        passengers: String(passengers),
      },
    });
  }

  const activeCity = cityField === 'origin' ? origin : destination;
  const filteredCities = cities.filter(
    (city) => city.code !== (cityField === 'origin' ? destination?.code : origin?.code),
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="العودة للرئيسية"
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backGlyph}>→</Text>
          </Pressable>
          <Text style={styles.headerEyebrow}>رحلتك القادمة</Text>
          <Text style={styles.headerTitle}>إلى أين تريد الذهاب؟</Text>
          <Text style={styles.headerDescription}>
            اختر تفاصيل رحلتك لنبحث لك عن أفضل الخيارات
          </Text>
          <View style={styles.headerDecoration} />
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>تفاصيل الرحلة</Text>
          <Text style={styles.sectionDescription}>
            حدد نقطة الانطلاق والوجهة التي تناسبك
          </Text>

          {citiesError ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{citiesError}</Text>
              <Pressable
                accessibilityRole="button"
                style={styles.retryButton}
                onPress={() => void loadCities()}
              >
                <Text style={styles.retryText}>إعادة المحاولة</Text>
              </Pressable>
            </View>
          ) : null}

          {loadingCities && cities.length === 0 ? (
            <View style={styles.loading}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>جارٍ تحميل المدن…</Text>
            </View>
          ) : (
            <>
              <Text style={styles.fieldLabel}>مسار الرحلة</Text>
              <View style={styles.routeCard}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`مدينة الانطلاق: ${origin?.nameAr ?? 'اختر مدينة'}`}
                  style={styles.cityField}
                  onPress={() => setCityField('origin')}
                >
                  <View style={styles.cityDot} />
                  <View style={styles.cityCopy}>
                    <Text style={styles.cityLabel}>من</Text>
                    <Text style={styles.cityName}>
                      {origin?.nameAr ?? 'اختر مدينة الانطلاق'}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>⌄</Text>
                </Pressable>

                <View style={styles.routeLine} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`مدينة الوصول: ${destination?.nameAr ?? 'اختر مدينة'}`}
                  style={styles.cityField}
                  onPress={() => setCityField('destination')}
                >
                  <View style={[styles.cityDot, styles.destinationDot]} />
                  <View style={styles.cityCopy}>
                    <Text style={styles.cityLabel}>إلى</Text>
                    <Text style={styles.cityName}>
                      {destination?.nameAr ?? 'اختر مدينة الوصول'}
                    </Text>
                  </View>
                  <Text style={styles.chevron}>⌄</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="تبديل مدينتي الانطلاق والوصول"
                  style={styles.swapButton}
                  onPress={swapCities}
                >
                  <Text style={styles.swapGlyph}>⇅</Text>
                </Pressable>
              </View>

              <View style={styles.sectionRow}>
                <Text style={styles.fieldLabel}>موعد الرحلة</Text>
                <Text style={styles.fieldHint}>اختر اليوم المناسب</Text>
              </View>
              <ScrollView
                horizontal
                contentContainerStyle={styles.dateList}
                showsHorizontalScrollIndicator={false}
              >
                {dates.map((date) => {
                  const selected = date.value === selectedDate;
                  return (
                    <Pressable
                      key={date.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={[
                        styles.dateCard,
                        selected && styles.selectedDateCard,
                      ]}
                      onPress={() => {
                        setSelectedDate(date.value);
                        setSearchMessage('');
                      }}
                    >
                      <Text
                        style={[
                          styles.dateDay,
                          selected && styles.selectedDateText,
                        ]}
                      >
                        {date.isToday ? 'اليوم' : date.day}
                      </Text>
                      <Text
                        style={[
                          styles.dateValue,
                          selected && styles.selectedDateText,
                        ]}
                      >
                        {date.date}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              <View style={styles.passengerCard}>
                <View style={styles.passengerCopy}>
                  <Text style={styles.passengerTitle}>عدد الركاب</Text>
                  <Text style={styles.passengerHint}>
                    الأطفال والبالغون
                  </Text>
                </View>
                <View style={styles.stepper}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="تقليل عدد الركاب"
                    accessibilityState={{ disabled: passengers <= 1 }}
                    disabled={passengers <= 1}
                    style={[
                      styles.stepperButton,
                      passengers <= 1 && styles.stepperDisabled,
                    ]}
                    onPress={() => setPassengers((count) => Math.max(1, count - 1))}
                  >
                    <Text style={styles.stepperGlyph}>−</Text>
                  </Pressable>
                  <Text style={styles.passengerCount}>
                    {passengers.toLocaleString('ar-SY')}
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="زيادة عدد الركاب"
                    accessibilityState={{ disabled: passengers >= 8 }}
                    disabled={passengers >= 8}
                    style={[
                      styles.stepperButton,
                      passengers >= 8 && styles.stepperDisabled,
                    ]}
                    onPress={() => setPassengers((count) => Math.min(8, count + 1))}
                  >
                    <Text style={styles.stepperGlyph}>+</Text>
                  </Pressable>
                </View>
              </View>

              {searchMessage ? (
                <View
                  accessibilityRole="alert"
                  style={[
                    styles.messageBanner,
                    searchMessage.startsWith('البحث') && styles.infoBanner,
                  ]}
                >
                  <Text style={styles.messageText}>{searchMessage}</Text>
                </View>
              ) : null}

              <Pressable
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.searchButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={submitSearch}
              >
                <Text style={styles.searchButtonText}>ابحث عن رحلة</Text>
                <Text style={styles.searchButtonGlyph}>⌕</Text>
              </Pressable>
              <Text style={styles.secureNote}>
                رحلتك القادمة تبدأ بخطوة بسيطة
              </Text>
            </>
          )}
        </View>
      </ScrollView>

      <Modal
        animationType="slide"
        transparent
        visible={cityField !== null}
        onRequestClose={() => setCityField(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="إغلاق اختيار المدينة"
            style={StyleSheet.absoluteFill}
            onPress={() => setCityField(null)}
          />
          <View style={[styles.citySheet, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeading}>
              <View>
                <Text style={styles.sheetTitle}>
                  {cityField === 'origin' ? 'مدينة الانطلاق' : 'مدينة الوصول'}
                </Text>
                <Text style={styles.sheetDescription}>اختر من المدن المتاحة</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="إغلاق"
                style={styles.closeButton}
                onPress={() => setCityField(null)}
              >
                <Text style={styles.closeGlyph}>×</Text>
              </Pressable>
            </View>
            <ScrollView style={styles.cityList} showsVerticalScrollIndicator={false}>
              {filteredCities.map((city) => {
                const selected = activeCity?.code === city.code;
                return (
                  <Pressable
                    key={city.code}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.cityOption,
                      selected && styles.selectedCityOption,
                    ]}
                    onPress={() => chooseCity(city)}
                  >
                    <Text
                      style={[
                        styles.cityOptionName,
                        selected && styles.selectedCityName,
                      ]}
                    >
                      {city.nameAr}
                    </Text>
                    <Text
                      style={[
                        styles.cityOptionCode,
                        selected && styles.selectedCityName,
                      ]}
                    >
                      {selected ? '✓' : '←'}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    minHeight: 208,
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingBottom: 46,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    fontSize: 11,
    textAlign: 'right',
  },
  headerTitle: {
    marginTop: 2,
    color: colors.surface,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 24,
    textAlign: 'right',
  },
  headerDescription: {
    marginTop: 3,
    color: '#d9eae4',
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    textAlign: 'right',
  },
  headerDecoration: {
    position: 'absolute',
    right: -37,
    bottom: -96,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  formCard: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    marginTop: -28,
    paddingHorizontal: 18,
    paddingTop: 21,
    paddingBottom: 20,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 22,
    backgroundColor: colors.surface,
    shadowColor: '#17352b',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 18,
    textAlign: 'right',
  },
  sectionDescription: {
    marginTop: 3,
    marginBottom: 20,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 11,
    textAlign: 'right',
  },
  errorBanner: {
    marginBottom: 15,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f1d0cc',
    borderRadius: 12,
    backgroundColor: '#fff0ef',
  },
  errorText: {
    color: '#a43e3e',
    fontFamily: 'Cairo_500Medium',
    fontSize: 11,
    textAlign: 'right',
  },
  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 7,
  },
  retryText: {
    color: colors.primary,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
  },
  loading: {
    minHeight: 185,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
  },
  fieldLabel: {
    color: '#52625b',
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
    textAlign: 'right',
  },
  routeCard: {
    position: 'relative',
    marginTop: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 15,
    backgroundColor: '#fbfdfc',
  },
  cityField: {
    minHeight: 66,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  cityDot: {
    width: 11,
    height: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 6,
  },
  destinationDot: {
    borderColor: colors.accent,
  },
  cityCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cityLabel: {
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    textAlign: 'right',
  },
  cityName: {
    marginTop: 1,
    color: colors.ink,
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
    textAlign: 'right',
  },
  chevron: {
    color: colors.muted,
    fontSize: 18,
  },
  routeLine: {
    position: 'absolute',
    top: 53,
    right: 17,
    zIndex: 1,
    height: 26,
    borderRightWidth: 1,
    borderColor: '#b9c9c1',
    borderStyle: 'dashed',
  },
  swapButton: {
    position: 'absolute',
    top: 51,
    left: 12,
    zIndex: 2,
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  swapGlyph: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  fieldHint: {
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
  },
  dateList: {
    flexDirection: 'row-reverse',
    gap: 8,
    paddingVertical: 9,
  },
  dateCard: {
    minWidth: 65,
    minHeight: 64,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    backgroundColor: colors.surface,
  },
  selectedDateCard: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  dateDay: {
    color: colors.muted,
    fontFamily: 'Cairo_500Medium',
    fontSize: 10,
  },
  dateValue: {
    marginTop: 3,
    color: colors.ink,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
  },
  selectedDateText: {
    color: colors.surface,
  },
  passengerCard: {
    minHeight: 72,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 13,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    backgroundColor: '#fbfdfc',
  },
  passengerCopy: {
    alignItems: 'flex-end',
  },
  passengerTitle: {
    color: colors.ink,
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
  },
  passengerHint: {
    marginTop: 3,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  stepperButton: {
    width: 31,
    height: 31,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cde4da',
    borderRadius: 10,
    backgroundColor: colors.primarySoft,
  },
  stepperDisabled: {
    opacity: 0.45,
  },
  stepperGlyph: {
    color: colors.primaryDark,
    fontSize: 18,
    fontWeight: '700',
  },
  passengerCount: {
    minWidth: 16,
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 15,
    textAlign: 'center',
  },
  messageBanner: {
    marginTop: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#f1d0cc',
    borderRadius: 12,
    backgroundColor: '#fff0ef',
  },
  infoBanner: {
    borderColor: '#d7e9e1',
    backgroundColor: colors.primarySoft,
  },
  messageText: {
    color: colors.primaryDark,
    fontFamily: 'Cairo_500Medium',
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'right',
  },
  searchButton: {
    minHeight: 50,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
    borderRadius: 14,
    backgroundColor: colors.primary,
  },
  searchButtonText: {
    color: colors.surface,
    fontFamily: 'Cairo_700Bold',
    fontSize: 14,
  },
  searchButtonGlyph: {
    color: colors.surface,
    fontSize: 20,
  },
  secureNote: {
    marginTop: 12,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.78,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(10,25,19,0.45)',
  },
  citySheet: {
    maxHeight: '78%',
    paddingTop: 11,
    paddingHorizontal: 20,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    backgroundColor: colors.surface,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    alignSelf: 'center',
    marginBottom: 17,
    borderRadius: 2,
    backgroundColor: '#d6dfda',
  },
  sheetHeading: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 17,
    textAlign: 'right',
  },
  sheetDescription: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    textAlign: 'right',
  },
  closeButton: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
    backgroundColor: colors.canvas,
  },
  closeGlyph: {
    color: colors.muted,
    fontSize: 23,
    lineHeight: 25,
  },
  cityList: {
    flexGrow: 0,
  },
  cityOption: {
    minHeight: 50,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  selectedCityOption: {
    borderRadius: 11,
    borderBottomColor: 'transparent',
    backgroundColor: colors.primarySoft,
  },
  cityOptionName: {
    color: colors.ink,
    fontFamily: 'Cairo_500Medium',
    fontSize: 13,
  },
  cityOptionCode: {
    color: colors.muted,
    fontFamily: 'Cairo_700Bold',
    fontSize: 13,
  },
  selectedCityName: {
    color: colors.primaryDark,
  },
});
