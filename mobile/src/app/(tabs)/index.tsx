import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';

const destinations = [
  { city: 'اللاذقية', detail: 'رحلات إلى الساحل', symbol: '🌊', tone: '#dcefe9' },
  { city: 'حلب', detail: 'اكتشف المدينة', symbol: '🏛️', tone: '#f3e7d4' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [origin, setOrigin] = useState('دمشق');
  const [destination, setDestination] = useState('حلب');

  function swapCities() {
    setOrigin(destination);
    setDestination(origin);
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.hero, { paddingTop: insets.top + 12 }]}>
        <View style={styles.brandRow}>
          <View style={styles.brandLockup}>
            <View style={styles.brandMark}>
              <Text style={styles.brandGlyph}>ر</Text>
            </View>
            <View>
              <Text style={styles.brandName}>رحلتي</Text>
              <Text style={styles.brandCaption}>رحلاتك بكل سهولة</Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="تسجيل الدخول"
            style={styles.notificationButton}
            onPress={() => router.push('/sign-in')}
          >
            <Text style={styles.notificationGlyph}>◉</Text>
          </Pressable>
        </View>

        <Text style={styles.welcome}>أهلاً بك في رحلتي</Text>
        <Text style={styles.heroTitle}>رحلتك تبدأ من هنا</Text>
        <Text style={styles.heroDescription}>
          اختر وجهتك ودعنا نهتم بباقي تفاصيل الرحلة
        </Text>

        <View accessibilityLabel="مشهد طريق وحافلة" style={styles.scenery}>
          <View style={styles.sun} />
          <View style={styles.farHill} />
          <View style={styles.nearHill} />
          <View style={styles.road} />
          <View style={styles.roadMark} />
          <Text style={styles.bus}>🚌</Text>
          <View style={styles.sceneryCaption}>
            <Text style={styles.sceneryCaptionText}>اكتشف سوريا.. رحلة أجمل</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.searchCard}>
          <View style={styles.cardHeading}>
            <View>
              <Text style={styles.eyebrow}>خطوتك الأولى</Text>
              <Text style={styles.cardTitle}>إلى أين تريد الذهاب؟</Text>
            </View>
            <View style={styles.routeIcon}>
              <Text style={styles.routeIconText}>⌁</Text>
            </View>
          </View>

          <View style={styles.routeFields}>
            <View style={styles.routeField}>
              <View style={styles.cityDot} />
              <View style={styles.routeCopy}>
                <Text style={styles.fieldLabel}>من</Text>
                <Text style={styles.cityName}>{origin}</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="تبديل مدينتي الانطلاق والوصول"
              style={styles.swapButton}
              onPress={swapCities}
            >
              <Text style={styles.swapGlyph}>⇅</Text>
            </Pressable>
            <View style={styles.routeField}>
              <View style={[styles.cityDot, styles.destinationDot]} />
              <View style={styles.routeCopy}>
                <Text style={styles.fieldLabel}>إلى</Text>
                <Text style={styles.cityName}>{destination}</Text>
              </View>
            </View>
          </View>

          <View style={styles.searchMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaGlyph}>▦</Text>
              <View>
                <Text style={styles.fieldLabel}>موعد الرحلة</Text>
                <Text style={styles.metaValue}>اختر التاريخ</Text>
              </View>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaGlyph}>♙</Text>
              <View>
                <Text style={styles.fieldLabel}>عدد الركاب</Text>
                <Text style={styles.metaValue}>راكب واحد</Text>
              </View>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.searchButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/trip-search')}
          >
            <Text style={styles.searchButtonText}>ابحث عن رحلة</Text>
            <Text style={styles.searchButtonGlyph}>⌕</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeading}>
          <View>
            <Text style={styles.eyebrow}>وجهات مميزة</Text>
            <Text style={styles.sectionTitle}>اكتشف وجهاتنا</Text>
          </View>
          <Text style={styles.sectionHint}>رحلتك القادمة بانتظارك</Text>
        </View>

        <View style={styles.destinationList}>
          {destinations.map((item) => (
            <Pressable
              key={item.city}
              accessibilityRole="button"
              accessibilityLabel={`استكشف ${item.city}`}
              style={({ pressed }) => [
                styles.destinationCard,
                { backgroundColor: item.tone },
                pressed && styles.buttonPressed,
              ]}
              onPress={() => {
                setDestination(item.city);
              }}
            >
              <View style={styles.destinationArtwork}>
                <Text style={styles.destinationSymbol}>{item.symbol}</Text>
                <View style={styles.destinationSun} />
                <View style={styles.destinationHorizon} />
              </View>
              <View style={styles.destinationCopy}>
                <Text style={styles.destinationName}>{item.city}</Text>
                <Text style={styles.destinationDetail}>{item.detail}</Text>
              </View>
              <Text style={styles.destinationArrow}>←</Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  content: {
    paddingBottom: 24,
  },
  hero: {
    overflow: 'hidden',
    paddingHorizontal: 22,
    paddingBottom: 38,
    backgroundColor: colors.primaryDark,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  brandRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandLockup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  brandMark: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderBottomLeftRadius: 5,
    backgroundColor: colors.surface,
  },
  brandGlyph: {
    color: colors.primaryDark,
    fontSize: 22,
    fontWeight: '800',
  },
  brandName: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  brandCaption: {
    marginTop: 2,
    color: '#b5d3c9',
    fontSize: 10,
    textAlign: 'right',
  },
  notificationButton: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  notificationGlyph: {
    color: colors.surface,
    fontSize: 22,
  },
  welcome: {
    marginTop: 23,
    color: '#b5d3c9',
    fontSize: 12,
    textAlign: 'right',
  },
  heroTitle: {
    marginTop: 5,
    color: colors.surface,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'right',
  },
  heroDescription: {
    marginTop: 5,
    color: '#d9eae4',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'right',
  },
  scenery: {
    height: 150,
    marginTop: 18,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderRadius: 20,
    backgroundColor: '#9abfae',
  },
  sun: {
    position: 'absolute',
    top: 19,
    right: 33,
    width: 33,
    height: 33,
    borderRadius: 17,
    backgroundColor: '#f5c977',
  },
  farHill: {
    position: 'absolute',
    right: -24,
    bottom: 30,
    width: 240,
    height: 105,
    borderTopLeftRadius: 150,
    borderTopRightRadius: 150,
    transform: [{ rotate: '-9deg' }],
    backgroundColor: '#5d8e78',
  },
  nearHill: {
    position: 'absolute',
    left: -35,
    bottom: 19,
    width: 230,
    height: 83,
    borderTopLeftRadius: 130,
    borderTopRightRadius: 130,
    transform: [{ rotate: '10deg' }],
    backgroundColor: '#3e755e',
  },
  road: {
    position: 'absolute',
    right: 91,
    bottom: -34,
    width: 88,
    height: 105,
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    transform: [{ rotate: '-15deg' }],
    backgroundColor: '#485d52',
  },
  roadMark: {
    position: 'absolute',
    right: 129,
    bottom: 1,
    width: 4,
    height: 24,
    borderRadius: 2,
    transform: [{ rotate: '-15deg' }],
    backgroundColor: '#f4e4b7',
  },
  bus: {
    position: 'absolute',
    right: 69,
    bottom: 37,
    fontSize: 38,
  },
  sceneryCaption: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: 'rgba(6,74,59,0.78)',
  },
  sceneryCaptionText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  body: {
    paddingHorizontal: 18,
  },
  searchCard: {
    marginTop: -19,
    padding: 17,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.surface,
    shadowColor: '#17352b',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  cardHeading: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'right',
  },
  cardTitle: {
    marginTop: 3,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
  routeIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colors.primarySoft,
  },
  routeIconText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  routeFields: {
    position: 'relative',
    marginTop: 15,
    gap: 8,
  },
  routeField: {
    minHeight: 56,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 11,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 13,
    backgroundColor: '#fbfdfc',
  },
  cityDot: {
    width: 10,
    height: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 5,
  },
  destinationDot: {
    borderColor: colors.accent,
  },
  routeCopy: {
    flex: 1,
    alignItems: 'flex-end',
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 10,
    textAlign: 'right',
  },
  cityName: {
    marginTop: 2,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  swapButton: {
    position: 'absolute',
    zIndex: 1,
    top: 37,
    left: 13,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  swapGlyph: {
    color: colors.primary,
    fontSize: 19,
    fontWeight: '700',
  },
  searchMeta: {
    minHeight: 54,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 13,
  },
  metaItem: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  metaGlyph: {
    color: colors.primary,
    fontSize: 19,
  },
  metaValue: {
    marginTop: 2,
    color: colors.ink,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
  },
  metaDivider: {
    width: 1,
    height: 31,
    marginHorizontal: 8,
    backgroundColor: colors.line,
  },
  searchButton: {
    minHeight: 48,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 5,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  searchButtonText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: '800',
  },
  searchButtonGlyph: {
    color: colors.surface,
    fontSize: 20,
  },
  sectionHeading: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 25,
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 3,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'right',
  },
  sectionHint: {
    color: colors.muted,
    fontSize: 9,
    textAlign: 'left',
  },
  destinationList: {
    flexDirection: 'row-reverse',
    gap: 10,
  },
  destinationCard: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 16,
    backgroundColor: colors.surface,
  },
  destinationArtwork: {
    height: 88,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  destinationSymbol: {
    zIndex: 1,
    fontSize: 29,
  },
  destinationSun: {
    position: 'absolute',
    top: 12,
    right: 19,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#f5c977',
  },
  destinationHorizon: {
    position: 'absolute',
    right: -5,
    bottom: -27,
    left: -5,
    height: 56,
    borderTopLeftRadius: 60,
    borderTopRightRadius: 60,
    backgroundColor: 'rgba(15,110,86,0.24)',
  },
  destinationCopy: {
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  destinationName: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
    textAlign: 'right',
  },
  destinationDetail: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 9,
    textAlign: 'right',
  },
  destinationArrow: {
    position: 'absolute',
    bottom: 8,
    left: 9,
    color: colors.primary,
    fontSize: 13,
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
