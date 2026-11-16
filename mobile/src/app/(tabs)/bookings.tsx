import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

type BookingFilter = 'upcoming' | 'past';

export default function BookingsScreen() {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<BookingFilter>('upcoming');
  const isUpcoming = filter === 'upcoming';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 22, paddingBottom: insets.bottom + 28 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>رحلاتك في مكان واحد</Text>
          <Text style={styles.title}>حجوزاتي</Text>
        </View>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>▤</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        تابع تفاصيل رحلاتك القادمة وسجل رحلاتك السابقة
      </Text>

      <View style={styles.filters}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: isUpcoming }}
          onPress={() => setFilter('upcoming')}
          style={[styles.filterButton, isUpcoming && styles.filterSelected]}
        >
          <Text
            style={[
              styles.filterText,
              isUpcoming && styles.filterTextSelected,
            ]}
          >
            القادمة
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected: !isUpcoming }}
          onPress={() => setFilter('past')}
          style={[styles.filterButton, !isUpcoming && styles.filterSelected]}
        >
          <Text
            style={[
              styles.filterText,
              !isUpcoming && styles.filterTextSelected,
            ]}
          >
            السابقة
          </Text>
        </Pressable>
      </View>

      <View style={styles.emptyCard}>
        <View style={styles.illustration}>
          <View style={styles.ticket}>
            <View style={styles.ticketTop}>
              <View style={styles.ticketDot} />
              <View style={styles.ticketDash} />
              <View style={styles.ticketDot} />
            </View>
            <View style={styles.ticketBody}>
              <View style={styles.ticketLine} />
              <View style={styles.ticketLineShort} />
            </View>
          </View>
          <View style={styles.busBadge}>
            <Text style={styles.busGlyph}>⌑</Text>
          </View>
          <View style={styles.sparkleOne} />
          <View style={styles.sparkleTwo} />
        </View>

        <Text style={styles.emptyTitle}>
          {isUpcoming ? 'لا توجد رحلات قادمة' : 'لا توجد رحلات سابقة'}
        </Text>
        <Text style={styles.emptyDescription}>
          {isUpcoming
            ? 'عندما تحجز رحلة، ستظهر تفاصيلها هنا لتتمكن من الرجوع إليها بسهولة.'
            : 'ستظهر رحلاتك المكتملة هنا بعد توفر خدمة الحجز.'}
        </Text>

        <View style={styles.previewNotice}>
          <Text style={styles.noticeMark}>i</Text>
          <Text style={styles.noticeText}>
            هذه الصفحة بانتظار ربط خدمة الحجوزات. لم تُنشأ حجوزات فعلية في
            المعاينة.
          </Text>
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
          <Text style={styles.searchButtonIcon}>←</Text>
        </Pressable>
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
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerCopy: {
    alignItems: 'flex-end',
  },
  eyebrow: {
    color: colors.primary,
    fontFamily: 'Cairo_700Bold',
    fontSize: 11,
  },
  title: {
    marginTop: 1,
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 25,
  },
  headerIcon: {
    width: 43,
    height: 43,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.primarySoft,
  },
  headerIconText: {
    color: colors.primary,
    fontSize: 23,
  },
  subtitle: {
    marginTop: 4,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    textAlign: 'right',
  },
  filters: {
    flexDirection: 'row-reverse',
    gap: 8,
    marginTop: 24,
    padding: 4,
    borderRadius: 13,
    backgroundColor: '#e9efeb',
  },
  filterButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  filterSelected: {
    backgroundColor: colors.surface,
    shadowColor: '#17352b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 1,
  },
  filterText: {
    color: colors.muted,
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
  },
  filterTextSelected: {
    color: colors.primaryDark,
  },
  emptyCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 17,
    paddingHorizontal: 19,
    paddingVertical: 28,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
  illustration: {
    width: 130,
    height: 116,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 17,
    borderRadius: 40,
    backgroundColor: '#eff8f4',
  },
  ticket: {
    width: 87,
    height: 59,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#c4e4d7',
    borderRadius: 12,
    backgroundColor: colors.surface,
    transform: [{ rotate: '-7deg' }],
  },
  ticketTop: {
    height: 18,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: '#dcece5',
    backgroundColor: '#f5fbf8',
  },
  ticketDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#afd8c8',
  },
  ticketDash: {
    width: 35,
    height: 2,
    borderRadius: 2,
    backgroundColor: '#d0e7dc',
  },
  ticketBody: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 11,
  },
  ticketLine: {
    width: 49,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#dcece5',
  },
  ticketLineShort: {
    width: 29,
    height: 4,
    borderRadius: 3,
    backgroundColor: '#edf4f0',
  },
  busBadge: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#eff8f4',
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  busGlyph: {
    color: colors.surface,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 21,
    lineHeight: 25,
  },
  sparkleOne: {
    position: 'absolute',
    top: 16,
    right: 23,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accent,
  },
  sparkleTwo: {
    position: 'absolute',
    top: 35,
    left: 18,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#84c5aa',
  },
  emptyTitle: {
    color: colors.ink,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 18,
    textAlign: 'center',
  },
  emptyDescription: {
    maxWidth: 290,
    marginTop: 7,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    lineHeight: 19,
    textAlign: 'center',
  },
  previewNotice: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 8,
    alignSelf: 'stretch',
    marginTop: 18,
    padding: 11,
    borderRadius: 12,
    backgroundColor: '#f5f8f6',
  },
  noticeMark: {
    width: 18,
    height: 18,
    overflow: 'hidden',
    borderRadius: 9,
    backgroundColor: colors.primarySoft,
    color: colors.primary,
    fontFamily: 'Cairo_800ExtraBold',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  noticeText: {
    flex: 1,
    color: colors.muted,
    fontFamily: 'Cairo_400Regular',
    fontSize: 10,
    lineHeight: 16,
    textAlign: 'right',
  },
  searchButton: {
    minHeight: 47,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'stretch',
    marginTop: 17,
    borderRadius: 13,
    backgroundColor: colors.primary,
  },
  searchButtonText: {
    color: colors.surface,
    fontFamily: 'Cairo_700Bold',
    fontSize: 12,
  },
  searchButtonIcon: {
    color: colors.surface,
    fontSize: 16,
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
