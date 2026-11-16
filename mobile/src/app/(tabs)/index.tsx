import { useEffect, useState } from 'react';
import { FlatList, ImageBackground, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, GreenHeader, T } from '../../components/ui';
import { apiRequest } from '../../lib/api';
import { wasWelcomeSeen } from '../../lib/booking-draft';
import { CITY_NAMES, cityName } from '../../lib/catalog';
import { addDays, isSameDay, isoDate, longDate } from '../../lib/format';
import { loadSession } from '../../lib/session';
import type { Trip } from '../../lib/types';
import { colors, shadow } from '../../theme';

interface City {
  code: string;
  nameAr: string;
}

const DESTINATIONS = [
  { code: 'ALEPPO', image: require('../../../assets/images/aleppo.jpg') },
  { code: 'LATAKIA', image: require('../../../assets/images/latakia.jpg') },
  { code: 'DAMASCUS', image: require('../../../assets/images/damascus.jpg') },
];

const FALLBACK_CITIES: City[] = Object.entries(CITY_NAMES).map(([code, nameAr]) => ({ code, nameAr }));

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [cities, setCities] = useState<City[]>(FALLBACK_CITIES);
  const [from, setFrom] = useState('DAMASCUS');
  const [to, setTo] = useState('ALEPPO');
  const [date, setDate] = useState(() => new Date());
  const [picker, setPicker] = useState<'from' | 'to' | 'date' | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  // Guests see the welcome screen once per launch
  useEffect(() => {
    loadSession()
      .then((s) => {
        if (!s && !wasWelcomeSeen()) router.replace('/welcome');
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    apiRequest<City[]>('/cities')
      .then((list) => Array.isArray(list) && list.length && setCities(list))
      .catch(() => undefined); // the fixed list is enough to search
  }, []);

  // "N رحلات اليوم" on each destination card, from the selected departure city
  useEffect(() => {
    const today = isoDate(new Date());
    DESTINATIONS.filter((d) => d.code !== from).forEach((d) => {
      apiRequest<Trip[]>(`/trips?from=${from}&to=${d.code}&date=${today}`)
        .then((trips) => setCounts((c) => ({ ...c, [`${from}-${d.code}`]: trips.length })))
        .catch(() => undefined);
    });
  }, [from]);

  const search = (dest = to) => {
    router.push({ pathname: '/trip-results', params: { from, to: dest, date: isoDate(date) } });
  };

  const pick = (code: string) => {
    if (picker === 'from') {
      if (code === to) setTo(from);
      setFrom(code);
    } else {
      if (code === from) setFrom(to);
      setTo(code);
    }
    setPicker(null);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.canvas }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <GreenHeader height={250}>
          <View style={styles.topBar}>
            <View>
              <T size={14} color="rgba(255,255,255,0.85)">مرحباً بك</T>
              <T w="bold" size={26} color="#fff">إلى أين تريد السفر؟</T>
            </View>
            <Pressable onPress={() => router.push('/account')} style={styles.avatar} accessibilityLabel="حسابي">
              <Ionicons name="person-outline" size={22} color={colors.deep} />
            </Pressable>
          </View>
        </GreenHeader>

        <View style={[styles.searchCard, shadow]}>
          <View style={styles.box}>
            <Pressable style={styles.cityRow} onPress={() => setPicker('from')}>
              <Ionicons name="radio-button-on" size={22} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <T size={13} color={colors.muted}>من</T>
                <T w="bold" size={20}>{cityName(from)}</T>
              </View>
            </Pressable>
            <View style={styles.divider} />
            <Pressable style={styles.cityRow} onPress={() => setPicker('to')}>
              <Ionicons name="location-outline" size={22} color={colors.accent} />
              <View style={{ flex: 1 }}>
                <T size={13} color={colors.muted}>إلى</T>
                <T w="bold" size={20}>{cityName(to)}</T>
              </View>
            </Pressable>
            <Pressable
              style={styles.swap}
              onPress={() => {
                setFrom(to);
                setTo(from);
              }}
              accessibilityLabel="تبديل مدينتي الانطلاق والوصول"
            >
              <Ionicons name="swap-vertical" size={24} color="#fff" />
            </Pressable>
          </View>

          <Pressable style={[styles.box, styles.dateBox]} onPress={() => setPicker('date')}>
            <View style={styles.calendar}>
              <Ionicons name="calendar-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <T size={13} color={colors.muted}>تاريخ السفر</T>
              <T w="medium" size={17}>{longDate(date)}</T>
            </View>
            {isSameDay(date, new Date()) ? (
              <View style={styles.todayPill}>
                <T w="medium" size={13} color={colors.primary}>اليوم</T>
              </View>
            ) : null}
          </Pressable>

          <Button label="ابحث عن رحلة" icon="search" onPress={() => search()} />
        </View>

        <View style={styles.sectionHeader}>
          <T w="bold" size={20}>وجهات شائعة</T>
          <Pressable onPress={() => setPicker('to')}>
            <T w="medium" size={14} color={colors.primary}>عرض الكل</T>
          </Pressable>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel} style={{ transform: [{ scaleX: -1 }] }}>
          {DESTINATIONS.map((d) => {
            const count = counts[`${from}-${d.code}`];
            return (
              <Pressable
                key={d.code}
                onPress={() => {
                  if (d.code === from) return setPicker('from');
                  setTo(d.code);
                  search(d.code);
                }}
                style={{ transform: [{ scaleX: -1 }] }}
              >
                <ImageBackground source={d.image} style={styles.destination} imageStyle={{ borderRadius: 24 }}>
                  <LinearGradient colors={['transparent', 'rgba(0,0,0,0.65)']} style={[StyleSheet.absoluteFill, { borderRadius: 24 }]} />
                  <View style={styles.destinationText}>
                    <T w="bold" size={20} color="#fff">{cityName(d.code)}</T>
                    {d.code !== from && count !== undefined ? (
                      <T size={12.5} color="rgba(255,255,255,0.9)">{tripsToday(count)}</T>
                    ) : null}
                  </View>
                </ImageBackground>
              </Pressable>
            );
          })}
        </ScrollView>
      </ScrollView>

      <Modal visible={picker !== null} transparent animationType="slide" onRequestClose={() => setPicker(null)}>
        <Pressable style={styles.backdrop} onPress={() => setPicker(null)} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={styles.handle} />
          <T w="bold" size={18} style={{ marginBottom: 8 }}>
            {picker === 'date' ? 'تاريخ السفر' : picker === 'from' ? 'مدينة الانطلاق' : 'مدينة الوصول'}
          </T>
          {picker === 'date' ? (
            <FlatList
              data={Array.from({ length: 30 }, (_, i) => addDays(new Date(), i))}
              keyExtractor={(d) => isoDate(d)}
              renderItem={({ item }) => (
                <Option label={longDate(item)} active={isSameDay(item, date)} onPress={() => { setDate(item); setPicker(null); }} />
              )}
            />
          ) : (
            <FlatList
              data={cities}
              keyExtractor={(c) => c.code}
              renderItem={({ item }) => (
                <Option label={item.nameAr} active={item.code === (picker === 'from' ? from : to)} onPress={() => pick(item.code)} />
              )}
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

function tripsToday(n: number) {
  if (n === 0) return 'لا رحلات اليوم';
  if (n === 1) return 'رحلة واحدة اليوم';
  if (n === 2) return 'رحلتان اليوم';
  return `${n} رحلات اليوم`;
}

function Option({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.option, active && { backgroundColor: colors.primarySoft }]}>
      <T w={active ? 'bold' : 'medium'} size={16} color={active ? colors.primary : colors.ink}>{label}</T>
      {active ? <Ionicons name="checkmark" size={20} color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, marginTop: 28 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  searchCard: { marginTop: -112, marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 28, padding: 16, gap: 12 },
  box: { borderWidth: 1, borderColor: colors.line, borderRadius: 20, backgroundColor: '#F7F9F8', paddingHorizontal: 16 },
  cityRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 12, paddingLeft: 64 },
  divider: { height: 1, backgroundColor: colors.line, marginLeft: 64 },
  swap: {
    position: 'absolute',
    left: 14,
    top: '50%',
    marginTop: -21,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow,
  },
  dateBox: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 12 },
  calendar: { width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  todayPill: { height: 26, paddingHorizontal: 12, borderRadius: 13, backgroundColor: colors.primarySoft, justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 22, marginBottom: 10 },
  carousel: { paddingHorizontal: 16, gap: 12 },
  destination: { width: 150, height: 176, justifyContent: 'flex-end' },
  destinationText: { padding: 14 },
  backdrop: { flex: 1, backgroundColor: 'rgba(18,33,29,0.45)' },
  sheet: { width: '100%', maxWidth: 390, alignSelf: 'center', maxHeight: '70%', backgroundColor: colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20 },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.line, marginBottom: 12 },
  option: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 12 },
});
