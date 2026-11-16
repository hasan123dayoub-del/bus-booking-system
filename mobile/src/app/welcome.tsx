import { ImageBackground, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Route, T } from '../components/ui';
import { markWelcomeSeen } from '../lib/booking-draft';
import { colors, shadow } from '../theme';

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  // 520 of 812 in the design; kept between 380 and 560 so short or tall windows still fit
  const photoHeight = Math.round(Math.min(560, Math.max(380, useWindowDimensions().height * 0.64)));

  const leave = (to: '/' | '/sign-in' | '/register') => {
    markWelcomeSeen();
    router.replace(to);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false} bounces={false}>
      <ImageBackground source={require('../../assets/images/welcome-bus.jpg')} style={[styles.photo, { height: photoHeight }]} imageStyle={styles.photoImage} resizeMode="cover">
        <LinearGradient colors={['rgba(6,74,59,0.35)', 'transparent']} style={StyleSheet.absoluteFill} />
        <View style={[styles.topBar, { marginTop: insets.top + 12 }]}>
          <View style={styles.brand}>
            <View style={styles.logo}>
              <Ionicons name="bus-outline" size={26} color={colors.primary} />
            </View>
            <T w="bold" size={28} color="#fff">رحلتي</T>
          </View>
          <Pressable style={styles.skip} onPress={() => leave('/')}>
            <T w="medium" size={15} color="#fff">تخطي</T>
          </Pressable>
        </View>
      </ImageBackground>

      {/* Sample trip card, part of the welcome illustration */}
      <View style={styles.tripCard}>
        <View style={styles.tripIcon}>
          <Ionicons name="bus-outline" size={24} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Route from="دمشق" to="حلب" size={18} />
          <T size={13} color={colors.muted}>اليوم · 08:30 ص · درجة أولى</T>
        </View>
        <View style={styles.seatsPill}>
          <T w="medium" size={13} color={colors.primary}>12 مقعد</T>
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 18 }]}>
        <T w="bold" size={24} style={{ textAlign: 'center' }}>سافر بين المحافظات بكل راحة</T>
        <T size={15} color={colors.muted} style={{ textAlign: 'center', marginTop: 4 }}>
          اطّلع على الرحلات والأسعار، واختر مقعدك على خريطة الباص بنفسك.
        </T>
        <View style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
        <Button label="ابدأ الآن" icon="arrow-back" onPress={() => leave('/register')} />
        <Pressable onPress={() => leave('/sign-in')} style={styles.haveAccount}>
          <T w="bold" size={15} color={colors.primary}>سجّل الدخول</T>
          <T size={15} color={colors.muted}>لديك حساب؟</T>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  photo: { overflow: 'hidden', borderBottomLeftRadius: 40, borderBottomRightRadius: 40 },
  photoImage: { width: '100%', height: '100%' },
  topBar: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24 },
  brand: { flexDirection: 'row-reverse', alignItems: 'center', gap: 10 },
  logo: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  skip: { height: 32, paddingHorizontal: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.28)', justifyContent: 'center' },
  tripCard: {
    marginTop: -74,
    marginHorizontal: 24,
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
    ...shadow,
  },
  tripIcon: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  seatsPill: { height: 26, paddingHorizontal: 10, borderRadius: 13, backgroundColor: colors.primarySoft, justifyContent: 'center' },
  bottom: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 22, justifyContent: 'flex-end', gap: 6 },
  dots: { flexDirection: 'row-reverse', justifyContent: 'center', gap: 6, marginVertical: 18 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#C8D1CE' },
  dotActive: { width: 24, backgroundColor: colors.primary },
  haveAccount: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 8 },
});
